from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/dLQ", tags=["dlq"])

@router.get("")
def list_dlq():
    from clickhouse.client import execute
    result = execute("""
        SELECT id, source_type, event_type, error_reason, retry_count, created_at
        FROM events_dlq
        ORDER BY created_at DESC
        LIMIT 100
    """)
    return [{"id": str(r[0]), "source": r[1], "event": r[2], "error": r[3], "retries": r[4], "created": str(r[5])} for r in result]

@router.get("/{event_id}")
def get_dlq_event(event_id: str):
    from clickhouse.client import execute
    result = execute(f"SELECT id, original_payload, source_type, event_type, team_id, error_reason FROM events_dlq WHERE id = '{event_id}'")
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    r = result[0]
    return {
        "id": str(r[0]),
        "payload": r[1],
        "source": r[2],
        "event": r[3],
        "team_id": str(r[4]) if r[4] else None,
        "error": r[5]
    }

@router.post("/{event_id}/retry")
def retry_dlq_event(event_id: str):
    from clickhouse.client import execute
    result = execute(f"SELECT original_payload, source_type, event_type, team_id FROM events_dlq WHERE id = '{event_id}'")
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    
    row = result[0]
    team_id = row[3] if row[3] else "550e8400-e29b-41d4-a716-446655440000"
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{team_id}', '{row[1]}', '{row[2]}', '{row[0]}', now())
    """)
    execute(f"DELETE FROM events_dlq WHERE id = '{event_id}'")
    return {"status": "retry_scheduled"}

@router.delete("/{event_id}")
def delete_dlq_event(event_id: str):
    from clickhouse.client import execute
    execute(f"DELETE FROM events_dlq WHERE id = '{event_id}'")
    return {"status": "deleted"}