package telemetry

import (
	"context"
	"fmt"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

type Telemetry struct {
	TracerProvider *sdktrace.TracerProvider
	MeterProvider  *sdkmetric.MeterProvider
}

func NewTelemetry(serviceName string) (*Telemetry, error) {
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	return &Telemetry{
		TracerProvider: tp,
		MeterProvider:  mp,
	}, nil
}

func (t *Telemetry) Shutdown(ctx context.Context) error {
	if t.TracerProvider != nil {
		t.TracerProvider.Shutdown(ctx)
	}
	if t.MeterProvider != nil {
		t.MeterProvider.Shutdown(ctx)
	}
	return nil
}