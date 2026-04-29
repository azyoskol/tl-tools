import pytest

def test_dlq_table_exists():
    from clickhouse_driver import Client
    client = Client(host="localhost", port="9000")
    result = client.execute("SHOW TABLES")
    tables = [r[0] for r in result]
    assert "events_dlq" in tables

def test_events_table_exists():
    from clickhouse_driver import Client
    client = Client(host="localhost", port="9000")
    result = client.execute("SHOW TABLES")
    tables = [r[0] for r in result]
    assert "events" in tables

def test_teams_table_exists():
    from clickhouse_driver import Client
    client = Client(host="localhost", port="9000")
    result = client.execute("SHOW TABLES")
    tables = [r[0] for r in result]
    assert "teams" in tables

def test_clickhouse_connection():
    from clickhouse_driver import Client
    client = Client(host="localhost", port="9000")
    result = client.execute("SELECT 1")
    assert result[0][0] == 1