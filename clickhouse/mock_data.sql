-- Mock data for Team Dashboard MVP (10x volume)
-- Run this after schema.sql to populate test data

-- Insert teams
INSERT INTO teams (id, name, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Platform Team', now()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Backend Team', now()),
    ('550e8400-e29b-41d4-a716-446655440002', 'Frontend Team', now()),
    ('550e8400-e29b-41d4-a716-446655440003', 'Mobile Team', now()),
    ('550e8400-e29b-41d4-a716-446655440004', 'DevOps Team', now());

-- Generate 80 Git pushes per team over 7 days (400 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'git' as source_type,
    'push' as event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT
        '550e8400-e29b-41d4-a716-446655440000' as team_id,
        format('{"author": "%s", "repo": "platform", "message": "%s"}',
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
                floor(rand() * 8) + 1),
            arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
                floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(80)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440001' as team_id,
        format('{"author": "%s", "repo": "api", "message": "%s"}',
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
                floor(rand() * 8) + 1),
            arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
                floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(80)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440002' as team_id,
        format('{"author": "%s", "repo": "web-ui", "message": "%s"}',
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
                floor(rand() * 8) + 1),
            arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
                floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(80)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440003' as team_id,
        format('{"author": "%s", "repo": "mobile-app", "message": "%s"}',
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
                floor(rand() * 8) + 1),
            arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
                floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(80)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440004' as team_id,
        format('{"author": "%s", "repo": "infrastructure", "message": "%s"}',
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'henry'],
                floor(rand() * 8) + 1),
            arrayElement(['feat: add new feature', 'fix: bug fix', 'chore: update deps', 'refactor: improve code', 'docs: update docs', 'test: add tests'],
                floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(80)
);

-- Generate 40 PRs per team (200 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'git' as source_type,
    arrayElement(['pr_opened', 'pr_review_request', 'pr_reviewed', 'pr_merged', 'pr_closed'], floor(rand() * 5) + 1) as event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT
        '550e8400-e29b-41d4-a716-446655440000' as team_id,
        format('{"pr_id": %d, "author": "%s", "title": "PR #%d", "lines_added": %d, "lines_removed": %d}',
            1000 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            1000 + number,
            floor(rand() * 500) + 10,
            floor(rand() * 50)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(40)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440001' as team_id,
        format('{"mr_id": %d, "author": "%s", "title": "MR #%d", "lines_added": %d, "lines_removed": %d}',
            2000 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            2000 + number,
            floor(rand() * 500) + 10,
            floor(rand() * 50)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(40)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440002' as team_id,
        format('{"pr_id": %d, "author": "%s", "title": "PR #%d", "lines_added": %d, "lines_removed": %d}',
            3000 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            3000 + number,
            floor(rand() * 500) + 10,
            floor(rand() * 50)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(40)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440003' as team_id,
        format('{"pr_id": %d, "author": "%s", "title": "PR #%d", "lines_added": %d, "lines_removed": %d}',
            4000 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            4000 + number,
            floor(rand() * 500) + 10,
            floor(rand() * 50)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(40)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440004' as team_id,
        format('{"pr_id": %d, "author": "%s", "title": "PR #%d", "lines_added": %d, "lines_removed": %d}',
            5000 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            5000 + number,
            floor(rand() * 500) + 10,
            floor(rand() * 50)
        ) as payload,
        toDateTime('2026-04-22') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(40)
);

-- Generate PM events: 60 tasks per team (300 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'pm' as source_type,
    arrayElement(['task_created', 'task_in_progress', 'task_done', 'task_blocked', 'task_overdue'], floor(rand() * 5) + 1) as event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT
        '550e8400-e29b-41d4-a716-446655440000' as team_id,
        format('{"task_id": "PROJ-%d", "assignee": "%s", "story_points": %d}',
            100 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
    FROM numbers(60)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440001' as team_id,
        format('{"task_id": "BACK-%d", "assignee": "%s", "story_points": %d}',
            100 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
    FROM numbers(60)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440002' as team_id,
        format('{"task_id": "FRONT-%d", "assignee": "%s", "story_points": %d}',
            100 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
    FROM numbers(60)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440003' as team_id,
        format('{"task_id": "MOB-%d", "assignee": "%s", "story_points": %d}',
            100 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
    FROM numbers(60)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440004' as team_id,
        format('{"task_id": "DEVOPS-%d", "assignee": "%s", "story_points": %d}',
            100 + number,
            arrayElement(['alice', 'bob', 'charlie', 'dave', 'eve'], floor(rand() * 5) + 1),
            arrayElement([1, 2, 3, 5, 8, 13], floor(rand() * 6) + 1)
        ) as payload,
        toDateTime('2026-04-15') + INTERVAL floor(rand() * 336) HOUR as occurred_at
    FROM numbers(60)
);

-- Generate CI/CD events: 30 pipelines per team (150 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'cicd' as source_type,
    arrayElement(['pipeline_success', 'pipeline_failed'], floor(rand() * 2) + 1) as event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT
        '550e8400-e29b-41d4-a716-446655440000' as team_id,
        format('{"pipeline_id": "run-%d", "project": "platform", "duration": %d}',
            1000 + number,
            floor(rand() * 300) + 60
        ) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(30)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440001' as team_id,
        format('{"pipeline_id": "pipe-%d", "project": "api", "duration": %d}',
            2000 + number,
            floor(rand() * 300) + 60
        ) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(30)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440002' as team_id,
        format('{"pipeline_id": "run-%d", "project": "web-ui", "duration": %d}',
            3000 + number,
            floor(rand() * 300) + 60
        ) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(30)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440003' as team_id,
        format('{"pipeline_id": "build-%d", "project": "mobile-app", "duration": %d}',
            4000 + number,
            floor(rand() * 400) + 120
        ) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(30)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440004' as team_id,
        format('{"pipeline_id": "deploy-%d", "project": "infrastructure", "duration": %d}',
            5000 + number,
            floor(rand() * 180) + 30
        ) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 168) HOUR as occurred_at
    FROM numbers(30)
);

-- Generate Metrics: 20 samples per team (100 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    'metrics' as source_type,
    'metric_value' as event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT
        '550e8400-e29b-41d4-a716-446655440000' as team_id,
        format('{"metric": "%s", "value": %d}',
            arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
                floor(rand() * 5) + 1),
            floor(rand() * 100)
        ) as payload,
        toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
    FROM numbers(20)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440001' as team_id,
        format('{"metric": "%s", "value": %d}',
            arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
                floor(rand() * 5) + 1),
            floor(rand() * 100)
        ) as payload,
        toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
    FROM numbers(20)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440002' as team_id,
        format('{"metric": "%s", "value": %d}',
            arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
                floor(rand() * 5) + 1),
            floor(rand() * 100)
        ) as payload,
        toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
    FROM numbers(20)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440003' as team_id,
        format('{"metric": "%s", "value": %d}',
            arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
                floor(rand() * 5) + 1),
            floor(rand() * 100)
        ) as payload,
        toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
    FROM numbers(20)
    UNION ALL
    SELECT
        '550e8400-e29b-41d4-a716-446655440004' as team_id,
        format('{"metric": "%s", "value": %d}',
            arrayElement(['cpu_usage', 'memory_usage', 'request_rate', 'error_rate', 'latency_p99'],
                floor(rand() * 5) + 1),
            floor(rand() * 100)
        ) as payload,
        toDateTime('2026-04-29') + INTERVAL floor(rand() * 24) HOUR as occurred_at
    FROM numbers(20)
);

-- Insert alerts for attention items (20 per team = 100 total)
INSERT INTO events (id, source_type, event_type, team_id, project_id, payload, occurred_at)
SELECT
    generateUUID() as id,
    source_type,
    event_type,
    team_id,
    NULL as project_id,
    payload,
    occurred_at
FROM (
    SELECT '550e8400-e29b-41d4-a716-446655440000' as team_id,
        'git' as source_type,
        'pr_stale' as event_type,
        format('{"pr_id": %d, "days_waiting": %d}', 1000 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440000' as team_id,
        'pm' as source_type,
        'task_blocked' as event_type,
        format('{"task_id": "PROJ-%d", "blocked_by": "PROJ-%d"}', 100 + number, 200 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440000' as team_id,
        'pm' as source_type,
        'task_overdue' as event_type,
        format('{"task_id": "PROJ-%d", "days_overdue": %d}', 100 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440000' as team_id,
        'cicd' as source_type,
        'ci_failed' as event_type,
        format('{"pipeline_id": "run-%d", "failures_in_hour": %d}', 1000 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440001' as team_id,
        'git' as source_type,
        'pr_stale' as event_type,
        format('{"mr_id": %d, "days_waiting": %d}', 2000 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440001' as team_id,
        'pm' as source_type,
        'task_blocked' as event_type,
        format('{"task_id": "BACK-%d", "blocked_by": "BACK-%d"}', 100 + number, 200 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440001' as team_id,
        'pm' as source_type,
        'task_overdue' as event_type,
        format('{"task_id": "BACK-%d", "days_overdue": %d}', 100 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440001' as team_id,
        'cicd' as source_type,
        'ci_failed' as event_type,
        format('{"pipeline_id": "pipe-%d", "failures_in_hour": %d}', 2000 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440002' as team_id,
        'git' as source_type,
        'pr_stale' as event_type,
        format('{"pr_id": %d, "days_waiting": %d}', 3000 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440002' as team_id,
        'pm' as source_type,
        'task_blocked' as event_type,
        format('{"task_id": "FRONT-%d", "blocked_by": "FRONT-%d"}', 100 + number, 200 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440002' as team_id,
        'pm' as source_type,
        'task_overdue' as event_type,
        format('{"task_id": "FRONT-%d", "days_overdue": %d}', 100 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440002' as team_id,
        'cicd' as source_type,
        'ci_failed' as event_type,
        format('{"pipeline_id": "run-%d", "failures_in_hour": %d}', 3000 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440003' as team_id,
        'git' as source_type,
        'pr_stale' as event_type,
        format('{"pr_id": %d, "days_waiting": %d}', 4000 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440003' as team_id,
        'pm' as source_type,
        'task_blocked' as event_type,
        format('{"task_id": "MOB-%d", "blocked_by": "MOB-%d"}', 100 + number, 200 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440003' as team_id,
        'pm' as source_type,
        'task_overdue' as event_type,
        format('{"task_id": "MOB-%d", "days_overdue": %d}', 100 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440003' as team_id,
        'cicd' as source_type,
        'ci_failed' as event_type,
        format('{"pipeline_id": "build-%d", "failures_in_hour": %d}', 4000 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440004' as team_id,
        'git' as source_type,
        'pr_stale' as event_type,
        format('{"pr_id": %d, "days_waiting": %d}', 5000 + number, floor(rand() * 7) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440004' as team_id,
        'pm' as source_type,
        'task_blocked' as event_type,
        format('{"task_id": "DEVOPS-%d", "blocked_by": "DEVOPS-%d"}', 100 + number, 200 + floor(rand() * 50)) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440004' as team_id,
        'pm' as source_type,
        'task_overdue' as event_type,
        format('{"task_id": "DEVOPS-%d", "days_overdue": %d}', 100 + number, floor(rand() * 5) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
    UNION ALL
    SELECT '550e8400-e29b-41d4-a716-446655440004' as team_id,
        'cicd' as source_type,
        'ci_failed' as event_type,
        format('{"pipeline_id": "deploy-%d", "failures_in_hour": %d}', 5000 + number, floor(rand() * 4) + 1) as payload,
        toDateTime('2026-04-28') + INTERVAL floor(rand() * 48) HOUR as occurred_at
    FROM numbers(4)
);

SELECT 'Mock data inserted: ~1250 events across 5 teams' as result;