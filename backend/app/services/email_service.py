import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("buildtrack.email")


def send_email(to: str, subject: str, body: str) -> bool:
    """Send an email via SMTP. Returns True if actually sent.

    When SMTP is not configured (local development) the email is only logged
    and False is returned, so callers can fall back to dev behaviour.
    """
    if not settings.smtp_enabled:
        logger.info("[DEV EMAIL - SMTP not configured] to=%s subject=%s\n%s", to, subject, body)
        return False

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        return True
    except Exception as exc:  # never let an email failure break an API call
        logger.error("Failed to send email to %s: %s", to, exc)
        return False
