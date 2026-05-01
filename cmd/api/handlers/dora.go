package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
)

func seededRand(seed int) float64 {
	rand.Seed(int64(seed))
	return rand.Float64()
}

func makeSeries(seed int, points int, base, variance float64) []float64 {
	res := make([]float64, points)
	s := seed
	for i := 0; i < points; i++ {
		res[i] = base + (seededRand(s) - 0.5) * variance * 2
		s++
	}
	return res
}

type DORAMetrics struct {
	ID     string   `json:"id"`
	Label  string   `json:"label"`
	Value  string   `json:"value"`
	Delta  string   `json:"delta"`
	Good   bool     `json:"good"`
	Level  string   `json:"level"`
	Color  string   `json:"color"`
	Series []float64 `json:"series"`
}

type DORAResponse struct {
	Metrics []DORAMetrics `json:"metrics"`
}

func DORAHandler(w http.ResponseWriter, r *http.Request) {
	metrics := []DORAMetrics{
		{ID: "deploy-freq", Label: "Deployment Frequency", Value: "4.2/day", Delta: "+0.8", Good: true, Level: "Elite", Color: "#00E5FF", Series: makeSeries(1, 30, 4, 1)},
		{ID: "lead-time", Label: "Lead Time for Changes", Value: "2.1 hrs", Delta: "-0.3", Good: true, Level: "High", Color: "#00E5FF", Series: makeSeries(2, 30, 2.5, 0.8)},
		{ID: "mttr", Label: "Mean Time to Recovery", Value: "12 min", Delta: "-5 min", Good: true, Level: "Elite", Color: "#00E5FF", Series: makeSeries(3, 30, 15, 5)},
		{ID: "change-fail", Label: "Change Failure Rate", Value: "4%", Delta: "-2%", Good: true, Level: "Elite", Color: "#00C853", Series: makeSeries(4, 30, 5, 2)},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(DORAResponse{Metrics: metrics})
}