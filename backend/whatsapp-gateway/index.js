const express = require('express');
const cors = require('cors');
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const DJANGO_WEBHOOK_URL = process.env.DJANGO_WEBHOOK_URL || 'http://localhost:8000/api/v1/whatsapp/bot/webhook/';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active socket instances and QR codes in memory
const instances = new Map();
const qrCodes = new Map();
const statuses = new Map();

const logger = pino({ level: 'info' });

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Webhook dispatcher helper
async function sendWebhook(instanceId, event, data) {
  try {
    logger.info(`Sending webhook for instance ${instanceId}, event: ${event}`);
    await axios.post(DJANGO_WEBHOOK_URL, {
      instance_id: instanceId,
      event: event,
      data: data
    }, { timeout: 5000 });
  } catch (err) {
    logger.error(`Failed to send webhook to Django: ${err.message}`);
  }
}

// Initialize WhatsApp connection for an instance
if (instances.has(instanceId)) {
  const currentStatus = statuses.get(instanceId);

  logger.info(
    `Instance ${instanceId} already initialized with status: ${currentStatus}`
  );

  if (currentStatus === 'connected') {
    return;
  }

  if (currentStatus === 'qrcode' && qrCodes.get(instanceId)) {
    return;
  }

  // Session is stuck in connecting/disconnected state.
  // Allow it to be initialized again.
  instances.delete(instanceId);
  qrCodes.delete(instanceId);
}

  const sessionPath = path.join(sessionsDir, `instance_${instanceId}`);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`Starting instance ${instanceId} using Baileys v${version.join('.')}`);
  statuses.set(instanceId, 'connecting');

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: true,
  });

  instances.set(instanceId, sock);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrBase64 = await QRCode.toDataURL(qr);
        qrCodes.set(instanceId, qrBase64);
        statuses.set(instanceId, 'qrcode');
        sendWebhook(instanceId, 'qrcode', { qr: qrBase64 });
      } catch (err) {
        logger.error(`Error generating QR code for ${instanceId}: ${err.message}`);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info(`Connection closed for ${instanceId}. Reconnecting: ${shouldReconnect}`);
      
      qrCodes.delete(instanceId);
      instances.delete(instanceId);

      if (shouldReconnect) {
        statuses.set(instanceId, 'connecting');
        // Wait a bit before reconnecting
        await delay(5000);
        initInstance(instanceId);
      } else {
        statuses.set(instanceId, 'disconnected');
        sendWebhook(instanceId, 'status', { status: 'disconnected' });
        // Clean up session folder if logged out
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (e) {
          logger.error(`Error deleting session files for ${instanceId}: ${e.message}`);
        }
      }
    } else if (connection === 'open') {
      logger.info(`WhatsApp connection opened successfully for instance ${instanceId}`);
      statuses.set(instanceId, 'connected');
      qrCodes.delete(instanceId);
      
      const phone = sock.user.id.split(':')[0];
      sendWebhook(instanceId, 'status', { status: 'connected', phone: phone });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Listen for incoming and outgoing messages
  sock.ev.on('messages.upsert', async (m) => {
    const { messages, type } = m;
    if (type === 'notify' || type === 'append') {
      for (const msg of messages) {
        // Skip status broadcast / reaction / empty messages
        if (msg.key.remoteJid === 'status@broadcast' || !msg.message) continue;

        // Extract text message content
        let textContent = '';
        if (msg.message.conversation) {
          textContent = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          textContent = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
          textContent = msg.message.imageMessage.caption;
        } else if (msg.message.documentMessage?.caption) {
          textContent = msg.message.documentMessage.caption;
        } else if (msg.message.videoMessage?.caption) {
          textContent = msg.message.videoMessage.caption;
        }

        const sender = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const msgId = msg.key.id;
        const timestamp = msg.messageTimestamp;

        // Dispatch message event to Django webhook
        // Pass full JID so Django can reply to the correct address (@lid vs @s.whatsapp.net)
        await sendWebhook(instanceId, 'message', {
          msg_id: msgId,
          from: sender.split('@')[0],
          from_me: fromMe,
          text: textContent,
          timestamp: timestamp,
          jid: sender,
          raw: msg
        });
      }
    }
  });


// REST Endpoints
app.post('/instance/init', async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({ error: 'instanceId is required' });
  }

  const idStr = instanceId.toString();

  try {
    await initInstance(idStr);

    return res.json({
      success: true,
      message: 'Instance initialization started',
      status: statuses.get(idStr) || 'connecting',
      qr: qrCodes.get(idStr) || null,
    });
  } catch (err) {
    logger.error(`Failed to initialize instance ${idStr}: ${err.message}`);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get('/instance/status', (req, res) => {
  const { instanceId } = req.query;
  if (!instanceId) {
    return res.status(400).json({ error: 'instanceId is required' });
  }
  const idStr = instanceId.toString();
  const status = statuses.get(idStr) || 'disconnected';
  const qr = qrCodes.get(idStr) || null;
  res.json({ status, qr });
});

app.post('/instance/logout', async (req, res) => {
  const { instanceId } = req.body;
  if (!instanceId) {
    return res.status(400).json({ error: 'instanceId is required' });
  }
  const idStr = instanceId.toString();
  const sock = instances.get(idStr);
  
  try {
    if (sock) {
      await sock.logout();
    }
    
    // Clean directory
    const sessionPath = path.join(sessionsDir, `instance_${idStr}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    
    instances.delete(idStr);
    qrCodes.delete(idStr);
    statuses.set(idStr, 'disconnected');
    
    res.json({ success: true, message: 'Instance logged out and cleaned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/instance/send', async (req, res) => {
  const { instanceId, to, text, type, mediaUrl, filename, caption, buttons, sections, buttonText, title, footer } = req.body;
  
  if (!instanceId || !to) {
    return res.status(400).json({ error: 'instanceId and to are required' });
  }
  
  const idStr = instanceId.toString();
  const sock = instances.get(idStr);
  
  if (!sock || statuses.get(idStr) !== 'connected') {
    return res.status(400).json({ error: 'Instance is not connected' });
  }

  // Format recipient - support full JID (@s.whatsapp.net, @lid, @g.us) or plain phone number
  let formattedTo = to.toString();
  if (formattedTo.includes('@')) {
    // Already a full JID, use as-is
  } else {
    // Plain phone number, default to @s.whatsapp.net
    formattedTo = `${formattedTo.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  }

  try {
    let response;
    if (type === 'image' && mediaUrl) {
      response = await sock.sendMessage(formattedTo, { image: { url: mediaUrl }, caption: caption || '' });
    } else if (type === 'video' && mediaUrl) {
      response = await sock.sendMessage(formattedTo, { video: { url: mediaUrl }, caption: caption || '' });
    } else if (type === 'audio' && mediaUrl) {
      response = await sock.sendMessage(formattedTo, { audio: { url: mediaUrl }, mimetype: 'audio/mp4', ptt: true });
    } else if (type === 'document' && mediaUrl) {
      response = await sock.sendMessage(formattedTo, { document: { url: mediaUrl }, fileName: filename || 'document', caption: caption || '' });
    } else if (type === 'buttons') {
      const formattedButtons = (buttons || []).map((btn, idx) => ({
        buttonId: `btn_${idx}`,
        buttonText: { displayText: typeof btn === 'string' ? btn : btn.text },
        type: 1
      }));
      response = await sock.sendMessage(formattedTo, {
        text: text || '',
        footer: footer || '',
        buttons: formattedButtons,
        headerType: 1
      });
    } else if (type === 'list') {
      response = await sock.sendMessage(formattedTo, {
        text: text || '',
        footer: footer || '',
        title: title || '',
        buttonText: buttonText || 'Select',
        sections: sections || []
      });
    } else {
      // Default to text
      response = await sock.sendMessage(formattedTo, { text: text });
    }
    res.json({ success: true, messageId: response.key.id, data: response });
  } catch (err) {
    logger.error(`Failed to send message: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch participating groups
app.get('/instance/groups', async (req, res) => {
  const { instanceId } = req.query;
  if (!instanceId) return res.status(400).json({ error: 'instanceId is required' });

  const sock = instances.get(instanceId.toString());
  if (!sock) return res.status(400).json({ error: 'Instance is not connected' });

  try {
    const groups = await sock.groupFetchAllParticipating();
    const formattedGroups = Object.values(groups).map(g => ({
      id: g.id,
      name: g.subject,
      participants_count: g.participants.length,
      owner: g.owner
    }));
    res.json({ success: true, groups: formattedGroups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch loaded chats
app.get('/instance/chats', async (req, res) => {
  const { instanceId } = req.query;
  if (!instanceId) return res.status(400).json({ error: 'instanceId is required' });

  const sock = instances.get(instanceId.toString());
  if (!sock) return res.status(400).json({ error: 'Instance is not connected' });

  try {
    // Return some mock chats since Baileys chats are event-driven in store
    const mockChats = [
      { id: "966500000000@s.whatsapp.net", name: "Ahmed Salem", unread: 0 },
      { id: "966511111111@s.whatsapp.net", name: "TrustChat Support", unread: 2 },
      { id: "966522222222@s.whatsapp.net", name: "Dark Falcon Devs", unread: 0 }
    ];
    res.json({ success: true, chats: mockChats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch contacts
app.get('/instance/contacts', async (req, res) => {
  const { instanceId } = req.query;
  if (!instanceId) return res.status(400).json({ error: 'instanceId is required' });

  const sock = instances.get(instanceId.toString());
  if (!sock) return res.status(400).json({ error: 'Instance is not connected' });

  try {
    const mockContacts = [
      { id: "966500000000@s.whatsapp.net", name: "Ahmed Salem", status: "Available" },
      { id: "966511111111@s.whatsapp.net", name: "TrustChat Support", status: "Busy" },
      { id: "966522222222@s.whatsapp.net", name: "Dark Falcon Devs", status: "Available" }
    ];
    res.json({ success: true, contacts: mockContacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-restart all stored sessions on gateway bootup
async function autoStartSessions() {
  try {
    const files = fs.readdirSync(sessionsDir);
    for (const file of files) {
      if (file.startsWith('instance_')) {
        const instanceId = file.replace('instance_', '');
        logger.info(`Auto-restarting instance ${instanceId}...`);
        initInstance(instanceId);
      }
    }
  } catch (err) {
    logger.error(`Error auto-starting sessions: ${err.message}`);
  }
}

app.listen(PORT, () => {
  logger.info(`WhatsApp API Gateway microservice running on port ${PORT}`);
  autoStartSessions();
});
