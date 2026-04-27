# Pipeline Operations

## Overview

The RunTime Resume pipeline now has two long-running Python processes:

- FastAPI web service: `services/pipeline-api`
- APScheduler worker: `services/pipeline-worker`

Both are designed to run from the existing `/home/lanceharvie/qdrant-env` Python environment.

## Local files

- API env file: `services/pipeline-api/.env`
- API env example: `services/pipeline-api/.env.example`
- API start script: `scripts/run_pipeline_api.sh`
- Worker start script: `scripts/run_pipeline_worker.sh`
- Systemd unit templates: `deploy/systemd/`

## One-time setup

1. Ensure the Python environment has the editable package installed:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/pip install -e .
```

2. Create or update the API env file:

```bash
cp /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api/.env.example \
  /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api/.env
```

3. Run DB migrations:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python -m alembic upgrade head
```

## Manual start

API:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume
./scripts/run_pipeline_api.sh
```

Worker:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume
./scripts/run_pipeline_worker.sh
```

## Systemd user services

Install the unit files into the user systemd directory:

```bash
mkdir -p ~/.config/systemd/user
cp /home/lanceharvie/runtime-scripts/runtime-resume/deploy/systemd/runtime-resume-pipeline-api.service ~/.config/systemd/user/
cp /home/lanceharvie/runtime-scripts/runtime-resume/deploy/systemd/runtime-resume-pipeline-worker.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable runtime-resume-pipeline-api.service
systemctl --user enable runtime-resume-pipeline-worker.service
systemctl --user start runtime-resume-pipeline-api.service
systemctl --user start runtime-resume-pipeline-worker.service
```

Check status:

```bash
systemctl --user status runtime-resume-pipeline-api.service
systemctl --user status runtime-resume-pipeline-worker.service
```

Read logs:

```bash
journalctl --user -u runtime-resume-pipeline-api.service -n 200 --no-pager
journalctl --user -u runtime-resume-pipeline-worker.service -n 200 --no-pager
```

## Useful one-shot commands

Role matcher:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python run_role_match_once.py
```

Automation jobs:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python run_automation_jobs_once.py
```

Seed local demo candidate:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python seed_local_candidate.py
```

## Current local data sources

- Role matching primary source:
  `/home/lanceharvie/runtime-scripts/jobboard-signal/jobboard.db`
- Role matching fallback source:
  `services/pipeline-api/data/role-match-feed.json`
- Placed follow-up feed:
  `services/pipeline-api/data/placed-followup-feed.json`

## Known limits

- Paddle referral/reward flow still needs a live checkout verification against the real Paddle account.
- Resume file storage and extraction are not yet migrated into the Python service.
- The dashboard is functional but not fully polished as a production candidate portal.
