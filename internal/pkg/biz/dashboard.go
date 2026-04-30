package biz

import "context"

type DashboardService struct {
	eventRepo EventRepo
}

func NewDashboardService(eventRepo EventRepo) *DashboardService {
	return &DashboardService{eventRepo: eventRepo}
}

type OverviewMetrics struct {
	PRsOpened    int `json:"prs_opened"`
	TasksBlocked int `json:"tasks_blocked"`
	CIFailures   int `json:"ci_failures"`
	PRsMerged    int `json:"prs_merged"`
}

type ActivityItem struct {
	Date       string `json:"date"`
	SourceType string `json:"source_type"`
	Count      int64  `json:"count"`
}

type TopTeam struct {
	TeamID     string `json:"team_id"`
	SourceType string `json:"source_type"`
	Count      int64  `json:"count"`
}

type HourlyStats struct {
	Hour  string `json:"hour"`
	Count int64  `json:"count"`
}

type TopAuthor struct {
	Author string `json:"author"`
	Count  int64  `json:"count"`
}

type DashboardResponse struct {
	Overview   OverviewMetrics `json:"overview"`
	Activity   []ActivityItem  `json:"activity"`
	TopTeams   []TopTeam       `json:"top_teams"`
	Hourly     []HourlyStats    `json:"hourly"`
	TopAuthors []TopAuthor     `json:"top_authors"`
}

func (s *DashboardService) GetDashboard(ctx context.Context) (DashboardResponse, error) {
	overview, err := s.GetOverview(ctx)
	if err != nil {
		return DashboardResponse{}, err
	}

	activity, err := s.GetActivity(ctx)
	if err != nil {
		return DashboardResponse{}, err
	}

	topTeams, err := s.GetTopTeams(ctx)
	if err != nil {
		return DashboardResponse{}, err
	}

	hourly, err := s.GetHourly(ctx)
	if err != nil {
		return DashboardResponse{}, err
	}

	topAuthors, err := s.GetTopAuthors(ctx)
	if err != nil {
		return DashboardResponse{}, err
	}

	return DashboardResponse{
		Overview:   overview,
		Activity:   activity,
		TopTeams:   topTeams,
		Hourly:     hourly,
		TopAuthors: topAuthors,
	}, nil
}

func (s *DashboardService) GetOverview(ctx context.Context) (OverviewMetrics, error) {
	var result OverviewMetrics

	metrics := []struct {
		target *int
		source string
		event  string
		period string
	}{
		{&result.PRsOpened, "git", "pr_opened", "INTERVAL 2 DAY"},
		{&result.TasksBlocked, "pm", "task_blocked", "INTERVAL 1 DAY"},
		{&result.CIFailures, "cicd", "pipeline_failed", "INTERVAL 1 HOUR"},
		{&result.PRsMerged, "git", "pr_merged", "INTERVAL 7 DAY"},
	}

	for _, m := range metrics {
		cnt, err := s.eventRepo.CountEvents(ctx, m.source, m.event, m.period)
		if err != nil {
			return OverviewMetrics{}, err
		}
		*m.target = cnt
	}

	return result, nil
}

func (s *DashboardService) GetActivity(ctx context.Context) ([]ActivityItem, error) {
	rows, err := s.eventRepo.GetActivity(ctx, "INTERVAL 7 DAY")
	if err != nil {
		return nil, err
	}
	var result []ActivityItem
	for _, r := range rows {
		result = append(result, ActivityItem{
			Date:       getString(r["date"]),
			SourceType: getString(r["source_type"]),
			Count:      getInt64(r["count"]),
		})
	}
	return result, nil
}

func (s *DashboardService) GetTopTeams(ctx context.Context) ([]TopTeam, error) {
	rows, err := s.eventRepo.GetTopTeams(ctx, "INTERVAL 7 DAY", 10)
	if err != nil {
		return nil, err
	}
	var result []TopTeam
	for _, r := range rows {
		result = append(result, TopTeam{
			TeamID:     getString(r["team_id"]),
			SourceType: getString(r["source_type"]),
			Count:      getInt64(r["count"]),
		})
	}
	return result, nil
}

func (s *DashboardService) GetHourly(ctx context.Context) ([]HourlyStats, error) {
	rows, err := s.eventRepo.GetHourly(ctx, "INTERVAL 24 HOUR")
	if err != nil {
		return nil, err
	}
	var result []HourlyStats
	for _, r := range rows {
		result = append(result, HourlyStats{
			Hour:  getString(r["hour"]),
			Count: getInt64(r["count"]),
		})
	}
	return result, nil
}

func (s *DashboardService) GetTopAuthors(ctx context.Context) ([]TopAuthor, error) {
	rows, err := s.eventRepo.GetTopAuthors(ctx, "INTERVAL 7 DAY", 10)
	if err != nil {
		return nil, err
	}
	var result []TopAuthor
	for _, r := range rows {
		author := getString(r["author"])
		if author == "" {
			author = "unknown"
		}
		result = append(result, TopAuthor{
			Author: author,
			Count:  getInt64(r["count"]),
		})
	}
	return result, nil
}

func getString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func getInt64(v any) int64 {
	switch n := v.(type) {
	case int64:
		return n
	case float64:
		return int64(n)
	case int:
		return int64(n)
	default:
		return 0
	}
}