// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package domain

type Plugin struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Category    string `json:"category"`
	Installed   bool   `json:"installed"`
}

type AIInsight struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	Body   string  `json:"body"`
	Action *string `json:"action,omitempty"`
}
