package seed_test

import (
	"math"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/seed"
)

func TestPRNG_firstValue(t *testing.T) {
	p := seed.NewPRNG(42)
	got := p.Next()
	want := float64(705893) / float64(2147483646)
	if math.Abs(got-want) > 1e-12 {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestPRNG_firstFive(t *testing.T) {
	p := seed.NewPRNG(42)
	values := make([]float64, 5)
	for i := range values {
		values[i] = p.Next()
	}
	if values[0] >= values[1] || values[0] == 0 {
		t.Fatal("PRNG sequence looks wrong")
	}
}
