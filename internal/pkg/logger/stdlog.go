package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

type zerologLogger struct {
	log zerolog.Logger
}

func NewStdLogger() Logger {
	zerolog.TimeFieldFormat = time.RFC3339
	return &zerologLogger{
		log: zerolog.New(os.Stdout).Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}).Level(zerolog.InfoLevel),
	}
}

func (l *zerologLogger) Debug(msg string, args ...any) {
	l.log.Debug().Msgf(msg, args...)
}

func (l *zerologLogger) Info(msg string, args ...any) {
	l.log.Info().Msgf(msg, args...)
}

func (l *zerologLogger) Warn(msg string, args ...any) {
	l.log.Warn().Msgf(msg, args...)
}

func (l *zerologLogger) Error(msg string, args ...any) {
	l.log.Error().Msgf(msg, args...)
}