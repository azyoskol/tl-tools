package seed

type PRNG struct{ state int64 }

func NewPRNG(seed int64) *PRNG { return &PRNG{state: seed} }

func (p *PRNG) Next() float64 {
	p.state = (p.state * 16807) % 2147483647
	return float64(p.state-1) / 2147483646.0
}

func (p *PRNG) Intn(n int) int {
	return int(p.Next() * float64(n))
}

func (p *PRNG) Float64Between(min, max float64) float64 {
	return min + p.Next()*(max-min)
}
