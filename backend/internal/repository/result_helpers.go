package repository

import (
	"database/sql"
	"fmt"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

func ensureRowsAffected(result sql.Result, entity string) error {
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("%w: %s", domain.ErrNotFound, entity)
	}

	return nil
}
