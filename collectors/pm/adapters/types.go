// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package adapters

import (
	"encoding/json"
	"time"
)

type Event struct {
	ID         string          `json:"id"`
	SourceType string          `json:"source_type"`
	EventType  string          `json:"event_type"`
	TeamID     string          `json:"team_id"`
	ProjectID  *string         `json:"project_id"`
	Payload    json.RawMessage `json:"payload"`
	OccurredAt time.Time       `json:"occurred_at"`
}
