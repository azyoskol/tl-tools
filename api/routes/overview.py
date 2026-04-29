from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/teams", tags=["overview"])

ALLOWED_SOURCES = {'git', 'pm', 'cicd'}

DATE_FORMAT = '%Y-%m-%d'

def validate_date(date_str: str) -> bool:
    try:
        datetime.strptime(date_str, DATE_FORMAT)
        return True
    except (ValueError, TypeError):
        return False

def validate_source(source: str) -> bool:
    return source in ALLOWED_SOURCES

@router.get("/{team_id}/overview")
def get_overview(team_id: str):
    from clickhouse.client import execute
    
    params = {"team_id": team_id}
    
    try:
        prs_awaiting = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'git'
            AND event_type IN ('pr_opened', 'pr_review_request')
            AND occurred_at > now() - INTERVAL 2 DAY
        """, params)[0][0]
    except Exception as e:
        logger.error(f"Overview PRs query error: {e}")
        prs_awaiting = 0
    
    try:
        blocked_tasks = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'pm'
            AND event_type = 'task_blocked'
            AND occurred_at > now() - INTERVAL 1 DAY
        """, params)[0][0]
    except Exception as e:
        logger.error(f"Overview blocked tasks query error: {e}")
        blocked_tasks = 0
    
    try:
        ci_failures = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'cicd'
            AND event_type = 'pipeline_failed'
            AND occurred_at > now() - INTERVAL 1 HOUR
        """, params)[0][0]
    except Exception as e:
        logger.error(f"Overview CI failures query error: {e}")
        ci_failures = 0
    
    return {
        "team_id": team_id,
        "prs_awaiting_review": prs_awaiting,
        "blocked_tasks": blocked_tasks,
        "ci_failures_last_hour": ci_failures
    }

@router.get("/{team_id}/activity")
def get_activity(team_id: str, from_date: str = None, to_date: str = None, source: str = None):
    from clickhouse.client import execute
    
    if from_date and not validate_date(from_date):
        raise HTTPException(400, "Invalid from_date format. Use YYYY-MM-DD")
    if to_date and not validate_date(to_date):
        raise HTTPException(400, "Invalid to_date format. Use YYYY-MM-DD")
    if source and not validate_source(source):
        raise HTTPException(400, f"Invalid source. Allowed: {', '.join(ALLOWED_SOURCES)}")
    
    params = {"team_id": team_id}
    date_filter = "occurred_at > now() - INTERVAL 7 DAY"
    if from_date:
        params["from_date"] = from_date
        date_filter = "occurred_at > toDate(:from_date)"
    if to_date:
        params["to_date"] = to_date
        if from_date:
            date_filter += " AND occurred_at < toDate(:to_date) + INTERVAL 1 DAY"
        else:
            date_filter = "occurred_at < toDate(:to_date) + INTERVAL 1 DAY"
    if source:
        params["source"] = source
        date_filter += " AND source_type = :source"
    
    try:
        result = execute(f"""
            SELECT toDate(occurred_at) as date, source_type, event_type, count()
            FROM events
            WHERE team_id = :team_id
            AND {date_filter}
            GROUP BY date, source_type, event_type
            ORDER BY date
        """, params)
    except Exception as e:
        logger.error(f"Activity query error: {e}")
        raise HTTPException(500, "Failed to fetch activity data")
    
    return {
        "team_id": team_id,
        "data": [{"date": str(r[0]), "source": r[1], "event": r[2], "count": r[3]} for r in result],
        "filters": {"from": from_date, "to": to_date, "source": source}
    }

@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    return {
        "team_id": team_id,
        "data": []
    }

@router.get("/{team_id}/insights")
def get_insights(team_id: str):
    from clickhouse.client import execute
    
    params = {"team_id": team_id}
    alerts = []
    
    try:
        stale_prs = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'git'
            AND event_type = 'pr_opened'
            AND occurred_at < now() - INTERVAL 2 DAY
        """, params)[0][0]
        if stale_prs > 0:
            alerts.append(f"{stale_prs} PRs waiting for review > 2 days")
    except Exception as e:
        logger.error(f"Insights stale PRs query error: {e}")
    
    try:
        blocked = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'pm'
            AND event_type = 'task_blocked'
            AND occurred_at > now() - INTERVAL 1 DAY
        """, params)[0][0]
        if blocked > 0:
            alerts.append(f"{blocked} tasks blocked")
    except Exception as e:
        logger.error(f"Insights blocked tasks query error: {e}")
    
    try:
        ci_fail = execute("""
            SELECT count() FROM events
            WHERE team_id = :team_id
            AND source_type = 'cicd'
            AND event_type = 'pipeline_failed'
            AND occurred_at > now() - INTERVAL 1 HOUR
        """, params)[0][0]
        if ci_fail > 0:
            alerts.append(f"{ci_fail} CI failures in last hour")
    except Exception as e:
        logger.error(f"Insights CI failures query error: {e}")
    
    return {"team_id": team_id, "insights": alerts}