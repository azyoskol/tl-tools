from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard():
    from clickhouse.client import execute
    
    overview = {}
    for source_type, event_type, period, key in [
        ('git', 'pr_opened', 'INTERVAL 2 DAY', 'prs_opened'),
        ('pm', 'task_blocked', 'INTERVAL 1 DAY', 'tasks_blocked'),
        ('cicd', 'pipeline_failed', 'INTERVAL 1 HOUR', 'ci_failures'),
        ('git', 'pr_merged', 'INTERVAL 7 DAY', 'prs_merged'),
    ]:
        try:
            result = execute(f"""
                SELECT count() FROM events
                WHERE source_type = '{source_type}'
                AND event_type = '{event_type}'
                AND occurred_at > now() - {period}
            """)[0][0]
            overview[key] = result
        except:
            overview[key] = 0
    
    try:
        activity = execute(f"""
            SELECT toDate(occurred_at) as date, source_type, count()
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            GROUP BY date, source_type
            ORDER BY date
        """)
    except:
        activity = []
    
    try:
        teams_activity = execute(f"""
            SELECT team_id, source_type, count() as cnt
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            GROUP BY team_id, source_type
            ORDER BY cnt DESC
            LIMIT 20
        """)
    except:
        teams_activity = []
    
    try:
        hourly = execute(f"""
            SELECT toHour(occurred_at) as hour, count()
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            GROUP BY hour
            ORDER BY hour
        """)
    except:
        hourly = []
    
    try:
        authors = execute(f"""
            SELECT JSONExtractString(payload, 'author') as author, count() as cnt
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            AND payload IS NOT NULL
            GROUP BY author
            ORDER BY cnt DESC
            LIMIT 10
        """)
    except:
        authors = []
    
    return {
        "overview": overview,
        "activity": [{"date": str(r[0]), "source": r[1], "count": r[2]} for r in activity],
        "top_teams": [{"team_id": r[0], "source": r[1], "count": r[2]} for r in teams_activity],
        "hourly": [{"hour": r[0], "count": r[1]} for r in hourly],
        "top_authors": [{"author": r[0], "count": r[1]} for r in authors]
    }