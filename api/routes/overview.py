from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/teams", tags=["overview"])

@router.get("/{team_id}/overview")
def get_overview(team_id: str):
    from clickhouse.client import execute
    
    try:
        prs_awaiting = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'git'
            AND event_type IN ('pr_opened', 'pr_review_request')
            AND occurred_at > now() - INTERVAL 2 DAY
        """)[0][0]
    except:
        prs_awaiting = 0
    
    try:
        blocked_tasks = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type = 'task_blocked'
            AND occurred_at > now() - INTERVAL 1 DAY
        """)[0][0]
    except:
        blocked_tasks = 0
    
    try:
        ci_failures = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'cicd'
            AND event_type = 'pipeline_failed'
            AND occurred_at > now() - INTERVAL 1 HOUR
        """)[0][0]
    except:
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
    
    date_filter = "occurred_at > now() - INTERVAL 7 DAY"
    if from_date:
        date_filter = f"occurred_at > toDate('{from_date}')"
    if to_date:
        if from_date:
            date_filter += f" AND occurred_at < toDate('{to_date}') + INTERVAL 1 DAY"
        else:
            date_filter += f" AND occurred_at < toDate('{to_date}') + INTERVAL 1 DAY"
    if source:
        date_filter += f" AND source_type = '{source}'"
    
    try:
        result = execute(f"""
            SELECT toDate(occurred_at) as date, source_type, event_type, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND {date_filter}
            GROUP BY date, source_type, event_type
            ORDER BY date
        """)
    except Exception as e:
        print(f"Error: {e}")
        result = []
    
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
    
    alerts = []
    
    try:
        stale_prs = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'git'
            AND event_type = 'pr_opened'
            AND occurred_at < now() - INTERVAL 2 DAY
        """)[0][0]
        if stale_prs > 0:
            alerts.append(f"{stale_prs} PRs waiting for review > 2 days")
    except:
        pass
    
    try:
        blocked = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type = 'task_blocked'
            AND occurred_at > now() - INTERVAL 1 DAY
        """)[0][0]
        if blocked > 0:
            alerts.append(f"{blocked} tasks blocked")
    except:
        pass
    
    try:
        ci_fail = execute(f"""
            SELECT count() FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'cicd'
            AND event_type = 'pipeline_failed'
            AND occurred_at > now() - INTERVAL 1 HOUR
        """)[0][0]
        if ci_fail > 0:
            alerts.append(f"{ci_fail} CI failures in last hour")
    except:
        pass
    
    return {"team_id": team_id, "insights": alerts}