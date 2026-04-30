package handlers

import (
	"context"

	"github.com/getmetraly/metraly/internal/pkg/database"
)

type mockDB struct {
	queryResult database.QueryResult
	queryErr    error
	execErr     error
	pingErr     error
}

func (m *mockDB) Query(_ context.Context, _ string, _ ...any) (database.QueryResult, error) {
	return m.queryResult, m.queryErr
}

func (m *mockDB) Exec(_ context.Context, _ string, _ ...any) error {
	return m.execErr
}

func (m *mockDB) Ping(_ context.Context) error {
	return m.pingErr
}
