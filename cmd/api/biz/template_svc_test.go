// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package biz

import (
	"context"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockTemplateCache struct {
	mock.Mock
}

func (m *mockTemplateCache) Get(ctx context.Context) ([]*domain.DashboardTemplate, error) {
	args := m.Called(ctx)
	if t, ok := args.Get(0).([]*domain.DashboardTemplate); ok {
		return t, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *mockTemplateCache) Set(ctx context.Context, t []*domain.DashboardTemplate) error {
	args := m.Called(ctx, t)
	return args.Error(0)
}

func TestTemplateSvc_List_CacheHit(t *testing.T) {
	ctx := context.Background()
	dashboardRepo := new(mockDashboardRepo)
	templateCache := new(mockTemplateCache)

	cachedTemplates := []*domain.DashboardTemplate{
		{ID: "tpl-1", Name: "Template 1", Category: "devops"},
		{ID: "tpl-2", Name: "Template 2", Category: "devops"},
	}

	templateCache.On("Get", ctx).Return(cachedTemplates, nil)

	svc := NewTemplateSvc(dashboardRepo, templateCache)

	templates, err := svc.List(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, templates)
	assert.Equal(t, cachedTemplates, templates)
	templateCache.AssertExpectations(t)
	dashboardRepo.AssertNotCalled(t, "ListTemplates")
}

func TestTemplateSvc_List_CacheMiss(t *testing.T) {
	ctx := context.Background()
	dashboardRepo := new(mockDashboardRepo)
	templateCache := new(mockTemplateCache)

	expectedTemplates := []*domain.DashboardTemplate{
		{ID: "tpl-3", Name: "Template 3", Category: "sre"},
	}

	templateCache.On("Get", ctx).Return(nil, assert.AnError)
	dashboardRepo.On("ListTemplates", ctx).Return(expectedTemplates, nil)
	templateCache.On("Set", ctx, expectedTemplates).Return(nil)

	svc := NewTemplateSvc(dashboardRepo, templateCache)

	templates, err := svc.List(ctx)

	assert.NoError(t, err)
	assert.Equal(t, expectedTemplates, templates)
	templateCache.AssertExpectations(t)
	dashboardRepo.AssertExpectations(t)
}
