-- Mock data for Team Dashboard MVP
-- Run this after schema.sql to populate test data

-- Insert teams
INSERT INTO teams (id, name, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Platform Team', now()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Backend Team', now()),
    ('550e8400-e29b-41d4-a716-446655440002', 'Frontend Team', now());

-- Insert Git events (last 7 days)
-- Platform Team - GitHub events
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    (generateUUID(), 'git', 'push', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"author": "alice", "repo": "platform", "message": "fix: auth bug"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'git', 'push', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"author": "bob", "repo": "platform", "message": "feat: add user profile"}', now() - INTERVAL 2 DAY),
    (generateUUID(), 'git', 'push', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"author": "alice", "repo": "platform", "message": "chore: update deps"}', now() - INTERVAL 3 DAY),
    (generateUUID(), 'git', 'pr_opened', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 101, "author": "alice", "title": "Fix auth bug", "lines_added": 50, "lines_removed": 10}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'git', 'pr_opened', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 102, "author": "bob", "title": "Add user profile", "lines_added": 200, "lines_removed": 5}', now() - INTERVAL 3 DAY),
    (generateUUID(), 'git', 'pr_review_request', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 101, "author": "alice", "reviewer": "bob"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'git', 'pr_merged', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 99, "author": "charlie", "title": "Refactor API"}', now() - INTERVAL 5 DAY),
    (generateUUID(), 'git', 'pr_reviewed', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 99, "reviewer": "alice"}', now() - INTERVAL 5 DAY);

-- Backend Team - GitLab events
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    (generateUUID(), 'git', 'push', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"author": "dave", "repo": "api", "message": "feat: add rate limiting"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'git', 'push', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"author": "eve", "repo": "api", "message": "fix: memory leak"}', now() - INTERVAL 2 DAY),
    (generateUUID(), 'git', 'mr_opened', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"mr_id": 201, "author": "dave", "title": "Rate limiting"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'git', 'mr_merged', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"mr_id": 199, "author": "eve", "title": "Memory fix"}', now() - INTERVAL 4 DAY);

-- Insert PM events (Jira/Linear)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    -- Platform Team - Jira
    (generateUUID(), 'pm', 'task_created', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-101", "assignee": "alice", "story_points": 3}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'pm', 'task_created', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-102", "assignee": "bob", "story_points": 5}', now() - INTERVAL 2 DAY),
    (generateUUID(), 'pm', 'task_in_progress', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-101", "assignee": "alice"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'pm', 'task_done', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-99", "assignee": "alice", "story_points": 3}', now() - INTERVAL 3 DAY),
    (generateUUID(), 'pm', 'task_blocked', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-102", "assignee": "bob", "blocked_by": "PROJ-105"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'pm', 'task_overdue', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-98", "assignee": "charlie", "due_date": now() - INTERVAL 3 DAY}', now() - INTERVAL 3 DAY),
    -- Backend Team - Linear
    (generateUUID(), 'pm', 'task_created', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"task_id": "BACK-201", "assignee": "dave", "story_points": 8}', now() - INTERVAL 2 DAY),
    (generateUUID(), 'pm', 'task_done', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"task_id": "BACK-199", "assignee": "eve", "story_points": 5}', now() - INTERVAL 4 DAY),
    (generateUUID(), 'pm', 'task_in_progress', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"task_id": "BACK-201", "assignee": "dave"}', now() - INTERVAL 1 DAY);

-- Insert CI/CD events
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    -- Platform Team - GitHub Actions
    (generateUUID(), 'cicd', 'pipeline_success', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-001", "project": "platform", "duration": 180}', now() - INTERVAL 1 HOUR),
    (generateUUID(), 'cicd', 'pipeline_success', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-002", "project": "platform", "duration": 195}', now() - INTERVAL 2 HOUR),
    (generateUUID(), 'cicd', 'pipeline_failed', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-003", "project": "platform", "duration": 120}', now() - INTERVAL 30 MINUTE),
    (generateUUID(), 'cicd', 'pipeline_failed', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-004", "project": "platform", "duration": 90}', now() - INTERVAL 45 MINUTE),
    (generateUUID(), 'cicd', 'pipeline_success', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-005", "project": "platform", "duration": 200}', now() - INTERVAL 3 HOUR),
    -- Backend Team - GitLab CI
    (generateUUID(), 'cicd', 'pipeline_success', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"pipeline_id": "pipe-101", "project": "api", "duration": 240}', now() - INTERVAL 1 HOUR),
    (generateUUID(), 'cicd', 'pipeline_success', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"pipeline_id": "pipe-102", "project": "api", "duration": 255}', now() - INTERVAL 2 HOUR),
    (generateUUID(), 'cicd', 'pipeline_failed', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"pipeline_id": "pipe-103", "project": "api", "duration": 180}', now() - INTERVAL 4 HOUR);

-- Insert Metrics events (Prometheus)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    (generateUUID(), 'metrics', 'metric_value', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"metric": "cpu_usage", "value": 45}', now() - INTERVAL 5 MINUTE),
    (generateUUID(), 'metrics', 'metric_value', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"metric": "memory_usage", "value": 62}', now() - INTERVAL 5 MINUTE),
    (generateUUID(), 'metrics', 'metric_value', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"metric": "cpu_usage", "value": 38}', now() - INTERVAL 5 MINUTE),
    (generateUUID(), 'metrics', 'metric_value', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"metric": "request_rate", "value": 1250}', now() - INTERVAL 5 MINUTE);

-- Insert alerts for attention items
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at) VALUES
    (generateUUID(), 'git', 'pr_stale', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pr_id": 102, "days_waiting": 3}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'pm', 'task_blocked', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-102", "blocked_by": "PROJ-105"}', now() - INTERVAL 1 DAY),
    (generateUUID(), 'pm', 'task_overdue', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"task_id": "PROJ-98", "days_overdue": 3}', now() - INTERVAL 3 DAY),
    (generateUUID(), 'cicd', 'ci_failed', '550e8400-e29b-41d4-a716-446655440000', NULL, '{"pipeline_id": "run-003", "failures_in_hour": 2}', now() - INTERVAL 30 MINUTE);

-- Refresh materialized views (if needed)
-- ALTER TABLE daily_aggregates MATERIALIZE;
-- ALTER TABLE pr_metrics MATERIALIZE;
-- ALTER TABLE cycle_metrics MATERIALIZE;
-- ALTER TABLE team_workload MATERIALIZE;
-- ALTER TABLE cicd_health MATERIALIZE;
-- ALTER TABLE realtime_alerts MATERIALIZE;

SELECT 'Mock data inserted successfully!' as result;