from clickhouse_driver import Client
import os

def get_client():
    return Client(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_PORT", "9000")),
        database=os.getenv("CLICKHOUSE_DB", "default")
    )

def execute(query: str, params: dict = None):
    client = get_client()
    try:
        result = client.execute(query, params or {})
    finally:
        client.disconnect()
    return result

def execute_iter(query: str, params: dict = None):
    client = get_client()
    try:
        result = client.execute_iter(query, params or {})
    finally:
        client.disconnect()
    return result