import pytest
import requests
import time

API_URL = "http://localhost:8000"

def test_webhook_receive():
    resp = requests.post(f"{API_URL}/api/v1/webhook/receive", json={
        "source": "git",
        "event_type": "e2e_test",
        "team_id": "550e8400-e29b-41d4-a716-446655440000",
        "payload": {"test": "e2e"}
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_dashboard_endpoint():
    resp = requests.get(f"{API_URL}/api/v1/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "overview" in data
    assert "activity" in data

def test_teams_endpoint():
    resp = requests.get(f"{API_URL}/api/v1/teams")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 5

def test_collectors_status():
    resp = requests.get(f"{API_URL}/api/v1/collectors/status")
    assert resp.status_code == 200

def test_dlq_endpoint():
    resp = requests.get(f"{API_URL}/api/v1/dLQ")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)

def test_health_endpoint():
    resp = requests.get(f"{API_URL}/health/api")
    assert resp.status_code == 200

def test_team_overview():
    team_id = "550e8400-e29b-41d4-a716-446655440000"
    resp = requests.get(f"{API_URL}/api/v1/teams/{team_id}/overview")
    assert resp.status_code == 200