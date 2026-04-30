package repo

import (
	"context"
	"fmt"

	"github.com/getmetraly/metraly/internal/pkg/database"
)

// ClickHouseEventRepo implements EventRepo for ClickHouse.
type ClickHouseEventRepo struct {
	db database.Database
}

// NewClickHouseEventRepo creates a new ClickHouse event repository.
func NewClickHouseEventRepo(db database.Database) *ClickHouseEventRepo {
	return &ClickHouseEventRepo{db: db}
}

// CountEvents returns the count of events matching the criteria.
func (r *ClickHouseEventRepo) CountEvents(ctx context.Context, sourceType, eventType, period string) (int, error) {
	query := fmt.Sprintf(
		"SELECT CAST(count() AS Int64) as cnt FROM events WHERE source_type = '%s' AND event_type = '%s' AND occurred_at > now() - %s",
		sourceType, eventType, period,
	)
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("count events: %w", err)
	}
	if len(rows) == 0 {
		return 0, nil
	}
	if cnt, ok := rows[0]["cnt"].(int64); ok {
		return int(cnt), nil
	}
	return 0, nil
}

// GetActivity returns activity grouped by date and source type.
func (r *ClickHouseEventRepo) GetActivity(ctx context.Context, period string) ([]map[string]any, error) {
	query := fmt.Sprintf(
		"SELECT toDate(occurred_at) as date, source_type, CAST(count() AS Int64) as count FROM events WHERE occurred_at > now() - %s GROUP BY date, source_type ORDER BY date",
		period,
	)
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get activity: %w", err)
	}

	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		result = append(result, map[string]any{
			"date":        row["date"],
			"source_type": row["source_type"],
			"count":       row["count"],
		})
	}
	return result, nil
}

// GetTopTeams returns top teams by event count.
func (r *ClickHouseEventRepo) GetTopTeams(ctx context.Context, period string, limit int) ([]map[string]any, error) {
	query := fmt.Sprintf(
		"SELECT team_id, source_type, CAST(count() AS Int64) as cnt FROM events WHERE occurred_at > now() - %s GROUP BY team_id, source_type ORDER BY cnt DESC LIMIT %d",
		period, limit,
	)
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get top teams: %w", err)
	}

	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		result = append(result, map[string]any{
			"team_id":     row["team_id"],
			"source_type": row["source_type"],
			"count":       row["cnt"],
		})
	}
	return result, nil
}

// GetHourly returns hourly event distribution.
func (r *ClickHouseEventRepo) GetHourly(ctx context.Context, period string) ([]map[string]any, error) {
	query := fmt.Sprintf(
		"SELECT formatDateTime(occurred_at, '%%H:00') as hour, CAST(count() AS Int64) as count FROM events WHERE occurred_at > now() - %s GROUP BY hour ORDER BY hour",
		period,
	)
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get hourly: %w", err)
	}

	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		result = append(result, map[string]any{
			"hour":  row["hour"],
			"count": row["count"],
		})
	}
	return result, nil
}

// GetTopAuthors returns top authors by event count.
func (r *ClickHouseEventRepo) GetTopAuthors(ctx context.Context, period string, limit int) ([]map[string]any, error) {
	query := fmt.Sprintf(
		"SELECT JSONExtract(payload, 'author', 'String') as author, CAST(count() AS Int64) as count FROM events WHERE source_type = 'git' AND occurred_at > now() - %s GROUP BY author ORDER BY count DESC LIMIT %d",
		period, limit,
	)
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get top authors: %w", err)
	}

	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		author, _ := row["author"].(string)
		if author == "" {
			author = "unknown"
		}
		result = append(result, map[string]any{
			"author": author,
			"count":  row["count"],
		})
	}
	return result, nil
}