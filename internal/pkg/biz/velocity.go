package biz

import (
	"context"
)

type VelocityPoint struct {
	Date  string `json:"date"`
	Tasks int64  `json:"tasks"`
}

type VelocityResponse struct {
	CycleTime []VelocityPoint `json:"cycle_time"`
	LeadTime  []VelocityPoint `json:"lead_time"`
}

type VelocityService struct {
	db DatabaseQuery
}

func NewVelocityService(db DatabaseQuery) *VelocityService {
	return &VelocityService{db: db}
}

func (s *VelocityService) Get(ctx context.Context, teamID string) (VelocityResponse, error) {
	cycleRows, _ := s.db.Query(ctx, "SELECT toDate(occurred_at) as date, count() as tasks FROM events WHERE team_id = ? AND source_type = 'pm' AND event_type = 'task_completed' AND occurred_at > now() - INTERVAL 30 DAY GROUP BY date ORDER BY date", teamID)

	leadRows, _ := s.db.Query(ctx, "SELECT toDate(occurred_at) as date, count() as tasks FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 30 DAY GROUP BY date ORDER BY date", teamID)

	var cycleTime, leadTime []VelocityPoint
	for _, r := range cycleRows {
		cycleTime = append(cycleTime, VelocityPoint{
			Date:  getString(r["date"]),
			Tasks: getInt64(r["tasks"]),
		})
	}
	for _, r := range leadRows {
		leadTime = append(leadTime, VelocityPoint{
			Date:  getString(r["date"]),
			Tasks: getInt64(r["tasks"]),
		})
	}

	return VelocityResponse{
		CycleTime: cycleTime,
		LeadTime:  leadTime,
	}, nil
}