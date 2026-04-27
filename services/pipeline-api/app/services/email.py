import json
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from hashlib import sha256
from pathlib import Path

import boto3
from jinja2 import Environment
from jinja2 import FileSystemLoader
from jinja2 import select_autoescape
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.domain import Candidate
from app.models.domain import EmailLog
from app.models.domain import ReferralRedemption
from app.time import utc_now


def get_template_environment() -> Environment:
    template_root = Path(__file__).resolve().parents[1] / "templates"
    return Environment(
        loader=FileSystemLoader(template_root),
        autoescape=select_autoescape(["html", "xml"]),
    )


def render_email(template_name: str, context: dict) -> str:
    environment = get_template_environment()
    template = environment.get_template(f"email/{template_name}")
    return template.render(**context)


def has_ses_config(settings: Settings) -> bool:
    return bool(settings.aws_region and settings.ses_from_email)


def has_smtp_config(settings: Settings) -> bool:
    return bool(
        settings.ses_from_email
        and settings.ses_smtp_host
        and settings.ses_smtp_port
        and settings.ses_smtp_username
        and settings.ses_smtp_password
    )


def render_magic_link_text(magic_link: str, expires_at: datetime) -> str:
    return "\n".join([
        "Your RunTime Resume dashboard link is ready.",
        "",
        f"Open your dashboard: {magic_link}",
        f"This link expires at {expires_at.isoformat()} UTC.",
        "",
        "If you did not request this, you can ignore this email."
    ])


def render_representation_welcome_text(candidate_name: str) -> str:
    return "\n".join([
        f"Hi {candidate_name},",
        "",
        "Thanks for confirming that you're open to RunTime representation.",
        "Our team can now consider you for suitable roles and may reach out when there is a relevant fit.",
        "",
        "You can update your preferences any time from your RunTime Resume dashboard.",
    ])


def render_referral_reward_text(candidate_name: str, reward_code: str, expires_at: datetime | None) -> str:
    expiry_copy = f"This reward expires at {expires_at.isoformat()} UTC." if expires_at else "This reward is available for one use."
    return "\n".join([
        f"Hi {candidate_name},",
        "",
        "One of your referral codes just converted into a paid RunTime Resume order.",
        f"Your reward code is {reward_code}.",
        "It gives you $30 off a future RunTime Resume order.",
        expiry_copy,
        "",
        "You can redeem it on the order page at checkout.",
    ])


def render_role_match_text(candidate_name: str, title: str, company: str, location: str, url: str, summary: str) -> str:
    lines = [
        f"Hi {candidate_name},",
        "",
        "We found a role that looks relevant based on your RunTime Resume preferences.",
        f"Role: {title}",
        f"Company: {company}",
        f"Location: {location}",
        f"View role: {url}",
    ]
    if summary:
        lines.extend(["", summary])
    return "\n".join(lines)


def render_share_prompt_text(customer_name: str, share_url: str) -> str:
    return "\n".join([
        f"Hi {customer_name},",
        "",
        "Your RunTime Resume delivery is complete. If it helped, sharing it on LinkedIn helps us reach more candidates.",
        f"Share here: {share_url}",
    ])


def render_refresh_offer_text(customer_name: str, refresh_link: str) -> str:
    return "\n".join([
        f"Hi {customer_name},",
        "",
        "It has almost been a year since your RunTime Resume work was delivered.",
        "If you are preparing for a new search, you can refresh it now.",
        f"Review options: {refresh_link}",
    ])


def render_placed_followup_text(customer_name: str, referral_link: str, referral_code: str) -> str:
    return "\n".join([
        f"Hi {customer_name},",
        "",
        "Congrats on your placement update.",
        "If you know someone else who needs RunTime Resume support, you can share your referral link.",
        f"Referral code: {referral_code}",
        f"Referral link: {referral_link}",
    ])


class EmailService:
    def _get_ses_client(self, settings: Settings):
        return boto3.client("sesv2", region_name=settings.aws_region)

    def _send_via_smtp(
        self,
        settings: Settings,
        *,
        recipient: str,
        subject: str,
        html: str,
        text: str,
    ) -> dict:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.ses_from_email
        message["To"] = recipient
        if settings.ses_reply_to:
            message["Reply-To"] = settings.ses_reply_to
        message.set_content(text)
        message.add_alternative(html, subtype="html")

        if settings.ses_smtp_port == 465:
            with smtplib.SMTP_SSL(
                settings.ses_smtp_host,
                settings.ses_smtp_port,
                context=ssl.create_default_context(),
            ) as smtp:
                smtp.login(settings.ses_smtp_username, settings.ses_smtp_password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(settings.ses_smtp_host, settings.ses_smtp_port) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                smtp.login(settings.ses_smtp_username, settings.ses_smtp_password)
                smtp.send_message(message)

        return {"delivery_mode": "smtp", "message_id": message.get("Message-Id")}

    def _send_logged_email(
        self,
        session: Session,
        settings: Settings,
        *,
        candidate_id: int | None,
        order_session_id: str | None,
        recipient: str,
        template_id: str,
        subject: str,
        html: str,
        text: str,
        preview_payload: dict,
    ) -> dict:
        existing = (
            session.query(EmailLog)
            .filter(EmailLog.template_id == template_id, EmailLog.recipient == recipient)
            .order_by(EmailLog.id.desc())
            .first()
        )
        if existing is not None:
            return {"delivery_mode": "already_sent", "ses_message_id": existing.ses_message_id}

        log_row = EmailLog(
            candidate_id=candidate_id,
            order_session_id=order_session_id,
            template_id=template_id,
            recipient=recipient,
            subject=subject,
            status="rendered",
            provider_payload_json=json.dumps(preview_payload),
            sent_at=utc_now(),
        )
        session.add(log_row)
        session.flush()

        if has_smtp_config(settings):
            response = self._send_via_smtp(
                settings,
                recipient=recipient,
                subject=subject,
                html=html,
                text=text,
            )
            log_row.status = "sent"
            log_row.ses_message_id = response.get("message_id")
            log_row.provider_payload_json = json.dumps({
                **preview_payload,
                "mode": "smtp",
                "message_id": response.get("message_id"),
            })
            session.flush()
            return {"delivery_mode": "smtp", "ses_message_id": response.get("message_id")}

        if has_ses_config(settings):
            client = self._get_ses_client(settings)
            request_payload = {
                "FromEmailAddress": settings.ses_from_email,
                "Destination": {"ToAddresses": [recipient]},
                "Content": {
                    "Simple": {
                        "Subject": {"Data": subject},
                        "Body": {
                            "Text": {"Data": text},
                            "Html": {"Data": html},
                        },
                    }
                },
            }
            if settings.ses_reply_to:
                request_payload["ReplyToAddresses"] = [settings.ses_reply_to]

            response = client.send_email(**request_payload)
            log_row.status = "sent"
            log_row.ses_message_id = response.get("MessageId")
            log_row.provider_payload_json = json.dumps({
                **preview_payload,
                "mode": "ses",
                "message_id": response.get("MessageId"),
            })
            session.flush()
            return {"delivery_mode": "ses", "ses_message_id": response.get("MessageId")}

        if not has_ses_config(settings) and not has_smtp_config(settings):
            log_row.status = "preview_only"
            session.flush()
            return {"delivery_mode": "preview"}
        return {"delivery_mode": "preview"}

    def send_magic_link_email(
        self,
        session: Session,
        settings: Settings,
        candidate: Candidate,
        magic_link: str,
        expires_at: datetime,
    ) -> dict:
        subject = "Your RunTime Resume dashboard link"
        html = render_email(
            "magic_link.html",
            {
                "heading": "Your dashboard link is ready",
                "magic_link": magic_link,
                "expires_at": expires_at.isoformat(),
                "candidate_name": candidate.full_name or candidate.email,
            },
        )
        text = render_magic_link_text(magic_link, expires_at)
        result = self._send_logged_email(
            session,
            settings,
            candidate_id=candidate.id,
            order_session_id=candidate.order_session_id,
            recipient=candidate.email,
            template_id=f"magic_link:{sha256(magic_link.encode('utf-8')).hexdigest()[:16]}",
            subject=subject,
            html=html,
            text=text,
            preview_payload={
                "mode": "preview",
                "magic_link": magic_link,
                "expires_at": expires_at.isoformat(),
            },
        )
        return {
            "delivery_mode": result["delivery_mode"],
            "magic_link_preview": magic_link if result["delivery_mode"] == "preview" else None,
        }

    def send_representation_welcome_email(
        self,
        session: Session,
        settings: Settings,
        candidate: Candidate,
    ) -> dict:
        candidate_name = candidate.full_name or candidate.email
        subject = "You’re now open to RunTime representation"
        html = render_email(
            "representation_welcome.html",
            {
                "heading": "You’re now open to representation",
                "candidate_name": candidate_name,
            },
        )
        text = render_representation_welcome_text(candidate_name)
        return self._send_logged_email(
            session,
            settings,
            candidate_id=candidate.id,
            order_session_id=candidate.order_session_id,
            recipient=candidate.email,
            template_id="representation_welcome",
            subject=subject,
            html=html,
            text=text,
            preview_payload={"mode": "preview"},
        )

    def send_referral_reward_email(
        self,
        session: Session,
        settings: Settings,
        candidate: Candidate,
        redemption: ReferralRedemption,
    ) -> dict:
        if redemption.reward_email_sent_at:
            return {"delivery_mode": "already_sent"}

        reward_code = redemption.reward_discount_code or ""
        candidate_name = candidate.full_name or candidate.email
        subject = "Your RunTime Resume referral reward is ready"
        html = render_email(
            "referral_reward.html",
            {
                "heading": "Your referral reward is ready",
                "candidate_name": candidate_name,
                "reward_code": reward_code,
                "expires_at": redemption.reward_expires_at.isoformat() if redemption.reward_expires_at else "",
            },
        )
        text = render_referral_reward_text(candidate_name, reward_code, redemption.reward_expires_at)

        return self._send_logged_email(
            session,
            settings,
            candidate_id=candidate.id,
            order_session_id=candidate.order_session_id,
            recipient=candidate.email,
            template_id="referral_reward",
            subject=subject,
            html=html,
            text=text,
            preview_payload={
                "mode": "preview",
                "redemption_id": redemption.id,
                "reward_code": reward_code,
            },
        )

    def send_role_match_email(
        self,
        session: Session,
        settings: Settings,
        candidate: Candidate,
        *,
        template_id: str,
        subject: str,
        title: str,
        company: str,
        location: str,
        url: str,
        summary: str,
    ) -> dict:
        html = render_email(
            "role_match.html",
            {
                "heading": "A role match is ready",
                "candidate_name": candidate.full_name or candidate.email,
                "title": title,
                "company": company,
                "location": location,
                "url": url,
                "summary": summary,
            },
        )
        text = render_role_match_text(candidate.full_name or candidate.email, title, company, location, url, summary)
        return self._send_logged_email(
            session,
            settings,
            candidate_id=candidate.id,
            order_session_id=candidate.order_session_id,
            recipient=candidate.email,
            template_id=template_id,
            subject=subject,
            html=html,
            text=text,
            preview_payload={
                "mode": "preview",
                "job_title": title,
                "company": company,
                "url": url,
            },
        )

    def send_share_prompt_email(
        self,
        session: Session,
        settings: Settings,
        *,
        recipient: str,
        customer_name: str,
        order_session_id: str,
        share_url: str,
    ) -> dict:
        subject = "Share your RunTime Resume on LinkedIn"
        html = render_email(
            "share_prompt.html",
            {"heading": "Share your result", "customer_name": customer_name, "share_url": share_url},
        )
        text = render_share_prompt_text(customer_name, share_url)
        return self._send_logged_email(
            session,
            settings,
            candidate_id=None,
            order_session_id=order_session_id,
            recipient=recipient,
            template_id=f"share_prompt:{order_session_id}",
            subject=subject,
            html=html,
            text=text,
            preview_payload={"mode": "preview", "share_url": share_url},
        )

    def send_refresh_offer_email(
        self,
        session: Session,
        settings: Settings,
        *,
        recipient: str,
        customer_name: str,
        order_session_id: str,
        refresh_link: str,
    ) -> dict:
        subject = "Refresh your RunTime Resume"
        html = render_email(
            "refresh_offer.html",
            {"heading": "Refresh your resume", "customer_name": customer_name, "refresh_link": refresh_link},
        )
        text = render_refresh_offer_text(customer_name, refresh_link)
        return self._send_logged_email(
            session,
            settings,
            candidate_id=None,
            order_session_id=order_session_id,
            recipient=recipient,
            template_id=f"refresh_offer:{order_session_id}",
            subject=subject,
            html=html,
            text=text,
            preview_payload={"mode": "preview", "refresh_link": refresh_link},
        )

    def send_placed_followup_email(
        self,
        session: Session,
        settings: Settings,
        *,
        candidate: Candidate,
        referral_code: str,
        referral_link: str,
    ) -> dict:
        subject = "Know someone else who needs RunTime Resume help?"
        html = render_email(
            "placed_followup.html",
            {
                "heading": "Share your referral link",
                "customer_name": candidate.full_name or candidate.email,
                "referral_code": referral_code,
                "referral_link": referral_link,
            },
        )
        text = render_placed_followup_text(candidate.full_name or candidate.email, referral_link, referral_code)
        return self._send_logged_email(
            session,
            settings,
            candidate_id=candidate.id,
            order_session_id=candidate.order_session_id,
            recipient=candidate.email,
            template_id=f"placed_followup:{candidate.id}",
            subject=subject,
            html=html,
            text=text,
            preview_payload={"mode": "preview", "referral_code": referral_code, "referral_link": referral_link},
        )
