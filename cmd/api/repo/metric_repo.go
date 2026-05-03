package repo

import (
	"context"
	"sync"
	"time"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MetricRepo interface {
	GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error)
	GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error)
	BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error
}

var pointsPool = sync.Pool{New: func() any {
	s := make([]domain.MetricDataPoint, 0, 14)
	return &s
}}

type pgMetricRepo struct{ pool *pgxpool.Pool }

func NewMetricRepo(pool *pgxpool.Pool) MetricRepo { return &pgMetricRepo{pool} }

func (r *pgMetricRepo) GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT time_bucket('1 day', time) AS bucket, AVG(value)
		 FROM metric_data_points
		 WHERE metric_id=$1 AND team=$2 AND time BETWEEN $3 AND $4
		 GROUP BY bucket ORDER BY bucket`, metricID, team, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ptr := pointsPool.Get().(*[]domain.MetricDataPoint)
	result := (*ptr)[:0]
	for rows.Next() {
		var p domain.MetricDataPoint
		if err := rows.Scan(&p.Time, &p.Value); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	out := make([]domain.MetricDataPoint, len(result))
	copy(out, result)
	*ptr = result
	pointsPool.Put(ptr)
	return out, rows.Err()
}

func (r *pgMetricRepo) GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT team, AVG(value) FROM metric_data_points
		 WHERE metric_id=$1 AND time BETWEEN $2 AND $3
		 GROUP BY team ORDER BY team`, metricID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []domain.MetricBreakdownItem
	for rows.Next() {
		var item domain.MetricBreakdownItem
		if err := rows.Scan(&item.Team, &item.Value); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *pgMetricRepo) BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error {
	rows := make([][]any, len(points))
	for i, p := range points {
		rows[i] = []any{p.Time, metricID, team, p.Value}
	}
	_, err := r.pool.CopyFrom(ctx,
		pgx.Identifier{"metric_data_points"},
		[]string{"time", "metric_id", "team", "value"},
		pgx.CopyFromRows(rows),
	)
	return err
}
