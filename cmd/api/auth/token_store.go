package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"hash"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var hashPool = sync.Pool{New: func() any { return sha256.New() }}

type TokenStore interface {
	Issue(ctx context.Context, userID string) (string, error)
	Consume(ctx context.Context, raw string) (string, error)
}

type redisTokenStore struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewTokenStore(rdb *redis.Client, ttl time.Duration) TokenStore {
	return &redisTokenStore{rdb: rdb, ttl: ttl}
}

func (s *redisTokenStore) Issue(ctx context.Context, userID string) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	raw := base64.RawURLEncoding.EncodeToString(b)
	hash := s.hash(raw)
	if err := s.rdb.Set(ctx, "refresh:"+hash, userID, s.ttl).Err(); err != nil {
		return "", err
	}
	return raw, nil
}

func (s *redisTokenStore) Consume(ctx context.Context, raw string) (string, error) {
	hash := s.hash(raw)
	key := "refresh:" + hash
	userID, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return "", err
	}
	if err := s.rdb.Del(ctx, key).Err(); err != nil {
		return "", err
	}
	return userID, nil
}

func (s *redisTokenStore) hash(raw string) string {
	h := hashPool.Get().(hash.Hash)
	h.Reset()
	h.Write([]byte(raw))
	result := hex.EncodeToString(h.Sum(nil))
	hashPool.Put(h)
	return result
}
