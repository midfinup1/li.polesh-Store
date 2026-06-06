package domain

import "errors"

// Sentinel errors shared across layers. Handlers map these to HTTP status codes
// (see handler.respondServiceError): ErrValidation→400, ErrNotFound→404,
// ErrConflict→409. Wrap with fmt.Errorf("%w: detail", domain.ErrValidation).
var (
	ErrValidation = errors.New("validation error")
	ErrNotFound   = errors.New("not found")
	ErrConflict   = errors.New("conflict")
)
