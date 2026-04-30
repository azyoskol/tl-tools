package config

import (
	"fmt"
	"os"
)

type envConfig struct{}

func NewEnvConfig() Config {
	return &envConfig{}
}

func (e *envConfig) Get(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func (e *envConfig) GetInt(key string, defaultValue int) int {
	var n int
	fmt.Sscanf(os.Getenv(key), "%d", &n)
	if n == 0 {
		return defaultValue
	}
	return n
}

func NewDefaultConfig() Config {
	if cfg, err := NewYamlConfig("config.yaml"); err == nil {
		return cfg
	}
	return NewEnvConfig()
}