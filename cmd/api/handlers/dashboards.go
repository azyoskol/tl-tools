package handlers
import (
	"encoding/json"
	"net/http"
	"sync"
)
type Dashboard struct {
	ID          string                 `json:"id,omitempty"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Widgets     []string               `json:"widgets"`
	WidgetSizes map[string]string      `json:"widgetSizes"`
	TimeRange   string                 `json:"timeRange"`
	Team        string                 `json:"team"`
}
var (
	dashboards = []Dashboard{
		{ID: "1", Name: "CTO Overview", Description: "Executive summary", Widgets: []string{"dora-overview", "health-score"}, WidgetSizes: map[string]string{"dora-overview": "lg"}, TimeRange: "30d", Team: "All teams"},
		{ID: "2", Name: "Sprint Dashboard", Description: "Current sprint metrics", Widgets: []string{"velocity", "burndown"}, WidgetSizes: map[string]string{}, TimeRange: "14d", Team: "All teams"},
	}
	dashboardsMu sync.Mutex
)
func GetDashboardsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboards)
}
func PostDashboardHandler(w http.ResponseWriter, r *http.Request) {
	var dash Dashboard
	if err := json.NewDecoder(r.Body).Decode(&dash); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	dashboardsMu.Lock()
	dash.ID = string(rune(len(dashboards) + 1))
	dashboards = append(dashboards, dash)
	dashboardsMu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dash)
}