-- Test data for Team Dashboard

-- Teams
INSERT INTO teams (id, name) VALUES (toUUID('550e8400-e29b-41d4-a716-446655440000'), 'Platform Team');
INSERT INTO teams (id, name) VALUES (toUUID('550e8400-e29b-41d4-a716-446655440001'), 'Backend Team');
INSERT INTO teams (id, name) VALUES (toUUID('550e8400-e29b-41d4-a716-446655440002'), 'Frontend Team');

-- Events for Dashboard
INSERT INTO events (team_id, source_type, event_type, payload, occurred_at) VALUES
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'pr_opened', '{"pr_id": "PR-101", "author": "alice"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'pr_merged', '{"pr_id": "PR-098", "author": "bob"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'pr_opened', '{"pr_id": "PR-102", "author": "charlie"}', now() - 3),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'pr_merged', '{"pr_id": "PR-099", "author": "dave"}', now() - 4),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'pr_review_request', '{"pr_id": "PR-103", "author": "eve"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'pm', 'task_created', '{"task_id": "TASK-101", "assignee": "frank"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'pm', 'task_completed', '{"task_id": "TASK-102", "assignee": "grace"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'pm', 'task_completed', '{"task_id": "TASK-103", "assignee": "henry"}', now() - 3),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'pm', 'task_blocked', '{"task_id": "TASK-104"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'pm', 'task_created', '{"task_id": "TASK-105", "assignee": "ivy"}', now() - 5),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'cicd', 'pipeline_success', '{"pipeline_id": "PIP-401", "branch": "main"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'cicd', 'pipeline_success', '{"pipeline_id": "PIP-402", "branch": "main"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'cicd', 'pipeline_failed', '{"pipeline_id": "PIP-403", "branch": "feature/a"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'cicd', 'pipeline_success', '{"pipeline_id": "PIP-404", "branch": "develop"}', now() - 3),
(toUUID('550e8400-e29b-41d4-a716-446655440000'), 'git', 'commit', '{"commit_id": "abc123", "author": "jack"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'git', 'pr_opened', '{"pr_id": "PR-201", "author": "karen"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'git', 'pr_merged', '{"pr_id": "PR-199", "author": "leo"}', now() - 3),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'git', 'pr_opened', '{"pr_id": "PR-202", "author": "maya"}', now() - 5),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'pm', 'task_created', '{"task_id": "TASK-201", "assignee": "nick"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'pm', 'task_blocked', '{"task_id": "TASK-202"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'pm', 'task_completed', '{"task_id": "TASK-203", "assignee": "olivia"}', now() - 4),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'cicd', 'pipeline_failed', '{"pipeline_id": "PIP-501", "branch": "main"}', now() - 1),
(toUUID('550e8400-e29b-41d4-a716-446655440001'), 'cicd', 'pipeline_success', '{"pipeline_id": "PIP-502", "branch": "develop"}', now() - 2),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'git', 'commit', '{"commit_id": "def456", "author": "peter"}', now() - 8),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'git', 'pr_merged', '{"pr_id": "PR-301", "author": "quinn"}', now() - 12),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'git', 'pr_review_request', '{"pr_id": "PR-401", "author": "rose"}', now() - 9),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'pm', 'task_completed', '{"task_id": "TASK-301", "assignee": "sam"}', now() - 8),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'pm', 'task_created', '{"task_id": "TASK-302", "assignee": "tom"}', now() - 14),
(toUUID('550e8400-e29b-41d4-a716-446655440002'), 'cicd', 'pipeline_success', '{"pipeline_id": "PIP-801", "branch": "main"}', now() - 12);