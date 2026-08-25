// ---------------------------------------------------------------------------
// Support Chat — TypeScript Types & API Client
// ---------------------------------------------------------------------------

export interface TicketMessage {
  id: number;
  ticket: number;
  sender: number;
  sender_email: string;
  sender_name: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user: number;
  user_email: string;
  user_name: string;
  assigned_to: number | null;
  assigned_admin_name: string | null;
  assigned_admin_email: string | null;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  messages?: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedTickets {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportTicket[];
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Fetch paginated list of user's tickets */
export async function fetchTickets(
  token: string,
  params: { status?: string; priority?: string; page?: number; page_size?: number } = {}
): Promise<PaginatedTickets> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
        
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));

  const res = await fetch(`${API_BASE}/api/v1/whatsapp/tickets/?${qs}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

/** Fetch single ticket with all messages */
export async function fetchTicket(token: string, id: number): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/tickets/${id}/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Ticket not found');
  return res.json();
}

/** Create a new support ticket */
export async function createTicket(
  token: string,
  data: { subject: string; description: string }
): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/tickets/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create ticket');
  }
  return res.json();
}

/** Send a reply message on a ticket */
export async function replyToTicket(
  token: string,
  ticketId: number,
  message: string
): Promise<TicketMessage> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/tickets/${ticketId}/reply/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send reply');
  }
  return res.json();
}

/** Fetch messages for a ticket */
export async function fetchTicketMessages(
  token: string,
  ticketId: number
): Promise<TicketMessage[]> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/tickets/${ticketId}/messages/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export interface AdminTicketStats {
  total: number;
  open: number;
  pending: number;
  closed: number;
  unassigned: number;
  assigned_to_me: number;
        
}

export interface AdminTicketListParams {
  search?: string;
  status?: string;
        
  assigned_to?: string;
  page?: number;
  page_size?: number;
}

/** Fetch admin stats */
export async function adminFetchStats(token: string): Promise<AdminTicketStats> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/admin/support-tickets/stats/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

/** Fetch all tickets (admin) */
export async function adminFetchTickets(
  token: string,
  params: AdminTicketListParams = {}
): Promise<PaginatedTickets> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.assigned_to) qs.set('assigned_to', params.assigned_to);
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));

  const res = await fetch(`${API_BASE}/api/v1/whatsapp/admin/support-tickets/?${qs}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch admin tickets');
  return res.json();
}

/** Fetch single ticket detail (admin) */
export async function adminFetchTicket(token: string, id: number): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/api/v1/whatsapp/admin/support-tickets/${id}/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Ticket not found');
  return res.json();
}

/** Admin reply on a ticket */
export async function adminReplyTicket(
  token: string,
  ticketId: number,
  message: string
): Promise<TicketMessage> {
  const res = await fetch(
    `${API_BASE}/api/v1/whatsapp/admin/support-tickets/${ticketId}/reply/`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ message }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to send reply');
  }
  return res.json();
}

/** Admin change ticket status */
export async function adminChangeStatus(
  token: string,
  ticketId: number,
  status: 'open' | 'pending' | 'closed'
): Promise<{ id: number; ticket_number: string; old_status: string; new_status: string }> {
  const res = await fetch(
    `${API_BASE}/api/v1/whatsapp/admin/support-tickets/${ticketId}/status/`,
    {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to change status');
  }
  return res.json();
}

/** Admin assign ticket */
export async function adminAssignTicket(
  token: string,
  ticketId: number,
  adminId: number | 'me' | null
): Promise<SupportTicket> {
  const body = adminId === null ? {} : { admin_id: adminId };
  const res = await fetch(
    `${API_BASE}/api/v1/whatsapp/admin/support-tickets/${ticketId}/assign/`,
    {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to assign ticket');
  }
  return res.json();
}
