package repo

import "context"

type EventRepo interface {
	CountEvents(ctx context.Context, sourceType, eventType, period string) (int, error)
	GetActivity(ctx context.Context, period string) ([]map[string]any, error)
	GetTopTeams(ctx context.Context, period string, limit int) ([]map[string]any, error)
	GetHourly(ctx context.Context, period string) ([]map[string]any, error)
	GetTopAuthors(ctx context.Context, period string, limit int) ([]map[string]any, error)
}