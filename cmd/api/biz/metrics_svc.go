// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package biz

import (
	"context"
	"time"

	"github.com/getmetraly/metraly/cmd/api/cache"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
)

type MetricsSvc struct {
	repo  repo.MetricRepo
	cache cache.MetricsCache
}

func NewMetricsSvc(r repo.MetricRepo, c cache.MetricsCache) *MetricsSvc {
	return &MetricsSvc{repo: r, cache: c}
}

func (s *MetricsSvc) GetMetric(ctx context.Context, metricID, timeRange, team string) (*domain.MetricResponse, error) {
	if pts, err := s.cache.Get(ctx, metricID, team); err == nil {
		return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: pts}, nil
	}
	from, to := parseRange(timeRange)
	pts, err := s.repo.GetTimeSeries(ctx, metricID, team, from, to)
	if err != nil {
		return nil, err
	}
	_ = s.cache.Set(ctx, metricID, team, pts)
	return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: pts}, nil
}

func (s *MetricsSvc) GetBreakdown(ctx context.Context, metricID, timeRange string) ([]domain.MetricBreakdownItem, error) {
	from, to := parseRange(timeRange)
	return s.repo.GetBreakdown(ctx, metricID, from, to)
}

func parseRange(timeRange string) (time.Time, time.Time) {
	now := time.Now()
	switch timeRange {
	case "7d":
		return now.AddDate(0, 0, -7), now
	case "30d":
		return now.AddDate(0, 0, -30), now
	case "90d":
		return now.AddDate(0, 0, -90), now
	default:
		return now.AddDate(0, 0, -30), now
	}
}
