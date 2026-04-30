package biz

import (
	"context"
	"errors"
	"testing"
)

type mockEventRepo struct {
	countErr     error
	activityErr  error
	topTeamsErr  error
	hourlyErr    error
	topAuthorsErr error

	countResult      int
	activityResult   []map[string]any
	topTeamsResult   []map[string]any
	hourlyResult     []map[string]any
	topAuthorsResult []map[string]any
}

func (m *mockEventRepo) CountEvents(ctx context.Context, sourceType, eventType, period string) (int, error) {
	return m.countResult, m.countErr
}

func (m *mockEventRepo) GetActivity(ctx context.Context, period string) ([]map[string]any, error) {
	return m.activityResult, m.activityErr
}

func (m *mockEventRepo) GetTopTeams(ctx context.Context, period string, limit int) ([]map[string]any, error) {
	return m.topTeamsResult, m.topTeamsErr
}

func (m *mockEventRepo) GetHourly(ctx context.Context, period string) ([]map[string]any, error) {
	return m.hourlyResult, m.hourlyErr
}

func (m *mockEventRepo) GetTopAuthors(ctx context.Context, period string, limit int) ([]map[string]any, error) {
	return m.topAuthorsResult, m.topAuthorsErr
}

func TestDashboardService_GetDashboard_returnsData(t *testing.T) {
	repo := &mockEventRepo{
		countResult: 5,
		activityResult: []map[string]any{
			{"date": "2026-04-30", "source_type": "git", "count": int64(10)},
		},
		topTeamsResult: []map[string]any{
			{"team_id": "team-1", "source_type": "git", "count": int64(100)},
		},
		hourlyResult: []map[string]any{
			{"hour": "10:00", "count": int64(50)},
		},
		topAuthorsResult: []map[string]any{
			{"author": "john", "count": int64(25)},
		},
	}

	svc := NewDashboardService(repo)
	ctx := context.Background()

	result, err := svc.GetDashboard(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Overview.PRsOpened != 5 {
		t.Errorf("expected PRsOpened=5, got %d", result.Overview.PRsOpened)
	}

	if len(result.Activity) != 1 {
		t.Errorf("expected 1 activity, got %d", len(result.Activity))
	}

	if len(result.TopTeams) != 1 {
		t.Errorf("expected 1 top team, got %d", len(result.TopTeams))
	}

	if len(result.Hourly) != 1 {
		t.Errorf("expected 1 hourly, got %d", len(result.Hourly))
	}

	if len(result.TopAuthors) != 1 {
		t.Errorf("expected 1 top author, got %d", len(result.TopAuthors))
	}
}

func TestDashboardService_GetDashboard_returnsErrorOnCountFailure(t *testing.T) {
	repo := &mockEventRepo{
		countErr: errors.New("db error"),
	}

	svc := NewDashboardService(repo)
	ctx := context.Background()

	_, err := svc.GetDashboard(ctx)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestDashboardService_GetOverview_returnsMetrics(t *testing.T) {
	repo := &mockEventRepo{
		countResult: 10,
	}

	svc := NewDashboardService(repo)
	ctx := context.Background()

	result, err := svc.GetOverview(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.PRsOpened != 10 {
		t.Errorf("expected 10, got %d", result.PRsOpened)
	}
}

func TestDashboardService_GetOverview_returnsAllZerosOnNoData(t *testing.T) {
	repo := &mockEventRepo{
		countResult: 0,
	}

	svc := NewDashboardService(repo)
	ctx := context.Background()

	result, err := svc.GetOverview(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.PRsOpened != 0 {
		t.Errorf("expected 0, got %d", result.PRsOpened)
	}
	if result.TasksBlocked != 0 {
		t.Errorf("expected 0, got %d", result.TasksBlocked)
	}
	if result.CIFailures != 0 {
		t.Errorf("expected 0, got %d", result.CIFailures)
	}
	if result.PRsMerged != 0 {
		t.Errorf("expected 0, got %d", result.PRsMerged)
	}
}