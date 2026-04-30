package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

type inMemTestCache struct {
	mu    sync.RWMutex
	store map[string]cacheEntry
}

type cacheEntry struct {
	value   string
	expires time.Time
}

func newTestCache() *inMemTestCache {
	return &inMemTestCache{store: make(map[string]cacheEntry)}
}

func (c *inMemTestCache) Get(_ context.Context, key string) (string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if e, ok := c.store[key]; ok && e.expires.After(time.Now()) {
		return e.value, nil
	}
	return "", redis.Nil
}

func (c *inMemTestCache) Set(_ context.Context, key, value string, ttl int) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.store[key] = cacheEntry{value: value, expires: time.Now().Add(time.Duration(ttl) * time.Second)}
	return nil
}

func (c *inMemTestCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.store, key)
	return nil
}

func TestCacheMiddleware_cachesMissOnFirstRequest(t *testing.T) {
	calls := 0
	handler := CacheMiddleware(newTestCache())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":"fresh"}`))
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/dashboard", nil))

	if calls != 1 {
		t.Errorf("expected handler called once on first request, got %d", calls)
	}
}

func TestCacheMiddleware_servesFromCache_onSecondRequest(t *testing.T) {
	calls := 0
	c := newTestCache()
	handler := CacheMiddleware(c)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data":"fresh"}`))
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/dashboard", nil)
	handler.ServeHTTP(httptest.NewRecorder(), req)
	handler.ServeHTTP(httptest.NewRecorder(), req)

	if calls != 1 {
		t.Errorf("expected handler called once (second from cache), got %d", calls)
	}
}

func TestCacheMiddleware_bypassesCache_forNonGET(t *testing.T) {
	calls := 0
	handler := CacheMiddleware(newTestCache())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusOK)
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/v1/collectors", nil))
	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/v1/collectors", nil))

	if calls != 2 {
		t.Errorf("expected handler called twice for non-GET, got %d", calls)
	}
}

func TestCacheMiddleware_bypassesCache_forSkippedPaths(t *testing.T) {
	calls := 0
	handler := CacheMiddleware(newTestCache())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusOK)
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/health", nil))
	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/health", nil))

	if calls != 2 {
		t.Errorf("expected handler called twice for skipped path /health, got %d", calls)
	}
}
