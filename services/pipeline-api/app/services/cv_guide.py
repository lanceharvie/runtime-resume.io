from app.services.cv_products import CvProductsClient

PRODUCT_SLUG = "cv-guide"


class CvGuidePurchaseService:
    def __init__(self) -> None:
        self.cv_products = CvProductsClient()

    def process_stripe_event(self, session, event: dict) -> dict:
        event_type = str(event.get("type") or "")
        checkout_session = event.get("data", {}).get("object") or {}
        metadata = checkout_session.get("metadata") or {}

        if event_type != "checkout.session.completed" or metadata.get("product") != PRODUCT_SLUG:
            return {"ok": True, "ignored": True}

        buyer_email = str(checkout_session.get("customer_details", {}).get("email") or "").strip().lower()
        if not buyer_email:
            raise ValueError("No buyer email in Stripe session")

        buyer_name = str(checkout_session.get("customer_details", {}).get("name") or "").strip()

        generated = self.cv_products.generate(buyer_email=buyer_email, buyer_name=buyer_name)
        token = str(generated.get("token") or "")
        if not token:
            raise ValueError("No token from cv-products")

        download_link = f"https://downloads.runtimerecruitment.com/generated/{token}.pdf"

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import os

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your firmware CV guide is ready to download"
        msg["From"] = "Lance Harvie <lance@runtimerec.com.au>"
        msg["To"] = buyer_email

        html = f"""<html><body>
        <p>Hi {buyer_name or 'there'},</p>
        <p>Thank you for purchasing <strong>What I Actually See When I Open Your Firmware CV</strong>.</p>
        <p><a href="{download_link}" style="background:#e83527;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;">Download your guide</a></p>
        <p>This link expires in 72 hours. If you have issues email lance@runtimerecruitment.com</p>
        <p>Lance Harvie<br>RunTime Recruitment</p>
        </body></html>"""

        msg.attach(MIMEText(html, "html"))

        from app.config import get_settings
        settings = get_settings()

        with smtplib.SMTP(settings.ses_smtp_host, settings.ses_smtp_port) as smtp:
            smtp.starttls()
            smtp.login(settings.ses_smtp_username, settings.ses_smtp_password)
            smtp.sendmail("lance@runtimerec.com.au", buyer_email, msg.as_string())

        return {"ok": True, "processed": True, "download_link": download_link}
