package database

import "context"

type QueryResult []map[string]any

type Database interface {
	Query(ctx context.Context, query string, args ...any) (QueryResult, error)
	Exec(ctx context.Context, query string, args ...any) error
	Ping(ctx context.Context) error
}