"""Score aggregation utilities."""


def compute_weighted_score(scores: dict, rubric: dict) -> float:
    """Return weighted score using rubric weights."""
    total = 0.0
    for dimension in rubric.get("dimensions", []):
        key = dimension["key"]
        total += float(scores.get(key, 0)) * float(dimension.get("weight", 0))
    return round(total, 2)
