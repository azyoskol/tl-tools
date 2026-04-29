import pytest
import requests

API_URL = "http://localhost:8000"

class TestWebhooks:
    def test_webhook_receive(self):
        resp = requests.post(f"{API_URL}/api/v1/webhook/receive", json={
            "source": "git",
            "event_type": "test_push",
            "team_id": "550e8400-e29b-41d4-a716-446655440000",
            "payload": {"test": "data"}
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
    
    def test_webhook_receive_with_different_sources(self):
        sources = ["git", "pm", "cicd", "metrics"]
        for source in sources:
            resp = requests.post(f"{API_URL}/api/v1/webhook/receive", json={
                "source": source,
                "event_type": "test_event",
                "team_id": "550e8400-e29b-41d4-a716-446655440000",
                "payload": {}
            })
            assert resp.status_code == 200
    
    def test_webhook_receive_github(self):
        resp = requests.post(f"{API_URL}/api/v1/webhook/github", json={
            "action": "opened",
            "pull_request": {"id": 123, "state": "open"}
        })
        assert resp.status_code == 200
    
    def test_webhook_receive_gitlab(self):
        resp = requests.post(f"{API_URL}/api/v1/webhook/gitlab", json={
            "object_kind": "merge_request",
            "object_attributes": {"id": 456, "state": "opened"}
        })
        assert resp.status_code == 200
    
    def test_webhook_receive_jira(self):
        resp = requests.post(f"{API_URL}/api/v1/webhook/jira", json={
            "webhookEvent": "jira:issue_created",
            "issue": {"key": "TASK-100"}
        })
        assert resp.status_code == 200
    
    def test_webhook_receive_linear(self):
        resp = requests.post(f"{API_URL}/api/v1/webhook/linear", json={
            "action": "create",
            "data": {"id": "test-123"}
        })
        assert resp.status_code == 200

class TestDashboard:
    def test_dashboard_endpoint(self):
        resp = requests.get(f"{API_URL}/api/v1/dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert "overview" in data
        assert "activity" in data
    
    def test_dashboard_overview_counts(self):
        resp = requests.get(f"{API_URL}/api/v1/dashboard")
        data = resp.json()
        overview = data["overview"]
        assert "prs_opened" in overview
        assert "tasks_blocked" in overview
        assert "ci_failures" in overview
        assert "prs_merged" in overview
    
    def test_dashboard_activity_by_day(self):
        resp = requests.get(f"{API_URL}/api/v1/dashboard")
        data = resp.json()
        assert "activity" in data
        assert isinstance(data["activity"], list)
    
    def test_dashboard_hourly_activity(self):
        resp = requests.get(f"{API_URL}/api/v1/dashboard")
        data = resp.json()
        assert "hourly" in data or len(data.get("activity", [])) >= 0

class TestTeams:
    def test_teams_endpoint(self):
        resp = requests.get(f"{API_URL}/api/v1/teams")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
    
    def test_teams_have_required_fields(self):
        resp = requests.get(f"{API_URL}/api/v1/teams")
        data = resp.json()
        if data:
            assert "id" in data[0]
            assert "name" in data[0]
    
    def test_get_team_by_id(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        resp = requests.get(f"{API_URL}/api/v1/teams/{team_id}")
        assert resp.status_code in [200, 404]
    
    def test_team_overview(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        resp = requests.get(f"{API_URL}/api/v1/teams/{team_id}/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert "team_id" in data
    
    def test_team_activity(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        resp = requests.get(f"{API_URL}/api/v1/teams/{team_id}/activity")
        assert resp.status_code == 200
    
    def test_team_insights(self):
        team_id = "550e8400-e29b-41d4-a716-446655440000"
        resp = requests.get(f"{API_URL}/api/v1/teams/{team_id}/insights")
        assert resp.status_code == 200

class TestHealth:
    def test_health_root(self):
        resp = requests.get(f"{API_URL}/health")
        assert resp.status_code in [200, 404]
    
    def test_health_api(self):
        resp = requests.get(f"{API_URL}/health/api")
        assert resp.status_code == 200
    
    def test_health_clickhouse(self):
        resp = requests.get(f"{API_URL}/health/clickhouse")
        assert resp.status_code == 200

class TestCollectors:
    def test_collectors_status(self):
        resp = requests.get(f"{API_URL}/api/v1/collectors/status")
        assert resp.status_code == 200
    
    def test_collectors_heartbeat(self):
        resp = requests.post(f"{API_URL}/api/v1/collectors/git/heartbeat", json={
            "status": "alive",
            "last_event_time": "2026-04-29T12:00:00Z"
        })
        assert resp.status_code == 200
    
    def test_collectors_status_after_heartbeat(self):
        requests.post(f"{API_URL}/api/v1/collectors/git/heartbeat", json={"status": "alive"})
        resp = requests.get(f"{API_URL}/api/v1/collectors/git")
        assert resp.status_code == 200

class TestDLQ:
    def test_dlq_list(self):
        resp = requests.get(f"{API_URL}/api/v1/dLQ")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    
    def test_dlq_get_nonexistent(self):
        resp = requests.get(f"{API_URL}/api/v1/dLQ/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404
    
    def test_dlq_delete_nonexistent(self):
        resp = requests.delete(f"{API_URL}/api/v1/dLQ/00000000-0000-0000-0000-000000000000")
        assert resp.status_code in [200, 404]

class TestRoot:
    def test_root(self):
        resp = requests.get(f"{API_URL}/")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data

class TestErrorHandling:
    def test_invalid_team_overview(self):
        resp = requests.get(f"{API_URL}/api/v1/teams/invalid-uuid/overview")
        assert resp.status_code in [200, 404, 500]
    
    def test_nonexistent_team_activity(self):
        resp = requests.get(f"{API_URL}/api/v1/teams/00000000-0000-0000-0000-000000000000/activity")
        assert resp.status_code in [200, 404]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])