"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState("جاري التحقق من بريدك الإلكتروني...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("رابط التحقق غير صالح أو ناقص.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(
          `${apiUrl}/api/v1/auth/verify-email/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل التحقق من البريد الإلكتروني");
        }

        setStatus("success");
        setMessage("تم التحقق من بريدك الإلكتروني بنجاح ✅");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء التحقق من البريد الإلكتروني"
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111116",
        color: "#fff",
        padding: "24px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "40px",
          borderRadius: "20px",
          background: "#19191f",
          border: "1px solid #2c2c35",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>
          {status === "loading" && "جاري التحقق..."}
          {status === "success" && "تم التحقق"}
          {status === "error" && "تعذر التحقق"}
        </h1>

        <p style={{ opacity: 0.8, lineHeight: 1.8 }}>{message}</p>

        {status === "success" && (
          <button
            onClick={() => router.push("/auth/login")}
            style={{
              marginTop: "24px",
              padding: "12px 28px",
              border: 0,
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            تسجيل الدخول
          </button>
        )}

        {status === "error" && (
          <button
            onClick={() => router.push("/auth/register")}
            style={{
              marginTop: "24px",
              padding: "12px 28px",
              border: 0,
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            العودة للتسجيل
          </button>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}