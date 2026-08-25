'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { useT } from '@/lib/i18n';
import styles from './docs.module.css';

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/send-message',
    titleEn: 'Send Text Message',
    titleAr: 'إرسال رسالة نصية',
    descEn: 'Send a text message to a WhatsApp number',
    descAr: 'إرسال رسالة نصية إلى رقم واتساب',
    body: `{
  "to": "+966512345678",
  "type": "text",
  "body": "Hello from TrustChat!"
}`,
    response: `{
  "status": "sent",
  "message_id": "wamid.HBgNOTY2NTEyMzQ1Njc4FQIAERgSMEE5RTU",
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/send-template',
    titleEn: 'Send Template Message',
    titleAr: 'إرسال رسالة قالب',
    descEn: 'Send a pre-approved template message',
    descAr: 'إرسال رسالة قالب معتمدة مسبقاً',
    body: `{
  "to": "+966512345678",
  "template_name": "order_confirmation",
  "language": "ar",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Ahmed" },
        { "type": "text", "text": "#12345" }
      ]
    }
  ]
}`,
    response: `{
  "status": "sent",
  "message_id": "wamid.HBgNOTY2NTEyMzQ1Njc4FQIAERgS",
  "template": "order_confirmation"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/messages',
    titleEn: 'List Messages',
    titleAr: 'عرض الرسائل',
    descEn: 'Retrieve message history with pagination',
    descAr: 'عرض سجل الرسائل مع التصفح',
    body: null,
    response: `{
  "data": [
    {
      "id": "msg_abc123",
      "to": "+966512345678",
      "type": "text",
      "status": "delivered",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 150
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/numbers',
    titleEn: 'List Numbers',
    titleAr: 'عرض الأرقام',
    descEn: 'Get all connected WhatsApp numbers',
    descAr: 'عرض جميع أرقام واتساب المربوطة',
    body: null,
    response: `{
  "data": [
    {
      "phone_number_id": "1234567890",
      "display_phone_number": "+966512345678",
      "quality_rating": "GREEN",
      "status": "CONNECTED",
      "waba_id": "987654321"
    }
  ]
}`,
  },
];

const codeExamples: Record<string, (apiKey: string) => string> = {
  python: (apiKey: string) => `import requests

url = "https://api.trustchat.com/api/v1/send-message"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "to": "+966512345678",
    "type": "text",
    "body": "Hello from TrustChat!"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

  javascript: (apiKey: string) => `const response = await fetch(
  "https://api.trustchat.com/api/v1/send-message",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "+966512345678",
      type: "text",
      body: "Hello from TrustChat!",
    }),
  }
);

const data = await response.json();
console.log(data);`,

  php: (apiKey: string) => `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.trustchat.com/api/v1/send-message",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ${apiKey}",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "to" => "+966512345678",
        "type" => "text",
        "body" => "Hello from TrustChat!",
    ]),
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,

  curl: (apiKey: string) => `curl -X POST "https://api.trustchat.com/api/v1/send-message" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+966512345678",
    "type": "text",
    "body": "Hello from TrustChat!"
  }'`,

  cpp: (apiKey: string) => `#include <iostream>
#include <string>
#include <curl/curl.h>

int main() {
    CURL* curl = curl_easy_init();
    if(curl) {
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Authorization: Bearer ${apiKey}");
        headers = curl_slist_append(headers, "Content-Type: application/json");

        std::string json_data = "{\\"to\\": \\"+966512345678\\", \\"type\\": \\"text\\", \\"body\\": \\"Hello from TrustChat!\\"}";

        curl_easy_setopt(curl, CURLOPT_URL, "https://api.trustchat.com/api/v1/send-message");
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_data.c_str());

        CURLcode res = curl_easy_perform(curl);
        if(res != CURLE_OK) {
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
        }
        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);
    }
    return 0;
}`,

  csharp: (apiKey: string) => `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer ${apiKey}");

        var json = "{\\"to\\": \\"+966512345678\\", \\"type\\": \\"text\\", \\"body\\": \\"Hello from TrustChat!\\"}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api.trustchat.com/api/v1/send-message", content);
        var responseString = await response.Content.ReadAsStringAsync();

        Console.WriteLine(responseString);
    }
}`,
};

export default function DocsPage() {
  const { locale } = useApp();
  const t = useT(locale);
  const [activeTab, setActiveTab] = useState('python');
  const [activeEndpoint, setActiveEndpoint] = useState(0);

  return (
    <div className={styles.docsPage}>
      <div className={styles.docsHero}>
        <div className="container">
          <h1 className={styles.docsTitle}>
            {locale === 'ar' ? 'توثيق API' : 'API Documentation'}
          </h1>
          <p className={styles.docsSubtitle}>
            {locale === 'ar' ? 'كل ما تحتاجه للتكامل مع TrustChat API' : 'Everything you need to integrate with TrustChat API'}
          </p>
        </div>
      </div>

      <div className={`container ${styles.docsContent}`}>
        {}
        <section className={styles.docsSection}>
          <h2 className={styles.sectionTitle} id="auth">
            {locale === 'ar' ? 'المصادقة' : 'Authentication'}
          </h2>
          <div className={styles.docCard}>
            <p className={styles.docText}>
              {locale === 'ar' 
                ? 'استخدم API Key الخاص بك في جميع الطلبات عبر header المصادقة. يمكنك إنشاء مفاتيح API من لوحة التحكم.'
                : 'Use your API Key in all requests via the Authorization header. You can create API keys from the dashboard.'}
            </p>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>Header</span>
              </div>
              <pre className={styles.code}>
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </pre>
            </div>
          </div>
        </section>

        {}
        <section className={styles.docsSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'عنوان API الأساسي' : 'Base URL'}
          </h2>
          <div className={styles.docCard}>
            <div className={styles.codeBlock}>
              <pre className={styles.code}><code>https://api.trustchat.com/api/v1/</code></pre>
            </div>
          </div>
        </section>

        {}
        <section className={styles.docsSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'أمثلة الكود' : 'Code Examples'}
          </h2>
          <div className={styles.docCard}>
            <div className={styles.langTabs}>
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  className={`${styles.langTab} ${activeTab === lang ? styles.langTabActive : ''}`}
                  onClick={() => setActiveTab(lang)}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'cpp' ? 'C++' : lang === 'csharp' ? 'C#' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>{activeTab === 'curl' ? 'cURL' : activeTab === 'cpp' ? 'C++' : activeTab === 'csharp' ? 'C#' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                <button className={styles.copyBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {locale === 'ar' ? 'نسخ' : 'Copy'}
                </button>
              </div>
              <pre className={styles.code}>
                <code>{codeExamples[activeTab]('df_live_xxxxxxxxxxxxxxxxxx')}</code>
              </pre>
            </div>
          </div>
        </section>

        {}
        <section className={styles.docsSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'نقاط النهاية' : 'Endpoints'}
          </h2>
          <div className={styles.endpointsList}>
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className={`${styles.endpointCard} ${activeEndpoint === i ? styles.endpointCardActive : ''}`}
                onClick={() => setActiveEndpoint(i)}
              >
                <div className={styles.endpointHeader}>
                  <span className={`${styles.methodBadge} ${styles[`method${ep.method}`]}`}>
                    {ep.method}
                  </span>
                  <code className={styles.endpointPath}>{ep.path}</code>
                  <span className={styles.endpointTitle}>{locale === 'ar' ? ep.titleAr : ep.titleEn}</span>
                </div>
                {activeEndpoint === i && (
                  <div className={styles.endpointBody}>
                    <p className={styles.endpointDesc}>{locale === 'ar' ? ep.descAr : ep.descEn}</p>
                    {ep.body && (
                      <>
                        <h4>{locale === 'ar' ? 'جسم الطلب' : 'Request Body'}</h4>
                        <div className={styles.codeBlock}>
                          <pre className={styles.code}><code>{ep.body}</code></pre>
                        </div>
                      </>
                    )}
                    <h4>{locale === 'ar' ? 'الاستجابة' : 'Response'}</h4>
                    <div className={styles.codeBlock}>
                      <pre className={styles.code}><code>{ep.response}</code></pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {}
        <section className={styles.docsSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'أكواد الخطأ' : 'Error Codes'}
          </h2>
          <div className={styles.docCard}>
            <table className={styles.errorTable}>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'الكود' : 'Code'}</th>
                  <th>{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>200</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'نجاح' : 'Success'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>400</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'طلب غير صالح' : 'Bad Request'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>401</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'غير مصرح' : 'Unauthorized'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>403</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'محظور' : 'Forbidden'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>404</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'غير موجود' : 'Not Found'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>429</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'تجاوز الحد المسموح' : 'Rate Limit Exceeded'}</td></tr>
                <tr><td data-label={locale === 'ar' ? 'الكود' : 'Code'}><code>500</code></td><td data-label={locale === 'ar' ? 'الوصف' : 'Description'}>{locale === 'ar' ? 'خطأ داخلي' : 'Internal Server Error'}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}