package retry

import (
	"context"
	"time"
)

const (
	MaxRetries = 3
)

var delays = []int{1000, 4000, 16000}

func WithRetry(ctx context.Context, fn func() error) error {
	var lastErr error
	for i := 0; i < MaxRetries; i++ {
		if err := fn(); err != nil {
			lastErr = err
			time.Sleep(time.Duration(delays[i]) * time.Millisecond)
			continue
		}
		return nil
	}
	return lastErr
}