package domain

import (
    "encoding/json"
    "time"
)

type MetricDataPoint struct {
    Time  time.Time `json:"time"`
    Value float64   `json:"value"`
}

type MetricResponse struct {
    MetricID  string            `json:"metricId"`
    TimeRange string            `json:"timeRange"`
    Team      string            `json:"team"`
    Data      []MetricDataPoint `json:"data"`
}

type MetricBreakdownItem struct {
    Team  string  `json:"team"`
    Value float64 `json:"value"`
}

type DORAMetrics struct {
    DeployFrequency   float64 `json:"deployFrequency"`
    LeadTime          float64 `json:"leadTime"`
    ChangeFailureRate float64 `json:"changeFailureRate"`
    MTTR              float64 `json:"mttr"`
}

type WidgetDataRequest struct {
    WidgetType string          `json:"widgetType"`
    Config     json.RawMessage `json:"config"`
    TimeRange  string          `json:"timeRange"`
    Team       string          `json:"team"`
    Repo       string          `json:"repo"`
}
