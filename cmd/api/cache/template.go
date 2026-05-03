package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/getmetraly/metraly/cmd/api/domain"
)

type TemplateCache interface {
	Get(ctx context.Context) ([]*domain.DashboardTemplate, error)
	Set(ctx context.Context, t []*domain.DashboardTemplate) error
}

type redisTemplateCache struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewTemplateCache(rdb *redis.Client, ttl time.Duration) TemplateCache {
	return &redisTemplateCache{rdb: rdb, ttl: ttl}
}

func (c *redisTemplateCache) key() string { return "templates" }

func (c *redisTemplateCache) Get(ctx context.Context) ([]*domain.DashboardTemplate, error) {
	data, err := c.rdb.Get(ctx, c.key()).Bytes()
	if err != nil {
		return nil, err
	}
	var t []*domain.DashboardTemplate
	if err := json.Unmarshal(data, &t); err != nil {
		return nil, err
	}
	return t, nil
}

func (c *redisTemplateCache) Set(ctx context.Context, t []*domain.DashboardTemplate) error {
	b, err := json.Marshal(t)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, c.key(), b, c.ttl).Err()
}
