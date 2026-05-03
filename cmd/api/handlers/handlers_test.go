package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/auth"
	"github.com/getmetraly/metraly/cmd/api/middleware"
	"github.com/stretchr/testify/assert"
)

func TestGetMe(t *testing.T) {
	claims := &auth.Claims{
		Sub:   "user-123",
		Email: "test@example.com",
		Role:  "admin",
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/me", nil)

	// Set claims in context using the exported key
	ctx := context.WithValue(req.Context(), middleware.ClaimsKey, claims)
	req = req.WithContext(ctx)

	MeHandler(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp MeResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	assert.NoError(t, err)
	assert.Equal(t, "test@example.com", resp.Email)
	assert.Equal(t, "admin", resp.Role)
}

func TestGetDashboards(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/dashboards", nil)

	GetDashboardsHandler(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var dashboards []Dashboard
	err := json.NewDecoder(w.Body).Decode(&dashboards)
	assert.NoError(t, err)
	assert.NotEmpty(t, dashboards)
}

func TestCreateDashboard(t *testing.T) {
	// Reset dashboards to known state for test
	dashboardsMu.Lock()
	dashboards = []Dashboard{
		{ID: "1", Name: "CTO Overview", Description: "Executive summary", Widgets: []string{"dora-overview", "health-score"}, WidgetSizes: map[string]string{"dora-overview": "lg"}, TimeRange: "30d", Team: "All teams"},
	}
	dashboardsMu.Unlock()

	// Test with nil body - should return 400
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/dashboards", nil)
	PostDashboardHandler(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestGetMetrics(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/metrics?metric=deploy-freq", nil)

	MetricsHandler(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp MetricResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	assert.NoError(t, err)
	assert.Equal(t, "deploy-freq", resp.ID)
	assert.NotEmpty(t, resp.Series)
}
