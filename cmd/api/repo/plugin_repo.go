package repo

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PluginRepo interface {
	List(ctx context.Context) ([]*domain.Plugin, error)
	Install(ctx context.Context, id string) error
	BulkInsert(ctx context.Context, plugins []*domain.Plugin) error
}

type AIInsightRepo interface {
	List(ctx context.Context) ([]*domain.AIInsight, error)
	BulkInsert(ctx context.Context, insights []*domain.AIInsight) error
}

type pgPluginRepo struct{ pool *pgxpool.Pool }
type pgAIInsightRepo struct{ pool *pgxpool.Pool }

func NewPluginRepo(pool *pgxpool.Pool) PluginRepo       { return &pgPluginRepo{pool} }
func NewAIInsightRepo(pool *pgxpool.Pool) AIInsightRepo { return &pgAIInsightRepo{pool} }

func (r *pgPluginRepo) List(ctx context.Context) ([]*domain.Plugin, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, icon, category, installed FROM plugins ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.Plugin
	for rows.Next() {
		p := &domain.Plugin{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Icon, &p.Category, &p.Installed); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *pgPluginRepo) Install(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE plugins SET installed=true WHERE id=$1`, id)
	return err
}

func (r *pgPluginRepo) BulkInsert(ctx context.Context, plugins []*domain.Plugin) error {
	for _, p := range plugins {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO plugins(id, name, description, icon, category, installed)
			 VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
			p.ID, p.Name, p.Description, p.Icon, p.Category, p.Installed)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *pgAIInsightRepo) List(ctx context.Context) ([]*domain.AIInsight, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, body, action FROM ai_insights ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.AIInsight
	for rows.Next() {
		ins := &domain.AIInsight{}
		if err := rows.Scan(&ins.ID, &ins.Title, &ins.Body, &ins.Action); err != nil {
			return nil, err
		}
		result = append(result, ins)
	}
	return result, rows.Err()
}

func (r *pgAIInsightRepo) BulkInsert(ctx context.Context, insights []*domain.AIInsight) error {
	for _, ins := range insights {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO ai_insights(id, title, body, action) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
			ins.ID, ins.Title, ins.Body, ins.Action)
		if err != nil {
			return err
		}
	}
	return nil
}
