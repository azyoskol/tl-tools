package config

type Config interface {
	Get(key, defaultValue string) string
	GetInt(key string, defaultValue int) int
}