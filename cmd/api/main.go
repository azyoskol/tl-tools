package main
import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/metraly/cmd/api/handlers"
)
func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})
	r.Get("/api/v1/dora", handlers.DORAHandler)
	r.Get("/api/v1/metrics", handlers.MetricsHandler)
	r.Get("/api/v1/role/{role}", handlers.RoleHandler)
	r.Get("/api/v1/insights", handlers.InsightsHandler)
	r.Get("/api/v1/dashboards", handlers.GetDashboardsHandler)
	r.Post("/api/v1/dashboards", handlers.PostDashboardHandler)
	http.ListenAndServe(":8080", r)
}