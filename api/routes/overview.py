from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/teams", tags=["overview"])

@router.get("/{team_id}/overview")
def get_overview(team_id: str):
    from clickhouse.client import execute
    
    # PRs awaiting review
    prs_awaiting = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'git'
        AND event_type = 'pr_review_request'
        AND occurred_at > now() - INTERVAL 2 DAY
    """, {"team_id": team_id})[0][0]
    
    # Blocked tasks
    blocked_tasks = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'pm'
        AND event_type = 'task_blocked'
        AND occurred_at > now() - INTERVAL 1 DAY
    """, {"team_id": team_id})[0][0]
    
    # CI failures
    ci_failures = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'cicd'
        AND event_type = 'pipeline_failed'
        AND occurred_at > now() - INTERVAL 1 HOUR
    """, {"team_id": team_id})[0][0]
    
    return {
        "team_id": team_id,
        "prs_awaiting_review": prs_awaiting,
        "blocked_tasks": blocked_tasks,
        "ci_failures_last_hour": ci_failures
    }

@router.get("/{team_id}/activity")
def get_activity(team_id: str):
    from clickhouse.client import execute
    
    result = execute("""
        SELECT toDate(occurred_at) as date, source_type, event_type, count()
        FROM events
        WHERE team_id = %(team_id)s
        AND occurred_at > now() - INTERVAL 7 DAY
        GROUP BY date, source_type, event_type
        ORDER BY date
    """, {"team_id": team_id})
    
    return {
        "team_id": team_id,
        "data": [{"date": str(r[0]), "source": r[1], "event": r[2], "count": r[3]} for r in result]
    }

@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    from clickhouse.client import execute
    
    result = execute("""
        SELECT 
            toDate(started_at) as sprint_start,
            sum(story_points) as points,
            count() as tasks
        FROM cycle_metrics
        WHERE team_id = %(team_id)s
        AND completed_at > now() - INTERVAL 30 DAY
        GROUP BY sprint_start
        ORDER BY sprint_start
    """, {"team_id": team_id})
    
    return {
        "team_id": team_id,
        "data": [{"sprint": str(r[0]), "points": r[1], "tasks": r[2]} for r in result]
    }

@router.get("/{team_id}/insights")
def get_insights(team_id: str):
    from clickhouse.client import execute
    
    # Generate attention items
    alerts = []
    
    # Check stale PRs
    stale_prs = execute("""
        SELECT count() FROM pr_metrics
        WHERE team_id = %(team_id)s
        AND merged_at IS NULL
        AND created_at < now() - INTERVAL 2 DAY
    """, {"team_id": team_id})[0][0]
    if stale_prs > 0:
        alerts.append(f"{stale_prs} PRs waiting for review > 2 days")
    
    # Check overdue tasks
    overdue = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'pm'
        AND event_type = 'task_overdue'
        AND occurred_at > now() - INTERVAL 3 DAY
    """, {"team_id": team_id})[0][0]
    if overdue > 0:
        alerts.append(f"{overdue} tasks overdue by 3+ days")
    
    return {"team_id": team_id, "insights": alerts}