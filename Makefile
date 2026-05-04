.PHONY: build run stop clean test lint docker-build docker-up docker-down docker-logs ui-run

# Defaults
APP_NAME := metraly
API_PORT := 8000
UI_PORT := 3000

# Go
GO := go
GOFLAGS := -v

# Docker
DOCKER := docker
DOCKER_COMPOSE := docker compose

# Build API
build:
	@echo "Building API..."
	$(GO) build $(GOFLAGS) -o bin/api ./cmd/api/

# Run API locally
run: build
	@echo "Starting API on port $(API_PORT)..."
	CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=8123 REDIS_HOST=localhost REDIS_PORT=6379 ./bin/api

# Run UI locally
ui-run:
	@echo "Starting UI on port $(UI_PORT)..."
	cd ui && npm run dev

# Run tests
test:
	@echo "Running tests..."
	$(GO) test $(GOFLAGS) ./...

# Run linter
lint:
	@echo "Running linter..."
	$(GO) vet ./...
	@which staticcheck > /dev/null && staticcheck ./... || echo "staticcheck not installed"

# Docker: build all
docker-build:
	@echo "Building Docker images..."
	DOCKER_BUILDKIT=1 $(DOCKER_COMPOSE) build --parallel

# Docker: start all services
docker-up:
	@echo "Starting services..."
	$(DOCKER_COMPOSE) up -d
	@echo "Waiting for ClickHouse..."
	@for i in $$(seq 1 30); do \
		if curl -s http://localhost:8123/ping > /dev/null 2>&1; then \
			echo "ClickHouse is ready!"; \
			break; \
		fi; \
		echo "Waiting... $$i/30"; \
		sleep 1; \
	done

# Docker: stop all services
docker-down:
	@echo "Stopping services..."
	$(DOCKER_COMPOSE) down

# Docker: rebuild and start
docker-restart: docker-down docker-up

# Docker: rebuild API only
docker-build-api:
	@echo "Building API image..."
	DOCKER_BUILDKIT=1 $(DOCKER_COMPOSE) build api

# Docker: restart API
docker-restart-api: docker-build-api
	$(DOCKER_COMPOSE) up -d api

# Docker: show logs
docker-logs:
	$(DOCKER_COMPOSE) logs -f

# Docker: show status
docker-ps:
	$(DOCKER_COMPOSE) ps

# Insert test data into ClickHouse
docker-test-data:
	@echo "Inserting test data..."
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO teams (id, name) SELECT '11111111-1111-1111-1111-111111111111', 'Backend Team'" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO teams (id, name) SELECT '22222222-2222-2222-2222-222222222222', 'Frontend Team'" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'git', 'pr_opened', '11111111-1111-1111-1111-111111111111', '{\"author\": \"alice\", \"pr_id\": \"123\"}', now())" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'git', 'pr_merged', '11111111-1111-1111-1111-111111111111', '{\"author\": \"alice\", \"pr_id\": \"123\"}', now()-1)" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'pm', 'task_created', '11111111-1111-1111-1111-111111111111', '{\"assignee\": \"bob\", \"task_id\": \"task-1\"}', now()-2)" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'pm', 'task_done', '11111111-1111-1111-1111-111111111111', '{\"assignee\": \"bob\", \"task_id\": \"task-1\"}', now()-1)" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'pm', 'task_blocked', '11111111-1111-1111-1111-111111111111', '{\"assignee\": \"charlie\", \"task_id\": \"task-2\"}', now()-0.125)" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', 'cicd', 'pipeline_success', '11111111-1111-1111-1111-111111111111', '{\"pipeline_id\": \"pip-1\"}', now()-0.166)" 2>/dev/null || true
	@docker exec metraly-clickhouse-1 clickhouse-client -q "INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaag', 'cicd', 'pipeline_failed', '11111111-1111-1111-1111-111111111111', '{\"pipeline_id\": \"pip-2\"}', now()-0.083)" 2>/dev/null || true
	@echo "Test data inserted!"

# Health check
health:
	@echo "Checking API health..."
	@curl -s http://localhost:$(API_PORT)/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$(API_PORT)/health

# Dashboard check
dashboard:
	@echo "Checking dashboard..."
	@curl -s http://localhost:$(API_PORT)/api/v1/dashboard | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$(API_PORT)/api/v1/dashboard

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -rf bin/
	$(DOCKER) system prune -f --filter "label=com.docker.compose.project=$(APP_NAME)" 2>/dev/null || true

# Show help
help:
	@echo "Metraly - Team Engineering Metrics API"
	@echo ""
	@echo "Available targets:"
	@echo "  build              - Build Go API"
	@echo "  run                - Run API locally"
	@echo "  ui-run             - Run UI locally"
	@echo "  test               - Run tests"
	@echo "  lint               - Run linter"
	@echo "  docker-up          - Start all Docker services"
	@echo "  docker-down        - Stop all Docker services"
	@echo "  docker-restart     - Restart all Docker services"
	@echo "  docker-build-api   - Rebuild API only"
	@echo "  docker-restart-api - Restart API only"
	@echo "  docker-logs        - Show Docker logs"
	@echo "  docker-ps          - Show Docker status"
	@echo "  docker-test-data   - Insert test data"
	@echo "  health             - Check API health"
	@echo "  dashboard          - Check dashboard data"
	@echo "  clean              - Clean build artifacts"