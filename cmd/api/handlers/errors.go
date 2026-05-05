// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package handlers

import (
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/respond"
)

func ServiceUnavailable(w http.ResponseWriter, message string) {
	respond.Error(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", message)
}
