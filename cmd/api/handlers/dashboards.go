// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/middleware"
	"github.com/getmetraly/metraly/cmd/api/respond"
)

const fallbackDashboardOwnerID = "admin-seed"

type DashboardHandler struct {
	svc *biz.DashboardSvc
}

func NewDashboardHandler(svc *biz.DashboardSvc) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) List(w http.ResponseWriter, r *http.Request) {
	if h == nil || h.svc == nil {
		respond.Error(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "dashboard service unavailable")
		return
	}

	dashboards, err := h.svc.List(r.Context(), dashboardOwnerID(r))
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "DASHBOARD_LIST_FAILED", err.Error())
		return
	}
	respond.JSON(w, http.StatusOK, dashboards)
}

func (h *DashboardHandler) Create(w http.ResponseWriter, r *http.Request) {
	if h == nil || h.svc == nil {
		respond.Error(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "dashboard service unavailable")
		return
	}

	var input domain.CreateDashboardInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respond.Error(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	dashboard := &domain.Dashboard{
		ID:          newDashboardID(),
		Name:        input.Name,
		Description: input.Description,
		Icon:        input.Icon,
		OwnerID:     dashboardOwnerID(r),
		IsPublic:    false,
		Widgets:     input.Widgets,
		Layout:      input.Layout,
	}

	if err := h.svc.Create(r.Context(), dashboard); err != nil {
		respond.Error(w, http.StatusInternalServerError, "DASHBOARD_CREATE_FAILED", err.Error())
		return
	}
	respond.JSON(w, http.StatusOK, dashboard)
}

func dashboardOwnerID(r *http.Request) string {
	if claims := middleware.ClaimsFrom(r.Context()); claims != nil && claims.Sub != "" {
		return claims.Sub
	}
	return fallbackDashboardOwnerID
}

func newDashboardID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fallbackDashboardOwnerID
	}
	return hex.EncodeToString(b[:])
}
