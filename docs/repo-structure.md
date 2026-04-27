# Proposed Repo Structure

```text
runtime-resume/
├── README.md
├── docs/
│   ├── implementation-plan.md
│   ├── build-backlog.md
│   └── repo-structure.md
├── prompts/
│   ├── system_resume_reviewer.txt
│   ├── tier1_audit.txt
│   ├── tier2_rewrite_brief.txt
│   ├── tier2_rewrite.txt
│   └── rewrite_critic.txt
├── knowledge/
│   ├── rubric.json
│   ├── recruiter_heuristics.md
│   ├── tone_guide.md
│   └── niche_keywords/
│       ├── embedded_firmware.json
│       ├── fpga.json
│       ├── dsp.json
│       ├── robotics.json
│       └── hardware_design.json
├── backend/
│   ├── README.md
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── pdf_parser.py
│   │   ├── docx_parser.py
│   │   └── resume_normalizer.py
│   ├── analysis/
│   │   ├── __init__.py
│   │   ├── deterministic_checks.py
│   │   ├── niche_classifier.py
│   │   └── scoring_engine.py
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── client.py
│   │   ├── prompt_loader.py
│   │   ├── resume_audit.py
│   │   ├── resume_rewrite.py
│   │   └── rewrite_critic.py
│   ├── reports/
│   │   ├── __init__.py
│   │   ├── tier1_report.py
│   │   ├── tier2_export.py
│   │   └── linkedin_export.py
│   └── storage/
│       ├── __init__.py
│       ├── models.py
│       └── s3_delivery.py
└── frontend/
    └── README.md
```
