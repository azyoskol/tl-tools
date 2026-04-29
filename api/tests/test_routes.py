import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_list_teams():
    response = client.get("/api/v1/teams")
    assert response.status_code == 200


def test_health():
    response = client.get("/health/api")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"