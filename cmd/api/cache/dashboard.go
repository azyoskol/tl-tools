package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/getmetraly/metraly/cmd/api/domain"
)

type DashboardCache interface {
	Get(ctx context.Context, id string) (*domain.Dashboard, error)
	Set(ctx context.Context, d *domain.Dashboard) error
}

type redisDashboardCache struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewDashboardCache(rdb *redis.Client, ttl time.Duration) DashboardCache {
	return &redisDashboardCache{rdb: rdb, ttl: ttl}
}

func (c *redisDashboardCache) key(id string) string { return "dashboard:" + id }

func (c *redisDashboardCache) Get(ctx context.Context, id string) (*domain.Dashboard, error) {
	data, err := c.rdb.Get(ctx, c.key(id)).Bytes()
	if err != nil {
		return nil, err
	}
	var d domain.Dashboard
	if err := json.Unmarshal(data, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (c *redisDashboardCache) Set(ctx context.Context, d *domain.Dashboard) error {
	b, err := json.Marshal(d)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, c.key(d.ID), b, c.ttl).Err()
}
