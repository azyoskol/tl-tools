# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.1.0] - 2026-05-01

### Added
- **Error Handling**: AppError with RFC 7807 format (detail, status, code)
- **Structured Logging**: zerolog with JSON output and console formatting
- **Validation**: go-playground/validator for request validation
- **OpenAPI**: Swagger UI at /docs endpoint
- **Observability**: OpenTelemetry with TracerProvider and MeterProvider

### Changed
- Handlers now use centralized error handling middleware
- Logging replaced with zerolog

## [1.0.0] - 2026-05-01

### Added
- **SOLID Principles**: Full DIP implementation with service interfaces
  - DashboardServiceInterface, TeamsServiceInterface, WebhookServiceInterface
  - VelocityServiceInterface, ComparisonServiceInterface, HealthServiceInterface
- **YAML Config**: config.yaml with environment variable override
- **gRPC Server**: Internal communication on port 9000
- **Parallel Queries**: WaitGroup + Mutex for concurrent DB requests in dashboard

### Changed
- Handlers now depend on biz interfaces instead of concrete database
- Refactored biz layer: TeamsService, WebhookService, VelocityService, ComparisonService, HealthService
- Graceful shutdown using errGroup for HTTP + gRPC coordination

### Removed
- Python tests (replaced with Go integration tests)
- Duplicate OverviewHandler (merged into TeamsHandler)

### Fixed
- DIP compliance for all 7 handlers

## [0.0.1] - 2026-04-30

### Added
- Initial Go API with Chi router
- ClickHouse database integration
- Redis caching layer
- Basic dashboard, teams, webhook endpoints