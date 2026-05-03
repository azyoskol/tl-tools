package biz

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/cache"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
)

type DashboardSvc struct {
	repo  repo.DashboardRepo
	cache cache.DashboardCache
}

func NewDashboardSvc(r repo.DashboardRepo, c cache.DashboardCache) *DashboardSvc {
	return &DashboardSvc{repo: r, cache: c}
}

func (s *DashboardSvc) List(ctx context.Context, userID string) ([]*domain.Dashboard, error) {
	return s.repo.List(ctx, userID)
}

func (s *DashboardSvc) GetByID(ctx context.Context, id string) (*domain.Dashboard, error) {
	if d, err := s.cache.Get(ctx, id); err == nil {
		return d, nil
	}
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	_ = s.cache.Set(ctx, d)
	return d, nil
}

func (s *DashboardSvc) Create(ctx context.Context, d *domain.Dashboard) error {
	return s.repo.Create(ctx, d)
}

func (s *DashboardSvc) Update(ctx context.Context, d *domain.Dashboard) (bool, error) {
	updated, err := s.repo.Update(ctx, d)
	if updated {
		_ = s.cache.Set(ctx, d)
	}
	return updated, err
}

func (s *DashboardSvc) UpdateLayout(ctx context.Context, id string, layout []domain.WidgetLayout, version int) (bool, error) {
	return s.repo.UpdateLayout(ctx, id, layout, version)
}

func (s *DashboardSvc) UpdateShare(ctx context.Context, id string, isPublic bool, shareToken *string) error {
	return s.repo.UpdateShare(ctx, id, isPublic, shareToken)
}
