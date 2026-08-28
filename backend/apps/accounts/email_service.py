import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")


def send_resend_email(to_email, subject, html):
    if not resend.api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")

    return resend.Emails.send({
        "from": "DarkFalcon <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "html": html,
    })