package biz

import (
	"context"
)

type TeamComparison struct {
	TeamID   string `json:"team_id"`
	Name     string `json:"name"`
	PRs      int    `json:"prs"`
	Tasks    int    `json:"tasks"`
	CIRuns   int    `json:"ci_runs"`
}

type ComparisonService struct {
	db DatabaseQuery
}

func NewComparisonService(db DatabaseQuery) *ComparisonService {
	return &ComparisonService{db: db}
}

func (s *ComparisonService) Get(ctx context.Context) ([]TeamComparison, error) {
	rows, err := s.db.Query(ctx, `
		SELECT t.id as team_id, t.name,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 7 DAY) as prs,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'pm' AND event_type = 'task_completed' AND occurred_at > now() - INTERVAL 7 DAY) as tasks,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'cicd' AND event_type = 'pipeline_run' AND occurred_at > now() - INTERVAL 7 DAY) as ci_runs
		FROM teams t
	`)
	if err != nil {
		return nil, err
	}

	var teams []TeamComparison
	for _, r := range rows {
		teams = append(teams, TeamComparison{
			TeamID: getString(r["team_id"]),
			Name:   getString(r["name"]),
			PRs:    int(getInt64(r["prs"])),
			Tasks:  int(getInt64(r["tasks"])),
			CIRuns: int(getInt64(r["ci_runs"])),
		})
	}

	return teams, nil
}