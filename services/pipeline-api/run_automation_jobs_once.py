from app.jobs.placed_followup import run_placed_followup_job
from app.jobs.refresh_offer import run_refresh_offer_job
from app.jobs.share_prompt import run_share_prompt_job


if __name__ == "__main__":
    print({
        "share_prompt": run_share_prompt_job(),
        "refresh_offer": run_refresh_offer_job(),
        "placed_followup": run_placed_followup_job(),
    })
