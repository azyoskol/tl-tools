package biz

import (
	"context"
	"testing"
	"time"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockMetricRepo struct {
	mock.Mock
}

func (m *mockMetricRepo) GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error) {
	args := m.Called(ctx, metricID, team, from, to)
	if pts, ok := args.Get(0).([]domain.MetricDataPoint); ok {
		return pts, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *mockMetricRepo) GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error) {
	args := m.Called(ctx, metricID, from, to)
	if items, ok := args.Get(0).([]domain.MetricBreakdownItem); ok {
		return items, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *mockMetricRepo) BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error {
	args := m.Called(ctx, points, metricID, team)
	return args.Error(0)
}

type mockMetricsCache struct {
	mock.Mock
}

func (m *mockMetricsCache) Get(ctx context.Context, metricID, team string) ([]domain.MetricDataPoint, error) {
	args := m.Called(ctx, metricID, team)
	if pts, ok := args.Get(0).([]domain.MetricDataPoint); ok {
		return pts, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *mockMetricsCache) Set(ctx context.Context, metricID, team string, pts []domain.MetricDataPoint) error {
	args := m.Called(ctx, metricID, team, pts)
	return args.Error(0)
}

func TestMetricsSvc_CacheHit(t *testing.T) {
	ctx := context.Background()
	metricRepo := new(mockMetricRepo)
	metricsCache := new(mockMetricsCache)

	cachedPoints := []domain.MetricDataPoint{
		{Time: time.Now(), Value: 100},
	}

	metricsCache.On("Get", ctx, "metric-1", "team-a").Return(cachedPoints, nil)

	svc := NewMetricsSvc(metricRepo, metricsCache)

	resp, err := svc.GetMetric(ctx, "metric-1", "7d", "team-a")

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, cachedPoints, resp.Data)
	metricsCache.AssertExpectations(t)
	metricRepo.AssertNotCalled(t, "GetTimeSeries")
}

func TestMetricsSvc_CacheMiss(t *testing.T) {
	ctx := context.Background()
	metricRepo := new(mockMetricRepo)
	metricsCache := new(mockMetricsCache)

	expectedPoints := []domain.MetricDataPoint{
		{Time: time.Now(), Value: 200},
	}

	metricsCache.On("Get", ctx, "metric-1", "team-a").Return(nil, assert.AnError)
	metricRepo.On("GetTimeSeries", ctx, "metric-1", "team-a", mock.Anything, mock.Anything).Return(expectedPoints, nil)
	metricsCache.On("Set", ctx, "metric-1", "team-a", expectedPoints).Return(nil)

	svc := NewMetricsSvc(metricRepo, metricsCache)

	resp, err := svc.GetMetric(ctx, "metric-1", "7d", "team-a")

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, expectedPoints, resp.Data)
	metricsCache.AssertExpectations(t)
	metricRepo.AssertExpectations(t)
}

func TestMetricsSvc_GetBreakdown(t *testing.T) {
	ctx := context.Background()
	metricRepo := new(mockMetricRepo)
	metricsCache := new(mockMetricsCache)

	expectedItems := []domain.MetricBreakdownItem{
		{Team: "team-a", Value: 100},
		{Team: "team-b", Value: 200},
	}

	metricRepo.On("GetBreakdown", ctx, "metric-1", mock.Anything, mock.Anything).Return(expectedItems, nil)

	svc := NewMetricsSvc(metricRepo, metricsCache)

	items, err := svc.GetBreakdown(ctx, "metric-1", "30d")

	assert.NoError(t, err)
	assert.Equal(t, expectedItems, items)
	metricRepo.AssertExpectations(t)
}
