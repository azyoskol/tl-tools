-- Additional mock data for Team 2 (Backend Team)
-- Run this after mock_data.sql to add more events

-- Generate 80 extra Git pushes for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'git' as source_type,
    'push' as event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    format('{"author": "%s", "repo": "api", "message": "%s"}',
        arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
            floor(rand() * 8) + 1),
        arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
            floor(rand() * 6) + 1)
    ) as payload,
    toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
FROM numbers(80);

-- Generate 40 extra PRs for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'git' as source_type,
    arrayElement(['pr_opened', 'pr_review_request', 'pr_reviewed', 'pr_merged', 'pr_closed'], floor(rand() * 5) + 1) as event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    format('{"mr_id": %d, "author": "%s", "title": "MR #%d", "lines_added": %d, "lines_removed": %d}',
        3000 + number,
        arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
        3000 + number,
        floor(rand() * 500) + 10,
        floor(rand() * 50)
    ) as payload,
    toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
FROM numbers(40);

-- Generate 60 extra PM tasks for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'pm' as source_type,
    arrayElement(['task_created', 'task_in_progress', 'task_done', 'task_blocked', 'task_overdue'], floor(rand() * 5) + 1) as event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    format('{"task_id": "BACK-%d", "assignee": "%s", "story_points": %d}',
        300 + number,
        arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
        arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
    ) as payload,
    toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
FROM numbers(60);

-- Generate 30 extra CI/CD pipelines for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'cicd' as source_type,
    arrayElement(['pipeline_success', 'pipeline_failed'], floor(rand() * 2) + 1) as event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    format('{"pipeline_id": "pipe-%d", "project": "api", "duration": %d}',
        3000 + number,
        floor(rand() * 300) + 60
    ) as payload,
    toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
FROM numbers(30);

-- Generate 20 extra Metrics for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'metrics' as source_type,
    'metric_value' as event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    format('{"metric": "%s", "value": %d}',
        arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
            floor(rand() * 5) + 1),
        floor(rand() * 100)
    ) as payload,
    toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
FROM numbers(20);

-- Generate 20 extra alerts for Backend Team
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    source_type,
    event_type,
    '550e8400-e29b-41d4-a716-446655440001' as team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT 'git' as source_type, 'pr_stale' as event_type,
        format('{"mr_id": %d, "days_waiting": %d}', 3500 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(5)
    UNION ALL
    SELECT 'pm' as source_type, 'task_blocked' as event_type,
        format('{"task_id": "BACK-%d", "blocked_by": "BACK-%d"}', 300 + number, 400 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(5)
    UNION ALL
    SELECT 'pm' as source_type, 'task_overdue' as event_type,
        format('{"task_id": "BACK-%d", "days_overdue": %d}', 300 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(5)
    UNION ALL
    SELECT 'cicd' as source_type, 'ci_failed' as event_type,
        format('{"pipeline_id": "pipe-%d", "failures_in_hour": %d}', 3500 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(5)
);

SELECT 'Additional ~250 events added for Team 2 (Backend Team)' as result;