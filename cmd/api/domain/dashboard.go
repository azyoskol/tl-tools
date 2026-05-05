// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package domain

import (
	"encoding/json"
	"time"
)

type Dashboard struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Description  string           `json:"description"`
	Icon         string           `json:"icon"`
	OwnerID      string           `json:"ownerId"`
	IsPublic     bool             `json:"isPublic"`
	ShareToken   *string          `json:"shareToken,omitempty"`
	Widgets      []WidgetInstance `json:"widgets"`
	Layout       []WidgetLayout   `json:"layout"`
	Version      int              `json:"version"`
	ForkedFromID *string          `json:"forkedFromId,omitempty"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
}

type WidgetInstance struct {
	InstanceID string          `json:"instanceId"`
	WidgetType string          `json:"widgetType"`
	Config     json.RawMessage `json:"config"`
}

type WidgetLayout struct {
	InstanceID string `json:"instanceId"`
	X          int    `json:"x"`
	Y          int    `json:"y"`
	W          int    `json:"w"`
	H          int    `json:"h"`
}

type DashboardTemplate struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Category    string           `json:"category"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
}

type CreateDashboardInput struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
}

type UpdateDashboardInput struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
	Version     int              `json:"version" validate:"required"`
}

type UpdateLayoutInput struct {
	Layout  []WidgetLayout `json:"layout"`
	Version int            `json:"version" validate:"required"`
}

type UpdateShareInput struct {
	IsPublic bool `json:"isPublic"`
}
