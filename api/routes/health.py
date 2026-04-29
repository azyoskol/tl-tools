from fastapi import APIRouter
from clickhouse.driver import Client
import os

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/clickhouse")
def health_clickhouse():
    try:
        client = Client(
            host=os.getenv("CLICKHOUSE_HOST", "localhost"),
            port=int(os.getenv("CLICKHOUSE_PORT", "9000"))
        )
        client.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/api")
def health_api():
    return {"status": "ok"}