// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package repo

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ActivityRepo interface {
	List(ctx context.Context, limit int) ([]*domain.ActivityEvent, error)
	BulkInsert(ctx context.Context, events []*domain.ActivityEvent) error
}

type pgActivityRepo struct{ pool *pgxpool.Pool }

func NewActivityRepo(pool *pgxpool.Pool) ActivityRepo { return &pgActivityRepo{pool} }

func (r *pgActivityRepo) List(ctx context.Context, limit int) ([]*domain.ActivityEvent, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, type, title, description, timestamp, user_name, user_avatar
		 FROM activity_events ORDER BY timestamp DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.ActivityEvent
	for rows.Next() {
		e := &domain.ActivityEvent{}
		if err := rows.Scan(&e.ID, &e.Type, &e.Title, &e.Description,
			&e.Timestamp, &e.User.Name, &e.User.Avatar); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, rows.Err()
}

func (r *pgActivityRepo) BulkInsert(ctx context.Context, events []*domain.ActivityEvent) error {
	for _, e := range events {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO activity_events(id, type, title, description, timestamp, user_name, user_avatar)
			 VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
			e.ID, e.Type, e.Title, e.Description, e.Timestamp, e.User.Name, e.User.Avatar)
		if err != nil {
			return err
		}
	}
	return nil
}
