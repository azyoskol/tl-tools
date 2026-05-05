// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/getmetraly/metraly/cmd/api/auth"
)

func TestGracefulShutdown(t *testing.T) {
	km, _ := auth.NewKeyManager("")
	r := NewRouter(RouterDeps{KeyManager: km})
	srv := &http.Server{Addr: "localhost:18000", Handler: r}

	go func() {
		_ = srv.ListenAndServe()
	}()

	// Give the server a moment to start
	time.Sleep(100 * time.Millisecond)

	// Gracefully shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		t.Fatalf("graceful shutdown failed: %v", err)
	}

	// Verify server is down
	_, err := http.Get("http://localhost:18000/api/v1/health")
	if err == nil {
		t.Fatal("expected server to be down")
	}
}

func TestNewRouter(t *testing.T) {
	r := NewRouter(RouterDeps{})
	if r == nil {
		t.Fatal("NewRouter returned nil")
	}

	// Test that public routes work without auth
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestNewRouterWithAuth(t *testing.T) {
	km, _ := auth.NewKeyManager("")
	r := NewRouter(RouterDeps{KeyManager: km})

	// Test that protected routes require auth
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/dashboards", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}

	// Test that X-Auth-Checked header is set
	if w.Header().Get("X-Auth-Checked") != "true" {
		t.Fatal("X-Auth-Checked header not set")
	}
}

func TestNewRouter_DashboardServiceUnavailable(t *testing.T) {
	r := NewRouter(RouterDeps{})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/dashboards", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", w.Code)
	}
}
