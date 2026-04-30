package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"

	"github.com/getmetraly/metraly/internal/pkg/cache"
	"github.com/getmetraly/metraly/internal/pkg/config"
	"github.com/getmetraly/metraly/internal/pkg/database"
	"github.com/getmetraly/metraly/internal/pkg/handlers"
	"github.com/getmetraly/metraly/internal/pkg/logger"
	"github.com/getmetraly/metraly/internal/pkg/middleware"
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

	healthH := handlers.NewHealthHandler(db)
	dashboardH := handlers.NewDashboardHandler(db)
	overviewH := handlers.NewOverviewHandler(db)
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
	r.Mount("/api/v1/teams", overviewH.Routes())
	r.Get("/api/v1/teams/{team_id}/velocity", velocityH.ServeHTTP)
	r.Get("/api/v1/teams/comparison", comparisonH.ServeHTTP)
	r.Post("/api/v1/collectors", webhookH.Receive)

	port := cfg.Get("PORT", "8000")
	addr := fmt.Sprintf(":%s", port)
	log.Info("listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Error("server: %v", err)
		os.Exit(1)
	}
}
