package biz

import "context"

type HealthResponse struct {
	Message string `json:"message"`
	Version string `json:"version"`
	Status  string `json:"status,omitempty"`
}

type HealthService struct {
	db DatabasePing
}

type DatabasePing interface {
	Ping(ctx context.Context) error
}

func NewHealthService(db DatabasePing) *HealthService {
	return &HealthService{db: db}
}

func (s *HealthService) Root(ctx context.Context) HealthResponse {
	return HealthResponse{
		Message: "Team Dashboard API",
		Version: "1.0.0",
	}
}

func (s *HealthService) API(ctx context.Context) HealthResponse {
	return HealthResponse{
		Status: "ok",
	}
}

func (s *HealthService) Ping(ctx context.Context) error {
	return s.db.Ping(ctx)
}