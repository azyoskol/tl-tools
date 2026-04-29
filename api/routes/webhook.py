from fastapi import APIRouter, Request
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/v1/webhook", tags=["webhook"])

class WebhookEvent(BaseModel):
    source: str
    event_type: str
    team_id: str | None = None
    payload: dict | None = None

@router.post("/receive")
async def receive_webhook(event: WebhookEvent):
    from clickhouse.client import execute
    
    team_id = event.team_id or "550e8400-e29b-41d4-a716-446655440000"
    payload_str = json.dumps(event.payload or {})
    
    try:
        execute(f"""
            INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
            VALUES ('{team_id}', '{event.source}', '{event.event_type}', '{payload_str}', now())
        """)
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
    return {"status": "ok", "received": event.event_type}

@router.post("/github")
async def github_webhook(request: Request):
    from clickhouse.client import execute
    
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "push")
    team_id = "550e8400-e29b-41d4-a716-446655440000"
    
    action = payload.get("action", "")
    if event_type == "pull_request":
        action = payload.get("pull_request", {}).get("state", "opened")
        if action == "closed" and payload.get("pull_request", {}).get("merged"):
            event_type = "pr_merged"
        elif action == "closed":
            event_type = "pr_closed"
        else:
            event_type = "pr_" + action
    elif event_type == "push":
        event_type = "push"
    
    payload_str = json.dumps(payload)
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{team_id}', 'git', '{event_type}', '{payload_str}', now())
    """)
    
    return {"status": "ok"}

@router.post("/gitlab")
async def gitlab_webhook(request: Request):
    from clickhouse.client import execute
    
    payload = await request.json()
    event_type = request.headers.get("X-Gitlab-Event", "push")
    team_id = "550e8400-e29b-41d4-a716-446655440000"
    
    if event_type == "Merge Request Hook":
        event_type = "mr_" + payload.get("object_attributes", {}).get("state", "opened")
    elif event_type == "Push Hook":
        event_type = "push"
    
    payload_str = json.dumps(payload)
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{team_id}', 'git', '{event_type}', '{payload_str}', now())
    """)
    
    return {"status": "ok"}

@router.post("/jira")
async def jira_webhook(request: Request):
    from clickhouse.client import execute
    
    payload = await request.json()
    webhook_event = payload.get("webhookEvent", "")
    team_id = "550e8400-e29b-41d4-a716-446655440000"
    
    if "issue_created" in webhook_event:
        event_type = "task_created"
    elif "issue_updated" in webhook_event:
        event_type = "task_updated"
    elif "issue_deleted" in webhook_event:
        event_type = "task_deleted"
    else:
        event_type = "jira_event"
    
    payload_str = json.dumps(payload)
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{team_id}', 'pm', '{event_type}', '{payload_str}', now())
    """)
    
    return {"status": "ok"}

@router.post("/linear")
async def linear_webhook(request: Request):
    from clickhouse.client import execute
    
    payload = await request.json()
    action = payload.get("action", "")
    team_id = "550e8400-e29b-41d4-a716-446655440000"
    
    if action == "create":
        event_type = "task_created"
    elif action == "remove":
        event_type = "task_deleted"
    else:
        event_type = "task_updated"
    
    payload_str = json.dumps(payload)
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{team_id}', 'pm', '{event_type}', '{payload_str}', now())
    """)
    
    return {"status": "ok"}