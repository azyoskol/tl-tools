package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type mockDashboardService struct {
	resp biz.DashboardResponse
	err  error
}

func (m *mockDashboardService) GetDashboard(ctx context.Context) (biz.DashboardResponse, error) {
	return m.resp, m.err
}

type mockTeamsService struct {
	teams     []biz.Team
	team      *biz.Team
	overview  biz.TeamOverview
	activity  []biz.TeamActivity
	insights  []biz.TeamInsight
	err       error
}

func (m *mockTeamsService) List(ctx context.Context) ([]biz.Team, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.teams, nil
}

func (m *mockTeamsService) Get(ctx context.Context, teamID string) (*biz.Team, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.team, nil
}

func (m *mockTeamsService) Overview(ctx context.Context, teamID string) (biz.TeamOverview, error) {
	if m.err != nil {
		return biz.TeamOverview{}, m.err
	}
	return m.overview, nil
}

func (m *mockTeamsService) Activity(ctx context.Context, teamID string) ([]biz.TeamActivity, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.activity, nil
}

func (m *mockTeamsService) Insights(ctx context.Context, teamID string) ([]biz.TeamInsight, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.insights, nil
}

func TestDashboardHandler_ReturnsOverviewAndActivity(t *testing.T) {
	svc := &mockDashboardService{
		resp: biz.DashboardResponse{
			Overview: biz.OverviewMetrics{
				PRsOpened:    10,
				TasksBlocked: 2,
				CIFailures:   1,
				PRsMerged:    8,
			},
			Activity: []biz.ActivityItem{
				{Date: "2026-05-01", SourceType: "git", Count: 5},
			},
			TopTeams: []biz.TopTeam{
				{TeamID: "team-1", SourceType: "git", Count: 10},
			},
			Hourly: []biz.HourlyStats{
				{Hour: "10:00", Count: 5},
			},
			TopAuthors: []biz.TopAuthor{
				{Author: "alice", Count: 3},
			},
		},
	}

	h := NewDashboardHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/dashboard", nil)

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)

	overview := resp["overview"].(map[string]any)
	if overview["prs_opened"].(float64) != 10 {
		t.Errorf("expected prs_opened=10, got %v", overview["prs_opened"])
	}

	activity := resp["activity"].([]any)
	if len(activity) != 1 {
		t.Errorf("expected 1 activity item, got %d", len(activity))
	}
}

func TestDashboardHandler_ReturnsErrorOnServiceFailure(t *testing.T) {
	svc := &mockDashboardService{
		err: context.DeadlineExceeded,
	}

	h := NewDashboardHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/dashboard", nil)

	h.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestTeamsHandler_List_ReturnsTeams(t *testing.T) {
	svc := &mockTeamsService{
		teams: []biz.Team{
			{ID: "team-1", Name: "Backend Team"},
			{ID: "team-2", Name: "Frontend Team"},
		},
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams", nil)

	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var teams []biz.Team
	json.NewDecoder(w.Body).Decode(&teams)

	if len(teams) != 2 {
		t.Errorf("expected 2 teams, got %d", len(teams))
	}
	if teams[0].Name != "Backend Team" {
		t.Errorf("expected team name 'Backend Team', got %s", teams[0].Name)
	}
}

func TestTeamsHandler_Get_ReturnsTeam(t *testing.T) {
	svc := &mockTeamsService{
		team: &biz.Team{ID: "team-1", Name: "Backend Team"},
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/team-1", nil)

	h.Get(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var team biz.Team
	json.NewDecoder(w.Body).Decode(&team)

	if team.ID != "team-1" {
		t.Errorf("expected team ID 'team-1', got %s", team.ID)
	}
}

func TestTeamsHandler_Get_Returns404_WhenTeamNotFound(t *testing.T) {
	svc := &mockTeamsService{
		team: nil,
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/nonexistent", nil)

	h.Get(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}
}

func TestTeamsHandler_Overview_ReturnsOverview(t *testing.T) {
	svc := &mockTeamsService{
		overview: biz.TeamOverview{
			TeamID:               "team-1",
			PRsAwaitingReview:    5,
			PRsMerged:            10,
			BlockedTasks:         2,
			CIFailuresLastHour:   1,
		},
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/team-1/overview", nil)

	h.Overview(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var overview biz.TeamOverview
	json.NewDecoder(w.Body).Decode(&overview)

	if overview.PRsMerged != 10 {
		t.Errorf("expected prs_merged=10, got %d", overview.PRsMerged)
	}
}

func TestTeamsHandler_Activity_ReturnsActivity(t *testing.T) {
	svc := &mockTeamsService{
		activity: []biz.TeamActivity{
			{Date: "2026-05-01", SourceType: "git", EventType: "pr_opened", Count: 5},
		},
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/team-1/activity", nil)

	h.Activity(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)

	data := resp["data"].([]any)
	if len(data) != 1 {
		t.Errorf("expected 1 activity, got %d", len(data))
	}
}

func TestTeamsHandler_Insights_ReturnsInsights(t *testing.T) {
	svc := &mockTeamsService{
		insights: []biz.TeamInsight{
			{Type: "info", Message: "Insights feature coming soon"},
		},
	}

	h := NewTeamsHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/team-1/insights", nil)

	h.Insights(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)

	insights := resp["insights"].([]any)
	if len(insights) != 1 {
		t.Errorf("expected 1 insight, got %d", len(insights))
	}
}

type mockVelocityService struct {
	resp biz.VelocityResponse
	err  error
}

func (m *mockVelocityService) Get(ctx context.Context, teamID string) (biz.VelocityResponse, error) {
	return m.resp, m.err
}

func TestVelocityHandler_ReturnsVelocityData(t *testing.T) {
	svc := &mockVelocityService{
		resp: biz.VelocityResponse{
			CycleTime: []biz.VelocityPoint{
				{Date: "2026-05-01", Tasks: 5},
			},
			LeadTime: []biz.VelocityPoint{
				{Date: "2026-05-01", Tasks: 3},
			},
		},
	}

	h := NewVelocityHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/team-1/velocity", nil)

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp biz.VelocityResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if len(resp.CycleTime) != 1 {
		t.Errorf("expected 1 cycle time point, got %d", len(resp.CycleTime))
	}
}

type mockComparisonService struct {
	teams []biz.TeamComparison
	err   error
}

func (m *mockComparisonService) Get(ctx context.Context) ([]biz.TeamComparison, error) {
	return m.teams, m.err
}

func TestComparisonHandler_ReturnsTeamComparisons(t *testing.T) {
	svc := &mockComparisonService{
		teams: []biz.TeamComparison{
			{TeamID: "team-1", Name: "Backend", PRs: 10, Tasks: 5, CIRuns: 20},
			{TeamID: "team-2", Name: "Frontend", PRs: 8, Tasks: 7, CIRuns: 15},
		},
	}

	h := NewComparisonHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/comparison", nil)

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)

	teams := resp["teams"].([]any)
	if len(teams) != 2 {
		t.Errorf("expected 2 teams, got %d", len(teams))
	}
}

type mockWebhookServiceForTest struct {
	resp biz.WebhookResponse
	err  error
}

func (m *mockWebhookServiceForTest) Receive(ctx context.Context, req biz.WebhookRequest) (biz.WebhookResponse, error) {
	return m.resp, m.err
}

func TestWebhookHandler_ReturnsOk(t *testing.T) {
	svc := &mockWebhookServiceForTest{
		resp: biz.WebhookResponse{Status: "ok", EventType: "pr_opened"},
	}

	h := NewWebhookHandler(svc)
	body, _ := json.Marshal(biz.WebhookRequest{
		Source:    "git",
		EventType: "pr_opened",
		TeamID:    "550e8400-e29b-41d4-a716-446655440000",
		Payload:   map[string]any{"pr_id": 123},
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/collectors", bytes.NewReader(body))

	h.Receive(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp biz.WebhookResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got %s", resp.Status)
	}
}

func TestWebhookHandler_Returns400_OnInvalidJSON(t *testing.T) {
	svc := &mockWebhookServiceForTest{}

	h := NewWebhookHandler(svc)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/collectors", bytes.NewReader([]byte("not json")))

	h.Receive(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}