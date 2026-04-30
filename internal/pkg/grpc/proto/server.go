package grpc

import (
	"context"
	"encoding/json"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type Server struct {
	UnimplementedEventServiceServer
	webhookSvc  biz.WebhookServiceInterface
	dashboardSvc biz.DashboardServiceInterface
	teamsSvc    biz.TeamsServiceInterface
}

func NewServer(webhookSvc biz.WebhookServiceInterface, dashboardSvc biz.DashboardServiceInterface, teamsSvc biz.TeamsServiceInterface) *Server {
	return &Server{
		webhookSvc:   webhookSvc,
		dashboardSvc: dashboardSvc,
		teamsSvc:     teamsSvc,
	}
}

func (s *Server) Ingest(ctx context.Context, req *IngestRequest) (*IngestResponse, error) {
	var payload map[string]any
	if req.Payload != "" {
		json.Unmarshal([]byte(req.Payload), &payload)
	}

	webhookReq := biz.WebhookRequest{
		Source:    req.Source,
		EventType: req.EventType,
		TeamID:    req.TeamId,
		Payload:   payload,
	}

	resp, err := s.webhookSvc.Receive(ctx, webhookReq)
	if err != nil {
		return nil, err
	}

	return &IngestResponse{
		Status:    resp.Status,
		EventType: resp.EventType,
	}, nil
}

func (s *Server) GetDashboard(ctx context.Context, req *GetDashboardRequest) (*GetDashboardResponse, error) {
	dashboardResp, err := s.dashboardSvc.GetDashboard(ctx)
	if err != nil {
		return nil, err
	}

	overview := &OverviewMetrics{
		PrsOpened:    int32(dashboardResp.Overview.PRsOpened),
		TasksBlocked: int32(dashboardResp.Overview.TasksBlocked),
		CiFailures:   int32(dashboardResp.Overview.CIFailures),
		PrsMerged:    int32(dashboardResp.Overview.PRsMerged),
	}

	activity := make([]*ActivityItem, len(dashboardResp.Activity))
	for i, a := range dashboardResp.Activity {
		activity[i] = &ActivityItem{
			Date:       a.Date,
			SourceType: a.SourceType,
			Count:      a.Count,
		}
	}

	topTeams := make([]*TopTeam, len(dashboardResp.TopTeams))
	for i, t := range dashboardResp.TopTeams {
		topTeams[i] = &TopTeam{
			TeamId:     t.TeamID,
			SourceType: t.SourceType,
			Count:      t.Count,
		}
	}

	hourly := make([]*HourlyStats, len(dashboardResp.Hourly))
	for i, h := range dashboardResp.Hourly {
		hourly[i] = &HourlyStats{
			Hour:  h.Hour,
			Count: h.Count,
		}
	}

	topAuthors := make([]*TopAuthor, len(dashboardResp.TopAuthors))
	for i, a := range dashboardResp.TopAuthors {
		topAuthors[i] = &TopAuthor{
			Author: a.Author,
			Count:  a.Count,
		}
	}

	return &GetDashboardResponse{
		Overview:   overview,
		Activity:   activity,
		TopTeams:   topTeams,
		Hourly:     hourly,
		TopAuthors: topAuthors,
	}, nil
}

func (s *Server) GetTeams(ctx context.Context, req *GetTeamsRequest) (*GetTeamsResponse, error) {
	teams, err := s.teamsSvc.List(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]*Team, len(teams))
	for i, t := range teams {
		result[i] = &Team{
			Id:   t.ID,
			Name: t.Name,
		}
	}

	return &GetTeamsResponse{Teams: result}, nil
}

func (s *Server) GetTeam(ctx context.Context, req *GetTeamRequest) (*GetTeamResponse, error) {
	team, err := s.teamsSvc.Get(ctx, req.TeamId)
	if err != nil {
		return nil, err
	}
	if team == nil {
		return nil, nil
	}

	return &GetTeamResponse{
		Id:   team.ID,
		Name: team.Name,
	}, nil
}

func (s *Server) GetTeamOverview(ctx context.Context, req *GetTeamOverviewRequest) (*GetTeamOverviewResponse, error) {
	overview, err := s.teamsSvc.Overview(ctx, req.TeamId)
	if err != nil {
		return nil, err
	}

	return &GetTeamOverviewResponse{
		Overview: &TeamOverview{
			TeamId:                 overview.TeamID,
			PrsAwaitingReview:      int32(overview.PRsAwaitingReview),
			PrsMerged:              int32(overview.PRsMerged),
			BlockedTasks:          int32(overview.BlockedTasks),
			CiFailuresLastHour:     int32(overview.CIFailuresLastHour),
		},
	}, nil
}