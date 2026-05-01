// @title Metraly API
// @version 1.0
// @description Team Engineering Metrics API
// @contact.name Metraly
// @license MIT

package main

import (
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/getmetraly/metraly/cmd/api/handlers"
)

// @Summary Health check
// @Description Returns the health status of the API
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {string} string
// @Router /api/v1/health [get]
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

// @Summary Get DORA metrics
// @Description Returns DORA metrics (deployment frequency, lead time, MTTR, change failure rate)
// @Tags dora
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/dora [get]
func doraHandler(w http.ResponseWriter, r *http.Request) {
	handlers.DORAHandler(w, r)
}

// @Summary Get engineering metrics
// @Description Returns engineering metrics (PRs, tasks, CI/CD)
// @Tags metrics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/metrics [get]
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	handlers.MetricsHandler(w, r)
}

// @Summary Get role-specific dashboard
// @Description Returns dashboard data for a specific role (engineer, lead, manager)
// @Tags role
// @Accept json
// @Produce json
// @Param role path string true "Role name"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/role/{role} [get]
func roleHandler(w http.ResponseWriter, r *http.Request) {
	handlers.RoleHandler(w, r)
}

// @Summary Get insights
// @Description Returns AI-generated insights for the team
// @Tags insights
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/insights [get]
func insightsHandler(w http.ResponseWriter, r *http.Request) {
	handlers.InsightsHandler(w, r)
}

// @Summary List dashboards
// @Description Returns list of all dashboards
// @Tags dashboards
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/dashboards [get]
func getDashboardsHandler(w http.ResponseWriter, r *http.Request) {
	handlers.GetDashboardsHandler(w, r)
}

// @Summary Create dashboard
// @Description Creates a new dashboard
// @Tags dashboards
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/dashboards [post]
func postDashboardHandler(w http.ResponseWriter, r *http.Request) {
	handlers.PostDashboardHandler(w, r)
}

func main() {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/api/v1/health", healthHandler)
	r.Get("/api/v1/dora", doraHandler)
	r.Get("/api/v1/metrics", metricsHandler)
	r.Get("/api/v1/role/{role}", roleHandler)
	r.Get("/api/v1/insights", insightsHandler)
	r.Get("/api/v1/dashboards", getDashboardsHandler)
	r.Post("/api/v1/dashboards", postDashboardHandler)

	// Legacy endpoints for existing UI
	r.Get("/api/v1/teams", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":1,"name":"Platform"},{"id":2,"name":"Mobile"},{"id":3,"name":"Backend"}]`))
	})
	r.Get("/api/v1/dashboard", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"prsOpened":14,"prsMerged":28,"blockedTasks":7,"ciFailures":3}`))
	})
	r.Get("/api/v1/teams/{id}/overview", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"prsOpened":5,"prsMerged":12,"blockedTasks":2,"ciFailures":1}`))
	})
	r.Get("/api/v1/teams/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"1","name":"Platform"}`))
	})
	r.Get("/api/v1/teams/{id}/activity", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"data":[{"type":"pr_opened","date":"2026-05-01","count":5},{"type":"pr_merged","date":"2026-05-01","count":3}]}`))
	})
	r.Get("/api/v1/teams/{id}/velocity", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"data":[{"week":"2026-W17","points":25},{"week":"2026-W18","points":32}]}`))
	})
	r.Get("/api/v1/teams/{id}/insights", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"insights":["PR review time increased by 15%","Consider adding more automated tests"]}`))
	})
	r.Get("/api/v1/teams/comparison", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"1","name":"Platform","prs":45,"velocity":28},{"id":"2","name":"Mobile","prs":32,"velocity":22}]`))
	})

	// Swagger documentation
	swaggerDir := "docs/swagger"
	if _, err := os.Stat(swaggerDir); os.IsNotExist(err) {
		swaggerDir = "../docs/swagger"
	}
	fs := http.FileServer(http.Dir(swaggerDir))
	r.Handle("/swagger/*", http.StripPrefix("/swagger/", fs))

	http.ListenAndServe(":8000", r)
}