// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package biz

import "errors"

var (
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("version conflict")
	ErrForbidden    = errors.New("forbidden")
	ErrValidation   = errors.New("validation error")
	ErrUnauthorized = errors.New("unauthorized")
)
