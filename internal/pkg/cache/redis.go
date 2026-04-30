package cache

import (
	"context"
	"sync"
	"time"

	"github.com/getmetraly/metraly/internal/pkg/config"
	"github.com/redis/go-redis/v9"
)

type redisCache struct {
	client     *redis.Client
	mu         sync.RWMutex
	inMemory   map[string]inMemEntry
	useRedis   bool
}

type inMemEntry struct {
	value   string
	expires time.Time
}

func NewRedisCache(cfg config.Config) (Cache, error) {
	client := redis.NewClient(&redis.Options{
		Addr: cfg.Get("REDIS_HOST", "redis") + ":" + cfg.Get("REDIS_PORT", "6379"),
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return &redisCache{client: nil, inMemory: make(map[string]inMemEntry), useRedis: false}, nil
	}

	return &redisCache{client: client, inMemory: make(map[string]inMemEntry), useRedis: true}, nil
}

func (r *redisCache) Get(ctx context.Context, key string) (string, error) {
	if r.useRedis && r.client != nil {
		return r.client.Get(ctx, key).Result()
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if entry, ok := r.inMemory[key]; ok && entry.expires.After(time.Now()) {
		return entry.value, nil
	}
	return "", redis.Nil
}

func (r *redisCache) Set(ctx context.Context, key string, value string, ttl int) error {
	if r.useRedis && r.client != nil {
		return r.client.SetEx(ctx, key, value, time.Duration(ttl)*time.Second).Err()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.inMemory[key] = inMemEntry{value: value, expires: time.Now().Add(time.Duration(ttl) * time.Second)}
	return nil
}

func (r *redisCache) Delete(ctx context.Context, key string) error {
	if r.useRedis && r.client != nil {
		return r.client.Del(ctx, key).Err()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.inMemory, key)
	return nil
}