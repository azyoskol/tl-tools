package biz

import "context"

type HealthServiceInterface interface {
	Root(ctx context.Context) HealthResponse
	API(ctx context.Context) HealthResponse
	Ping(ctx context.Context) error
}

type WebhookServiceInterface interface {
	Receive(ctx context.Context, req WebhookRequest) (WebhookResponse, error)
}

type DashboardServiceInterface interface {
	GetDashboard(ctx context.Context) (DashboardResponse, error)
}

type TeamsServiceInterface interface {
	List(ctx context.Context) ([]Team, error)
	Get(ctx context.Context, teamID string) (*Team, error)
	Overview(ctx context.Context, teamID string) (TeamOverview, error)
	Activity(ctx context.Context, teamID string) ([]TeamActivity, error)
	Insights(ctx context.Context, teamID string) ([]TeamInsight, error)
}

type VelocityServiceInterface interface {
	Get(ctx context.Context, teamID string) (VelocityResponse, error)
}

type ComparisonServiceInterface interface {
	Get(ctx context.Context) ([]TeamComparison, error)
}