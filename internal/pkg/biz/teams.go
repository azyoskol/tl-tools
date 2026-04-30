package biz

import (
	"context"

	"github.com/getmetraly/metraly/internal/pkg/database"
)

type QueryResult = database.QueryResult

type Team struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type TeamOverview struct {
	TeamID               string `json:"team_id"`
	PRsAwaitingReview    int    `json:"prs_awaiting_review"`
	PRsMerged            int    `json:"prs_merged"`
	BlockedTasks         int    `json:"blocked_tasks"`
	CIFailuresLastHour   int    `json:"ci_failures_last_hour"`
}

type TeamActivity struct {
	Date        string `json:"date"`
	SourceType  string `json:"source_type"`
	EventType   string `json:"event_type"`
	Count       int64  `json:"count"`
}

type TeamInsight struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type TeamsService struct {
	db DatabaseQuery
}

type DatabaseQuery interface {
	Query(ctx context.Context, query string, args ...any) (QueryResult, error)
}

func NewTeamsService(db DatabaseQuery) *TeamsService {
	return &TeamsService{db: db}
}

func (s *TeamsService) List(ctx context.Context) ([]Team, error) {
	rows, err := s.db.Query(ctx, "SELECT id, name FROM teams")
	if err != nil {
		return nil, err
	}

	var teams []Team
	for _, row := range rows {
		teams = append(teams, Team{
			ID:   getString(row["id"]),
			Name: getString(row["name"]),
		})
	}
	return teams, nil
}

func (s *TeamsService) Get(ctx context.Context, teamID string) (*Team, error) {
	rows, err := s.db.Query(ctx, "SELECT id, name FROM teams WHERE id = ?", teamID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &Team{
		ID:   getString(rows[0]["id"]),
		Name: getString(rows[0]["name"]),
	}, nil
}

func (s *TeamsService) Overview(ctx context.Context, teamID string) (TeamOverview, error) {
	prsReview, _ := s.db.Query(ctx, "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_opened' AND occurred_at > now() - INTERVAL 7 DAY", teamID)
	prsMerged, _ := s.db.Query(ctx, "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 7 DAY", teamID)
	blocked, _ := s.db.Query(ctx, "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'pm' AND event_type = 'task_blocked' AND occurred_at > now() - INTERVAL 1 DAY", teamID)
	ciFail, _ := s.db.Query(ctx, "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'cicd' AND event_type = 'pipeline_failed' AND occurred_at > now() - INTERVAL 1 HOUR", teamID)

	return TeamOverview{
		TeamID:               teamID,
		PRsAwaitingReview:    getCount(prsReview),
		PRsMerged:            getCount(prsMerged),
		BlockedTasks:         getCount(blocked),
		CIFailuresLastHour:   getCount(ciFail),
	}, nil
}

func (s *TeamsService) Activity(ctx context.Context, teamID string) ([]TeamActivity, error) {
	rows, err := s.db.Query(ctx, "SELECT toDate(occurred_at) as date, source_type, event_type, count() as count FROM events WHERE team_id = ? AND occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type, event_type ORDER BY date", teamID)
	if err != nil {
		return nil, err
	}

	var activities []TeamActivity
	for _, row := range rows {
		activities = append(activities, TeamActivity{
			Date:       getString(row["date"]),
			SourceType: getString(row["source_type"]),
			EventType:  getString(row["event_type"]),
			Count:      getInt64(row["count"]),
		})
	}
	return activities, nil
}

func (s *TeamsService) Insights(ctx context.Context, teamID string) ([]TeamInsight, error) {
	return []TeamInsight{
		{Type: "info", Message: "Insights feature coming soon"},
	}, nil
}

func getCount(rows QueryResult) int {
	if len(rows) == 0 {
		return 0
	}
	return int(getInt64(rows[0]["cnt"]))
}