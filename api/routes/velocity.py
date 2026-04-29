from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/teams", tags=["velocity"])


@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    from clickhouse.client import execute

    try:
        velocity = execute(f"""
            SELECT toDate(occurred_at) as date, count() as tasks
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type = 'task_completed'
            AND occurred_at > now() - INTERVAL 30 DAY
            GROUP BY date
            ORDER BY date
        """)
    except:
        velocity = []

    try:
        cycle_time = execute(f"""
            SELECT toDate(occurred_at) as date, event_type, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type IN ('task_created', 'task_completed')
            AND occurred_at > now() - INTERVAL 14 DAY
            GROUP BY date, event_type
            ORDER BY date
        """)
    except:
        cycle_time = []

    try:
        lead_time = execute(f"""
            SELECT toDate(occurred_at) as date, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'git'
            AND event_type = 'pr_merged'
            AND occurred_at > now() - INTERVAL 14 DAY
            GROUP BY date
            ORDER BY date
        """)
    except:
        lead_time = []

    return {
        "team_id": team_id,
        "velocity": [{"date": str(r[0]), "tasks": r[1]} for r in velocity],
        "cycle_time": [{"date": str(r[0]), "type": r[1], "count": r[2]} for r in cycle_time],
        "lead_time": [{"date": str(r[0]), "count": r[1]} for r in lead_time]
    }