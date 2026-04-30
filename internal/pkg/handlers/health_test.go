package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthRoot_returns200_withWelcomeMessage(t *testing.T) {
	h := NewHealthHandler(&mockDB{})
	rec := httptest.NewRecorder()
	h.Root(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var body map[string]string
	json.NewDecoder(rec.Body).Decode(&body)
	if body["message"] != "Team Dashboard API" {
		t.Errorf("unexpected message: %q", body["message"])
	}
}

func TestHealthAPI_returns200_withStatusOk(t *testing.T) {
	h := NewHealthHandler(&mockDB{})
	rec := httptest.NewRecorder()
	h.API(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var body map[string]string
	json.NewDecoder(rec.Body).Decode(&body)
	if body["status"] != "ok" {
		t.Errorf("expected status ok, got %q", body["status"])
	}
}

func TestHealthClickHouse_returns200_whenPingSucceeds(t *testing.T) {
	h := NewHealthHandler(&mockDB{pingErr: nil})
	rec := httptest.NewRecorder()
	h.ClickHouse(rec, httptest.NewRequest(http.MethodGet, "/health/clickhouse", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHealthClickHouse_returns503_whenPingFails(t *testing.T) {
	h := NewHealthHandler(&mockDB{pingErr: errors.New("connection refused")})
	rec := httptest.NewRecorder()
	h.ClickHouse(rec, httptest.NewRequest(http.MethodGet, "/health/clickhouse", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
}
