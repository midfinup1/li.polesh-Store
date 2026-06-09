package repository

import (
	"context"
	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

// Admin

type adminRepository struct {
	db *sqlx.DB
}

func NewAdminRepository(db *sqlx.DB) domain.AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) GetByEmail(ctx context.Context, email string) (*domain.Admin, error) {
	var admin domain.Admin

	err := r.db.GetContext(
		ctx,
		&admin,
		`SELECT * FROM admins WHERE email = $1`,
		email,
	)
	if err != nil {
		return nil, err
	}

	return &admin, nil
}
