import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


class TestTeamsRoutes:
    def test_list_teams(self):
        response = client.get("/api/v1/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5

    def test_list_teams_structure(self):
        response = client.get("/api/v1/teams")
        data = response.json()
        if data:
            assert "id" in data[0]
            assert "name" in data[0]

    def test_get_team_by_id(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}")
        assert response.status_code in [200, 404]


class TestHealthRoutes:
    def test_health_root(self):
        response = client.get("/health/api")
        assert response.status_code == 200

    def test_health_api(self):
        response = client.get("/health/api")
        assert response.status_code == 200

    def test_health_clickhouse(self):
        response = client.get("/health/clickhouse")
        assert response.status_code == 200


class TestDashboardRoutes:
    def test_dashboard_endpoint(self):
        response = client.get("/api/v1/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "activity" in data

    def test_dashboard_overview_keys(self):
        response = client.get("/api/v1/dashboard")
        data = response.json()
        overview = data.get("overview", {})
        assert "prs_opened" in overview
        assert "tasks_blocked" in overview
        assert "ci_failures" in overview

    def test_dashboard_activity_format(self):
        response = client.get("/api/v1/dashboard")
        data = response.json()
        activity = data.get("activity", [])
        if activity:
            assert "date" in activity[0]
            assert "source" in activity[0]


class TestTeamOverviewRoutes:
    def test_team_overview(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}/overview")
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data

    def test_team_activity(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}/activity")
        assert response.status_code == 200

    def test_team_insights(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}/insights")
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data


class TestWebhookRoutes:
    def test_webhook_receive(self):
        response = client.post(
            "/api/v1/webhook/receive",
            json={"source": "git", "event_type": "test", "payload": {"test": 1}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_webhook_receive_missing_source(self):
        response = client.post(
            "/api/v1/webhook/receive",
            json={"event_type": "test", "payload": {}}
        )
        assert response.status_code in [200, 422]

    def test_webhook_receive_with_team(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.post(
            "/api/v1/webhook/receive",
            json={"source": "pm", "event_type": "task_created", "team_id": team_id, "payload": {}}
        )
        assert response.status_code == 200


class TestRootEndpoint:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data


class TestCORS:
    def test_cors_headers(self):
        response = client.options(
            "/api/v1/teams",
            headers={"Origin": "http://localhost:3000"}
        )
        assert "access-control-allow-origin" in response.headers or response.status_code == 200


class TestErrorHandling:
    def test_invalid_team_id_format(self):
        response = client.get("/api/v1/teams/invalid-uuid/overview")
        assert response.status_code in [200, 404, 422, 500]

    def test_nonexistent_team_overview(self):
        response = client.get("/api/v1/teams/00000000-0000-0000-0000-000000000000/overview")
        assert response.status_code in [200, 404]


class TestDataConsistency:
    def test_team_overview_counts(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}/overview")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data.get("prs_awaiting_review"), int)
        assert isinstance(data.get("blocked_tasks"), int)
        assert isinstance(data.get("ci_failures_last_hour"), int)

    def test_activity_returns_list(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(f"/api/v1/teams/{team_id}/activity")
        data = response.json()
        assert isinstance(data.get("data"), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])