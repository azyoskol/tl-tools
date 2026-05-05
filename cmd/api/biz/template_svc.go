// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package biz

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/cache"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
)

type TemplateSvc struct {
	repo  repo.DashboardRepo
	cache cache.TemplateCache
}

func NewTemplateSvc(r repo.DashboardRepo, c cache.TemplateCache) *TemplateSvc {
	return &TemplateSvc{repo: r, cache: c}
}

func (s *TemplateSvc) List(ctx context.Context) ([]*domain.DashboardTemplate, error) {
	if t, err := s.cache.Get(ctx); err == nil {
		return t, nil
	}
	t, err := s.repo.ListTemplates(ctx)
	if err != nil {
		return nil, err
	}
	_ = s.cache.Set(ctx, t)
	return t, nil
}
