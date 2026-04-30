package models

type Team struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type DashboardResponse struct {
	Overview   Overview       `json:"overview"`
	Activity   []Activity     `json:"activity"`
	TopTeams   []TeamActivity `json:"top_teams"`
	Hourly     []Hourly       `json:"hourly"`
	TopAuthors []Author       `json:"top_authors"`
}

type Overview struct {
	PRsOpened    int `json:"prs_opened"`
	PRsMerged    int `json:"prs_merged"`
	TasksBlocked int `json:"tasks_blocked"`
	CIFailures   int `json:"ci_failures"`
}

type Activity struct {
	Date       string `json:"date"`
	SourceType string `json:"source_type"`
	Count      int    `json:"count"`
}

type TeamActivity struct {
	TeamID     string `json:"team_id"`
	SourceType string `json:"source_type"`
	Count      int    `json:"count"`
}

type Hourly struct {
	Hour  string `json:"hour"`
	Count int    `json:"count"`
}

type Author struct {
	Author string `json:"author"`
	Count  int    `json:"count"`
}

type TeamOverview struct {
	TeamID              string `json:"team_id"`
	Name                string `json:"name"`
	PRsAwaitingReview  int    `json:"prs_awaiting_review"`
	PRsMerged           int    `json:"prs_merged"`
	BlockedTasks        int    `json:"blocked_tasks"`
	CIFailuresLastHour int    `json:"ci_failures_last_hour"`
}

type TeamActivityResponse struct {
	Data []Activity `json:"data"`
}

type TeamInsights struct {
	Insights []Insight `json:"insights"`
}

type Insight struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type VelocityResponse struct {
	CycleTime []CycleMetric `json:"cycle_time"`
	LeadTime  []LeadMetric  `json:"lead_time"`
}

type CycleMetric struct {
	Date  string `json:"date"`
	Tasks int    `json:"tasks"`
}

type LeadMetric struct {
	Date  string `json:"date"`
	Tasks int    `json:"tasks"`
}

type ComparisonResponse struct {
	Teams []TeamCompare `json:"teams"`
}

type TeamCompare struct {
	TeamID string `json:"team_id"`
	Name   string `json:"name"`
	PRs    int    `json:"prs"`
	Tasks  int    `json:"tasks"`
	CIRuns int    `json:"ci_runs"`
}

type WebhookRequest struct {
	Source    string         `json:"source"`
	EventType string         `json:"event_type"`
	TeamID    string         `json:"team_id"`
	Payload   map[string]any `json:"payload"`
}

type WebhookResponse struct {
	Status   string `json:"status"`
	Received string `json:"received"`
}