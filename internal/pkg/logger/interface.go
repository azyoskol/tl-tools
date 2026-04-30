package logger

type Level int

const (
	DEBUG Level = iota
	INFO
	WARN
	ERROR
)

type Logger interface {
	Debug(msg string, args ...any)
	Info(msg string, args ...any)
	Warn(msg string, args ...any)
	Error(msg string, args ...any)
}