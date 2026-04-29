from clickhouse_driver import Client
import os
from functools import lru_cache

@lru_cache()
def get_client() -> Client:
    return Client(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_PORT", "9000")),
        database=os.getenv("CLICKHOUSE_DB", "default")
    )

def execute(query: str, params: dict = None):
    client = get_client()
    return client.execute(query, params or {})

def execute_iter(query: str, params: dict = None):
    client = get_client()
    return client.execute_iter(query, params or {})