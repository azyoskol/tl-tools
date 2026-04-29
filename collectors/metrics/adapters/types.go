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
	ProjectID *string         `json:"project_id"`
	Payload   json.RawMessage `json:"payload"`
	OccurredAt time.Time      `json:"occurred_at"`
}

type EventSaver func(Event)