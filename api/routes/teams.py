from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])

@router.get("")
def list_teams():
    from clickhouse.client import execute
    result = execute("SELECT id, name FROM teams")
    return [{"id": r[0], "name": r[1]} for r in result]

@router.get("/{team_id}")
def get_team(team_id: str):
    from clickhouse.client import execute
    result = execute(f"SELECT id, name FROM teams WHERE id = '{team_id}'")
    if not result:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"id": result[0][0], "name": result[0][1]}