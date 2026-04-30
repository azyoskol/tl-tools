package main

import (
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/azyoskol/tl-tools/api/pkg/cache"
	"github.com/azyoskol/tl-tools/api/pkg/config"
	"github.com/azyoskol/tl-tools/api/pkg/database"
	"github.com/azyoskol/tl-tools/api/pkg/handlers"
	"github.com/azyoskol/tl-tools/api/pkg/logger"
	"github.com/azyoskol/tl-tools/api/pkg/middleware"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	cfg := config.NewEnvConfig()

	log := logger.NewStdLogger()

	db, err := database.NewClickHouse(cfg)
	if err != nil {
		log.Error("Failed to connect to ClickHouse: %v", err)
		os.Exit(1)
	}

	redisCache, err := cache.NewRedisCache(cfg)
	if err != nil {
		log.Warn("Failed to connect to Redis, using in-memory cache")
	}

	teamsHandler := handlers.NewTeamsHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)
	healthHandler := handlers.NewHealthHandler(db)
	overviewHandler := handlers.NewOverviewHandler(db)
	velocityHandler := handlers.NewVelocityHandler(db)
	comparisonHandler := handlers.NewComparisonHandler(db)
	webhookHandler := handlers.NewWebhookHandler(db)

	r := chi.NewRouter()
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)

	r.Get("/", healthHandler.Root)

	r.Route("/health", func(r chi.Router) {
		r.Get("/api", healthHandler.API)
		r.Get("/clickhouse", healthHandler.ClickHouse)
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.CacheMiddleware(redisCache))
		r.Mount("/teams", teamsHandler.Routes())
		r.Get("/dashboard", dashboardHandler.ServeHTTP)
		r.Mount("/teams", chi.NewRouter().Group(func(g chi.Router) {
			g.Route("/{team_id}", func(g chi.Router) {
				g.Get("/overview", overviewHandler.Overview)
				g.Get("/activity", overviewHandler.Activity)
				g.Get("/insights", overviewHandler.Insights)
				g.Get("/velocity", velocityHandler.ServeHTTP)
			})
		}))
		r.Get("/teams/compare", comparisonHandler.ServeHTTP)
	})

	r.Post("/api/v1/webhook/receive", webhookHandler.Receive)

	port := cfg.Get("PORT", "8000")
	log.Info("Starting server on :%s", port)

	srv := &http.Server{Addr: ":" + port, Handler: r}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("ListenAndServe: %v", err)
		}
	}()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	<-ch
	log.Info("Shutting down server...")
	srv.Close()
}