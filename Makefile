.PHONY: help up down restart logs test-data cycle3-data clean

help:
	@echo "Team Dashboard Commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show logs"
	@echo "  make test-data   - Load basic test data"
	@echo "  make cycle3-data - Load Cycle 3 test data (velocity, activity, comparison)"
	@echo "  make clean       - Remove all containers and volumes"

up:
	docker-compose up -d
	@echo "UI: http://localhost:3000"
	@echo "API: http://localhost:8000"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

test-data:
	@echo "Loading test data..."
	@docker exec -i tl-tools-clickhouse-1 clickhouse-client < clickhouse/test_data.sql
	@echo "Loaded!"

cycle3-data:
	@echo "Loading Cycle 3 test data..."
	@docker exec -i tl-tools-clickhouse-1 clickhouse-client < clickhouse/cycle3_data.sql
	@echo "Loaded!"

clean:
	docker-compose down -v
	@echo "All containers and volumes removed"