package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"google.golang.org/grpc"

	"github.com/getmetraly/metraly/internal/pkg/biz"
	"github.com/getmetraly/metraly/internal/pkg/cache"
	"github.com/getmetraly/metraly/internal/pkg/config"
	"github.com/getmetraly/metraly/internal/pkg/database"
	grpcpb "github.com/getmetraly/metraly/internal/pkg/grpc/proto"
	"github.com/getmetraly/metraly/internal/pkg/handlers"
	"github.com/getmetraly/metraly/internal/pkg/logger"
	"github.com/getmetraly/metraly/internal/pkg/middleware"
	"github.com/getmetraly/metraly/internal/pkg/repo"
)

func main() {
	cfg := config.NewDefaultConfig()
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
	teamsSvc := biz.NewTeamsService(db)
	webhookSvc := biz.NewWebhookService(db)
	velocitySvc := biz.NewVelocityService(db)
	comparisonSvc := biz.NewComparisonService(db)
	healthSvc := biz.NewHealthService(db)

	healthH := handlers.NewHealthHandler(healthSvc)
	teamsH := handlers.NewTeamsHandler(teamsSvc)
	dashboardH := handlers.NewDashboardHandler(dashboardSvc)
	velocityH := handlers.NewVelocityHandler(velocitySvc)
	comparisonH := handlers.NewComparisonHandler(comparisonSvc)
	webhookH := handlers.NewWebhookHandler(webhookSvc)

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

	grpcAddr := fmt.Sprintf(":%d", cfg.GetInt("GRPC_PORT", 9000))
	lis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Error("gRPC listener: %v", err)
		os.Exit(1)
	}
	grpcServer := grpc.NewServer()
	grpcSvc := grpcpb.NewServer(webhookSvc, dashboardSvc, teamsSvc)
	grpcpb.RegisterEventServiceServer(grpcServer, grpcSvc)

	go func() {
		log.Info("gRPC listening on %s", grpcAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Error("gRPC server: %v", err)
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