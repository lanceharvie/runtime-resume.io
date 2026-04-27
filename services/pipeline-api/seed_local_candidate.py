from app.db import SessionLocal
from app.models.domain import Candidate
from app.models.domain import CandidateProfile
from app.models.domain import Order
from app.time import utc_now
from datetime import timedelta


SESSION_ID = "rr_local_match_seed_001"
EMAIL = "local.match.seed@example.com"
REFRESH_SESSION_ID = "rr_local_refresh_seed_001"


def main() -> None:
    session = SessionLocal()
    try:
        order = session.query(Order).filter(Order.session_id == SESSION_ID).one_or_none()
        if order is None:
            order = Order(
                session_id=SESSION_ID,
                tier="full-rewrite",
                tier_name="Full Rewrite",
                customer_email=EMAIL,
                customer_name="Local Match Seed",
                payment_status="paid",
                checkout_status="completed",
                paid_at=utc_now(),
                delivered_at=utc_now() - timedelta(hours=30),
                representation_prompt_status="accepted",
                share_prompt_status="pending",
            )
            session.add(order)
        else:
            order.delivered_at = utc_now() - timedelta(hours=30)
            order.share_prompt_status = "pending"
            order.share_prompt_sent_at = None

        refresh_order = session.query(Order).filter(Order.session_id == REFRESH_SESSION_ID).one_or_none()
        if refresh_order is None:
            refresh_order = Order(
                session_id=REFRESH_SESSION_ID,
                tier="full-rewrite",
                tier_name="Full Rewrite",
                customer_email=EMAIL,
                customer_name="Local Match Seed",
                payment_status="paid",
                checkout_status="completed",
                paid_at=utc_now() - timedelta(days=336),
                delivered_at=utc_now() - timedelta(days=336),
                refresh_email_sent=False,
            )
            session.add(refresh_order)

        candidate = session.query(Candidate).filter(Candidate.email == EMAIL).one_or_none()
        if candidate is None:
            candidate = Candidate(email=EMAIL)
            session.add(candidate)

        candidate.order_session_id = SESSION_ID
        candidate.full_name = "Local Match Seed"
        candidate.source = "runtimeresume"
        candidate.job_seek_status = "actively_looking"
        candidate.open_to_representation = True
        candidate.target_roles = "Senior Recruiter Talent Acquisition Recruiter"
        candidate.target_locations = "Sydney Remote Australia"
        candidate.salary_range = "120000-150000"
        candidate.role_types = "full-time contract"
        candidate.geographic_preference = "Sydney"
        candidate.relocation_flag = True
        candidate.updated_at = utc_now()

        session.flush()

        profile = session.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate.id).one_or_none()
        if profile is None:
            profile = CandidateProfile(candidate_id=candidate.id)
            session.add(profile)

        profile.target_companies = "RunTime Recruitment"
        profile.key_achievements = "Built recruiter workflows and filled niche roles quickly."
        profile.concerns = "Wants recruiter and TA roles only."

        session.commit()
        print({"ok": True, "session_id": SESSION_ID, "candidate_id": candidate.id, "email": candidate.email})
    finally:
        session.close()


if __name__ == "__main__":
    main()
