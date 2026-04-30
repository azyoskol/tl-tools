package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/getmetraly/metraly/internal/pkg/biz"
	"github.com/getmetraly/metraly/internal/pkg/cache"
	"github.com/getmetraly/metraly/internal/pkg/config"
	"github.com/getmetraly/metraly/internal/pkg/database"
	"github.com/getmetraly/metraly/internal/pkg/handlers"
	"github.com/getmetraly/metraly/internal/pkg/logger"
	"github.com/getmetraly/metraly/internal/pkg/middleware"
	"github.com/getmetraly/metraly/internal/pkg/repo"
)

func main() {
	cfg := config.NewEnvConfig()
	log := logger.NewStdLogger()

	db, err := database.NewClickHouse(cfg)
	if err != nil {
		log.Error("clickhouse connect: %v", err)
		os.Exit(1)
	}

	cacheStore, err := cache.NewRedisCache(cfg)
	if err != nil {
		log.Error("redis connect: %v", err)
		os.Exit(1)
	}

	eventRepo := repo.NewClickHouseEventRepo(db)
	dashboardSvc := biz.NewDashboardService(eventRepo)

	healthH := handlers.NewHealthHandler(db)
	teamsH := handlers.NewTeamsHandler(db)
	dashboardH := handlers.NewDashboardHandler(dashboardSvc)
	velocityH := handlers.NewVelocityHandler(db)
	comparisonH := handlers.NewComparisonHandler(db)
	webhookH := handlers.NewWebhookHandler(db)

	r := chi.NewRouter()
	r.Use(middleware.CORS)
	r.Use(middleware.CacheMiddleware(cacheStore))

	r.Get("/", healthH.Root)
	r.Get("/health", healthH.API)
	r.Get("/health/clickhouse", healthH.ClickHouse)

	r.Get("/api/v1/dashboard", dashboardH.ServeHTTP)
	r.Mount("/api/v1/teams", teamsH.Routes())
	r.Get("/api/v1/teams/{team_id}/velocity", velocityH.ServeHTTP)
	r.Get("/api/v1/teams/comparison", comparisonH.ServeHTTP)
	r.Post("/api/v1/collectors", webhookH.Receive)

	port := cfg.Get("PORT", "8000")
	addr := fmt.Sprintf(":%s", port)

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		log.Info("listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server: %v", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("server shutdown: %v", err)
		os.Exit(1)
	}

	log.Info("stopped")
}