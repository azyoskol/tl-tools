package cache

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func newInMemCache() Cache {
	return &redisCache{inMemory: make(map[string]inMemEntry), useRedis: false}
}

func TestInMemCache_SetAndGet(t *testing.T) {
	c := newInMemCache()
	ctx := context.Background()

	if err := c.Set(ctx, "key1", "value1", 60); err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	got, err := c.Get(ctx, "key1")
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got != "value1" {
		t.Errorf("expected %q, got %q", "value1", got)
	}
}

func TestInMemCache_Get_returnsError_afterExpiry(t *testing.T) {
	c := &redisCache{inMemory: map[string]inMemEntry{
		"expired": {value: "val", expires: time.Now().Add(-time.Second)},
	}, useRedis: false}

	_, err := c.Get(context.Background(), "expired")
	if err != redis.Nil {
		t.Errorf("expected redis.Nil error for expired key, got %v", err)
	}
}

func TestInMemCache_Delete_removesKey(t *testing.T) {
	c := newInMemCache()
	ctx := context.Background()

	c.Set(ctx, "to_delete", "v", 60)
	c.Delete(ctx, "to_delete")

	_, err := c.Get(ctx, "to_delete")
	if err != redis.Nil {
		t.Errorf("expected key to be deleted, got err: %v", err)
	}
}

func TestInMemCache_Get_returnsError_whenMissing(t *testing.T) {
	c := newInMemCache()
	_, err := c.Get(context.Background(), "nonexistent")
	if err != redis.Nil {
		t.Errorf("expected redis.Nil for missing key, got %v", err)
	}
}
