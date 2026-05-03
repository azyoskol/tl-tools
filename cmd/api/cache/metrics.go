package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/getmetraly/metraly/cmd/api/domain"
)

var ErrCacheMiss = redis.Nil

type MetricsCache struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewMetricsCache(rdb *redis.Client, ttl time.Duration) *MetricsCache {
	return &MetricsCache{rdb: rdb, ttl: ttl}
}

func (c *MetricsCache) key(metricID, team string) string { return "metrics:" + metricID + ":" + team }

func (c *MetricsCache) Get(ctx context.Context, metricID, team string) ([]domain.MetricDataPoint, error) {
	data, err := c.rdb.Get(ctx, c.key(metricID, team)).Bytes()
	if err != nil {
		return nil, err
	}
	var pts []domain.MetricDataPoint
	if err := json.Unmarshal(data, &pts); err != nil {
		return nil, err
	}
	return pts, nil
}

func (c *MetricsCache) Set(ctx context.Context, metricID, team string, pts []domain.MetricDataPoint) error {
	b, err := json.Marshal(pts)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, c.key(metricID, team), b, c.ttl).Err()
}
