from pathlib import Path
import sys

from apscheduler.schedulers.blocking import BlockingScheduler

PIPELINE_API_ROOT = Path(__file__).resolve().parents[1] / "pipeline-api"
if str(PIPELINE_API_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_API_ROOT))

from app.jobs.placed_followup import run_placed_followup_job
from app.jobs.refresh_offer import run_refresh_offer_job
from app.jobs.role_match import run_role_match_job
from app.jobs.share_prompt import run_share_prompt_job


def build_scheduler() -> BlockingScheduler:
    scheduler = BlockingScheduler(timezone="Australia/Sydney")
    scheduler.add_job(run_role_match_job, "interval", minutes=30, id="role-match")
    scheduler.add_job(run_share_prompt_job, "interval", hours=1, id="share-prompt")
    scheduler.add_job(run_refresh_offer_job, "cron", hour=9, minute=0, id="refresh-offer")
    scheduler.add_job(run_placed_followup_job, "cron", hour=10, minute=0, id="placed-followup")
    return scheduler


if __name__ == "__main__":
    build_scheduler().start()
