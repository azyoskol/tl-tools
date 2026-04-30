-- Team Dashboard MVP - ClickHouse Schema

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID,
    name String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (id);

-- Raw events table
CREATE TABLE IF NOT EXISTS events (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    project_id Nullable(UUID),
    payload String,
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

-- Dead letter queue for failed events
CREATE TABLE IF NOT EXISTS events_dlq (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    payload String,
    occurred_at DateTime64(3),
    error_message String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (team_id, created_at);