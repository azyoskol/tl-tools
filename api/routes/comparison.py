from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/teams", tags=["comparison"])

@router.get("/comparison")
def get_teams_comparison() -> List[Dict[str, Any]]:
    from clickhouse.client import execute
    
    teams_data = []
    try:
        result = execute("""
            SELECT 
                toString(team_id) as team_id,
                source_type,
                event_type,
                count() as cnt
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            GROUP BY team_id, source_type, event_type
            ORDER BY team_id, source_type
        """)
        teams_data = result if result else []
    except Exception as e:
        print(f"Comparison query error: {e}")
        return []
    
    teams: Dict[str, Dict[str, Any]] = {}
    for row in teams_data:
        tid, source, etype, cnt = str(row[0]), row[1], row[2], row[3]
        if tid not in teams:
            teams[tid] = {"team_id": tid, "prs": 0, "tasks": 0, "ci_runs": 0}
        if source == "git" and etype in ("pr_opened", "pr_merged"):
            teams[tid]["prs"] += cnt
        elif source == "pm" and etype in ("task_created", "task_completed"):
            teams[tid]["tasks"] += cnt
        elif source == "cicd":
            teams[tid]["ci_runs"] += cnt
    
    return list(teams.values())