package biz

import "errors"

var (
    ErrNotFound     = errors.New("not found")
    ErrConflict     = errors.New("version conflict")
    ErrForbidden    = errors.New("forbidden")
    ErrValidation   = errors.New("validation error")
    ErrUnauthorized = errors.New("unauthorized")
)
