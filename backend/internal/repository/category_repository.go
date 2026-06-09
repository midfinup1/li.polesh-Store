package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

// Category

type categoryRepository struct {
	db *sqlx.DB
}

func NewCategoryRepository(db *sqlx.DB) domain.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) GetAll(ctx context.Context) ([]domain.Category, error) {
	categories := make([]domain.Category, 0)

	err := r.db.SelectContext(
		ctx,
		&categories,
		`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`,
	)
	if err != nil {
		return nil, err
	}

	return categories, nil
}

func (r *categoryRepository) GetByID(ctx context.Context, id int64) (*domain.Category, error) {
	var category domain.Category

	err := r.db.GetContext(
		ctx,
		&category,
		`SELECT * FROM categories WHERE id = $1`,
		id,
	)
	if err != nil {
		return nil, err
	}

	return &category, nil
}

func (r *categoryRepository) Create(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	err := r.db.QueryRowContext(
		ctx,
		`
			INSERT INTO categories (name, name_en, slug, sort_order)
			VALUES ($1, $2, $3, $4)
			RETURNING id, created_at, updated_at
		`,
		category.Name,
		category.NameEN,
		category.Slug,
		category.SortOrder,
	).Scan(
		&category.ID,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	err := r.db.GetContext(
		ctx,
		category,
		`
			UPDATE categories
			SET name = $1,
				name_en = $2,
				slug = $3,
				sort_order = $4,
				updated_at = NOW()
			WHERE id = $5
			RETURNING *
		`,
		category.Name,
		category.NameEN,
		category.Slug,
		category.SortOrder,
		category.ID,
	)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *categoryRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM categories WHERE id = $1`,
		id,
	)
	if err != nil {
		return err
	}
	return ensureRowsAffected(result, "category")
}
