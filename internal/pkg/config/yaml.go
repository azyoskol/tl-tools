package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type yamlConfig struct {
	data map[string]any
}

type YamlConfig struct {
	*yamlConfig
}

type ConfigYAML struct {
	Database DatabaseConfig `yaml:"database"`
	Cache    CacheConfig    `yaml:"cache"`
	App      AppConfig      `yaml:"app"`
}

type DatabaseConfig struct {
	ClickHouse ClickHouseConfig `yaml:"clickhouse"`
}

type ClickHouseConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type CacheConfig struct {
	Redis RedisConfig `yaml:"redis"`
}

type RedisConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type AppConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	GrpcPort int    `yaml:"grpc_port"`
}

func NewYamlConfig(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg ConfigYAML
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse yaml: %w", err)
	}

	yc := &yamlConfig{
		data: make(map[string]any),
	}

	yc.data["CLICKHOUSE_HOST"] = cfg.Database.ClickHouse.Host
	yc.data["CLICKHOUSE_PORT"] = fmt.Sprintf("%d", cfg.Database.ClickHouse.Port)
	yc.data["REDIS_HOST"] = cfg.Cache.Redis.Host
	yc.data["REDIS_PORT"] = fmt.Sprintf("%d", cfg.Cache.Redis.Port)
	yc.data["PORT"] = fmt.Sprintf("%d", cfg.App.Port)
	yc.data["GRPC_PORT"] = fmt.Sprintf("%d", cfg.App.GrpcPort)

	return &YamlConfig{yamlConfig: yc}, nil
}

func (y *YamlConfig) Get(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	if v, ok := y.data[key].(string); ok && v != "" {
		return v
	}
	return defaultValue
}

func (y *YamlConfig) GetInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		var n int
		fmt.Sscanf(v, "%d", &n)
		if n != 0 {
			return n
		}
	}
	if v, ok := y.data[key].(string); ok {
		var n int
		fmt.Sscanf(v, "%d", &n)
		if n != 0 {
			return n
		}
	}
	return defaultValue
}