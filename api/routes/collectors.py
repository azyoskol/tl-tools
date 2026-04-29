from fastapi import APIRouter, HTTPException
from datetime import datetime

router = APIRouter(prefix="/api/v1/collectors", tags=["collectors"])

collector_status = {}

@router.post("/{collector_id}/heartbeat")
def heartbeat(collector_id: str, data: dict):
    collector_status[collector_id] = {
        "status": data.get("status", "alive"),
        "last_heartbeat": datetime.utcnow().isoformat(),
        "last_event_time": data.get("last_event_time"),
        "last_error": data.get("last_error")
    }
    return {"status": "ok"}

@router.get("/status")
def get_status():
    return collector_status

@router.get("/{collector_id}")
def get_collector(collector_id: str):
    if collector_id not in collector_status:
        return {"status": "unknown"}
    return collector_status[collector_id]