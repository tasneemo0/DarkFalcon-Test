import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "TrustChat - WhatsApp Business API Platform | منصة واتساب للأعمال",
  description: "أرسل واستقبل رسائل واتساب عبر API الرسمية من Meta. منصة TrustChat توفر حلاً متكاملاً لإرسال الرسائل، إدارة القوالب، الـ Webhooks، والتقارير.",
  keywords: "WhatsApp API, WhatsApp Business, Cloud API, Meta, messaging, SaaS, واتساب, API, TrustChat",
  authors: [{ name: "TrustChat" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#E8833A",
  openGraph: {
    title: "TrustChat - WhatsApp Business API Platform",
    description: "Send and receive WhatsApp messages via Meta's official API",
    type: "website",
    siteName: "TrustChat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}