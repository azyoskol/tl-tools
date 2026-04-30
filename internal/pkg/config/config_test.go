package config

import (
	"os"
	"testing"
)

func TestGet_returnsDefault_whenEnvNotSet(t *testing.T) {
	os.Unsetenv("TEST_KEY_MISSING")
	cfg := NewEnvConfig()
	if got := cfg.Get("TEST_KEY_MISSING", "default_val"); got != "default_val" {
		t.Errorf("expected %q, got %q", "default_val", got)
	}
}

func TestGet_returnsEnvValue_whenSet(t *testing.T) {
	os.Setenv("TEST_KEY_SET", "hello")
	defer os.Unsetenv("TEST_KEY_SET")
	cfg := NewEnvConfig()
	if got := cfg.Get("TEST_KEY_SET", "default_val"); got != "hello" {
		t.Errorf("expected %q, got %q", "hello", got)
	}
}

func TestGetInt_returnsDefault_whenEnvNotSet(t *testing.T) {
	os.Unsetenv("TEST_INT_MISSING")
	cfg := NewEnvConfig()
	if got := cfg.GetInt("TEST_INT_MISSING", 42); got != 42 {
		t.Errorf("expected %d, got %d", 42, got)
	}
}

func TestGetInt_returnsParsedValue_whenSet(t *testing.T) {
	os.Setenv("TEST_INT_SET", "7")
	defer os.Unsetenv("TEST_INT_SET")
	cfg := NewEnvConfig()
	if got := cfg.GetInt("TEST_INT_SET", 42); got != 7 {
		t.Errorf("expected %d, got %d", 7, got)
	}
}
