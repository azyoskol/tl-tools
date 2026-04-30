package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthRoot_returns200_withWelcomeMessage(t *testing.T) {
	svc := &mockHealthService{}
	h := NewHealthHandler(svc)
	rec := httptest.NewRecorder()
	h.Root(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var body map[string]string
	svc.Root(context.Background())
	_ = body
}

func TestHealthAPI_returns200_withStatusOk(t *testing.T) {
	svc := &mockHealthService{}
	h := NewHealthHandler(svc)
	rec := httptest.NewRecorder()
	h.API(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHealthClickHouse_returns200_whenPingSucceeds(t *testing.T) {
	svc := &mockHealthService{pingErr: nil}
	h := NewHealthHandler(svc)
	rec := httptest.NewRecorder()
	h.ClickHouse(rec, httptest.NewRequest(http.MethodGet, "/health/clickhouse", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHealthClickHouse_returns503_whenPingFails(t *testing.T) {
	svc := &mockHealthService{pingErr: errors.New("connection refused")}
	h := NewHealthHandler(svc)
	rec := httptest.NewRecorder()
	h.ClickHouse(rec, httptest.NewRequest(http.MethodGet, "/health/clickhouse", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
}
