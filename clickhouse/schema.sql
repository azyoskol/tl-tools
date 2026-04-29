-- Team Dashboard MVP - ClickHouse Schema

-- Raw events table
CREATE TABLE IF NOT EXISTS events (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    project_id Nullable(UUID),
    payload JSON,
    occurred_at DateTime64(3),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (team_id, source_type, occurred_at);

-- Daily aggregates materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_aggregates
ENGINE = SummingMergeTree()
ORDER BY (team_id, date, source_type, event_type)
AS SELECT
    team_id,
    toDate(occurred_at) AS date,
    source_type,
    event_type,
    count() AS count
FROM events
GROUP BY team_id, date, source_type, event_type;

-- PR metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS pr_metrics
ENGINE = MergeTree()
ORDER BY (team_id, pr_id)
AS SELECT
    team_id,
    payload['pr_id'] AS pr_id,
    payload['author'] AS author,
    occurred_at AS created_at,
    maxIf(occurred_at, event_type = 'pr_merged') AS merged_at,
    maxIf(occurred_at, event_type = 'pr_reviewed') AS first_review_at,
    countIf(event_type = 'pr_review_request') AS review_requests,
    payload['lines_added'] + payload['lines_removed'] AS pr_size
FROM events
WHERE source_type = 'git'
GROUP BY team_id, pr_id;

-- Cycle metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS cycle_metrics
ENGINE = MergeTree()
ORDER BY (team_id, task_id)
AS SELECT
    team_id,
    payload['task_id'] AS task_id,
    minIf(occurred_at, event_type = 'task_in_progress') AS started_at,
    minIf(occurred_at, event_type = 'task_done') AS completed_at,
    payload['story_points'] AS story_points
FROM events
WHERE source_type = 'pm'
GROUP BY team_id, task_id;

-- Team workload materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS team_workload
ENGINE = MergeTree()
ORDER BY (team_id, user_id, date)
AS SELECT
    team_id,
    payload['assignee'] AS user_id,
    toDate(occurred_at) AS date,
    countIf(event_type = 'task_created') AS tasks_created,
    countIf(event_type = 'task_done') AS tasks_completed,
    countIf(event_type = 'task_blocked') AS tasks_blocked,
    sumIf(payload['story_points'], event_type = 'task_done') AS points_completed
FROM events
WHERE source_type = 'pm'
GROUP BY team_id, user_id, date;

-- CI/CD health materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS cicd_health
ENGINE = SummingMergeTree()
ORDER BY (team_id, pipeline_id, date)
AS SELECT
    team_id,
    payload['pipeline_id'] AS pipeline_id,
    payload['project'] AS project,
    toDate(occurred_at) AS date,
    countIf(event_type = 'pipeline_success') AS success_count,
    countIf(event_type = 'pipeline_failed') AS failed_count,
    sumIf(payload['duration'], event_type = 'pipeline_completed') AS total_duration,
    avgIf(payload['duration'], event_type = 'pipeline_completed') AS avg_duration
FROM events
WHERE source_type = 'cicd'
GROUP BY team_id, pipeline_id, project, date;

-- Realtime alerts materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_alerts
ENGINE = MergeTree()
ORDER BY (team_id, alert_type, created_at)
AS SELECT
    team_id,
    event_type AS alert_type,
    payload AS details,
    occurred_at AS created_at
FROM events
WHERE event_type IN ('pr_stale', 'task_overdue', 'ci_failed', 'task_blocked');

-- Dead letter queue for failed events
CREATE TABLE IF NOT EXISTS events_dlq (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    payload JSON,
    occurred_at DateTime64(3),
    error_message String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (team_id, created_at);