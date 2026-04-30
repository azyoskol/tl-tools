package apperrors

import "fmt"

type AppError struct {
	Detail  string `json:"detail"`
	Status  int    `json:"status"`
	Code    string `json:"code,omitempty"`
}

func (e *AppError) Error() string {
	return e.Detail
}

func NewAppError(detail string, status int, code string) *AppError {
	return &AppError{
		Detail:  detail,
		Status:  status,
		Code:    code,
	}
}

func BadRequest(detail string) *AppError {
	return NewAppError(detail, 400, "BAD_REQUEST")
}

func NotFound(detail string) *AppError {
	return NewAppError(detail, 404, "NOT_FOUND")
}

func InternalError(detail string) *AppError {
	return NewAppError(detail, 500, "INTERNAL_ERROR")
}

func DatabaseError(err error) *AppError {
	return NewAppError(fmt.Sprintf("database error: %v", err), 500, "DATABASE_ERROR")
}

func ValidationError(detail string) *AppError {
	return NewAppError(detail, 422, "VALIDATION_ERROR")
}