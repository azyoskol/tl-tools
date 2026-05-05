// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package domain

import "time"

type ActivityUser struct {
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

type ActivityEvent struct {
	ID          string       `json:"id"`
	Type        string       `json:"type"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Timestamp   time.Time    `json:"timestamp"`
	User        ActivityUser `json:"user"`
}
