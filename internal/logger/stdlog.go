package logger

import "log"

type stdLogger struct {
	logger *log.Logger
}

func NewStdLogger() Logger {
	return &stdLogger{logger: log.Default()}
}

func (l *stdLogger) Debug(msg string, args ...any) {
	l.logger.Printf("[DEBUG] "+msg, args...)
}

func (l *stdLogger) Info(msg string, args ...any) {
	l.logger.Printf("[INFO] "+msg, args...)
}

func (l *stdLogger) Warn(msg string, args ...any) {
	l.logger.Printf("[WARN] "+msg, args...)
}

func (l *stdLogger) Error(msg string, args ...any) {
	l.logger.Printf("[ERROR] "+msg, args...)
}