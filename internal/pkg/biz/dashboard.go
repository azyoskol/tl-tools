package biz

import (
	"context"
	"sync"
)

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
	var wg sync.WaitGroup
	var mu sync.Mutex

	var result DashboardResponse

	var overviewErr, activityErr, topTeamsErr, hourlyErr, topAuthorsErr error

	wg.Add(5)

	go func() {
		defer wg.Done()
		r, err := s.GetOverview(ctx)
		mu.Lock()
		result.Overview = r
		overviewErr = err
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		r, err := s.GetActivity(ctx)
		mu.Lock()
		result.Activity = r
		activityErr = err
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		r, err := s.GetTopTeams(ctx)
		mu.Lock()
		result.TopTeams = r
		topTeamsErr = err
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		r, err := s.GetHourly(ctx)
		mu.Lock()
		result.Hourly = r
		hourlyErr = err
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		r, err := s.GetTopAuthors(ctx)
		mu.Lock()
		result.TopAuthors = r
		topAuthorsErr = err
		mu.Unlock()
	}()

	wg.Wait()

	if overviewErr != nil {
		return DashboardResponse{}, overviewErr
	}
	if activityErr != nil {
		return DashboardResponse{}, activityErr
	}
	if topTeamsErr != nil {
		return DashboardResponse{}, topTeamsErr
	}
	if hourlyErr != nil {
		return DashboardResponse{}, hourlyErr
	}
	if topAuthorsErr != nil {
		return DashboardResponse{}, topAuthorsErr
	}

	return result, nil
}

func (s *DashboardService) GetOverview(ctx context.Context) (OverviewMetrics, error) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var result OverviewMetrics
	var firstErr error

	wg.Add(4)

	go func() {
		defer wg.Done()
		cnt, err := s.eventRepo.CountEvents(ctx, "git", "pr_opened", "INTERVAL 2 DAY")
		mu.Lock()
		result.PRsOpened = cnt
		if firstErr == nil && err != nil {
			firstErr = err
		}
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		cnt, err := s.eventRepo.CountEvents(ctx, "pm", "task_blocked", "INTERVAL 1 DAY")
		mu.Lock()
		result.TasksBlocked = cnt
		if firstErr == nil && err != nil {
			firstErr = err
		}
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		cnt, err := s.eventRepo.CountEvents(ctx, "cicd", "pipeline_failed", "INTERVAL 1 HOUR")
		mu.Lock()
		result.CIFailures = cnt
		if firstErr == nil && err != nil {
			firstErr = err
		}
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		cnt, err := s.eventRepo.CountEvents(ctx, "git", "pr_merged", "INTERVAL 7 DAY")
		mu.Lock()
		result.PRsMerged = cnt
		if firstErr == nil && err != nil {
			firstErr = err
		}
		mu.Unlock()
	}()

	wg.Wait()

	if firstErr != nil {
		return OverviewMetrics{}, firstErr
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

