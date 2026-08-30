package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type exhibitionRepository struct {
	db *sqlx.DB
}

func NewExhibitionRepository(db *sqlx.DB) domain.ExhibitionRepository {
	return &exhibitionRepository{db: db}
}

func (r *exhibitionRepository) GetAll(ctx context.Context) ([]domain.Exhibition, error) {
	exhibitions := make([]domain.Exhibition, 0)

	err := r.db.SelectContext(
		ctx,
		&exhibitions,
		`SELECT * FROM exhibitions ORDER BY sort_order ASC, name ASC`,
	)
	if err != nil {
		return nil, err
	}

	return exhibitions, nil
}

func (r *exhibitionRepository) GetByID(ctx context.Context, id int64) (*domain.Exhibition, error) {
	var exhibition domain.Exhibition

	err := r.db.GetContext(
		ctx,
		&exhibition,
		`SELECT * FROM exhibitions WHERE id = $1`,
		id,
	)
	if err != nil {
		return nil, err
	}

	return &exhibition, nil
}

func (r *exhibitionRepository) Create(ctx context.Context, exhibition *domain.Exhibition) (*domain.Exhibition, error) {
	err := r.db.QueryRowContext(
		ctx,
		`
			INSERT INTO exhibitions (name, name_en, slug, sort_order)
			VALUES ($1, $2, $3, $4)
			RETURNING id, created_at, updated_at
		`,
		exhibition.Name,
		exhibition.NameEN,
		exhibition.Slug,
		exhibition.SortOrder,
	).Scan(
		&exhibition.ID,
		&exhibition.CreatedAt,
		&exhibition.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return exhibition, nil
}

func (r *exhibitionRepository) Update(ctx context.Context, exhibition *domain.Exhibition) (*domain.Exhibition, error) {
	err := r.db.GetContext(
		ctx,
		exhibition,
		`
			UPDATE exhibitions
			SET name = $1,
				name_en = $2,
				slug = $3,
				sort_order = $4,
				updated_at = NOW()
			WHERE id = $5
			RETURNING *
		`,
		exhibition.Name,
		exhibition.NameEN,
		exhibition.Slug,
		exhibition.SortOrder,
		exhibition.ID,
	)
	if err != nil {
		return nil, err
	}

	return exhibition, nil
}

func (r *exhibitionRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM exhibitions WHERE id = $1`,
		id,
	)
	if err != nil {
		return err
	}

	return ensureRowsAffected(result, "exhibition")
}

func (r *exhibitionRepository) Reorder(ctx context.Context, ids []int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for sortOrder, id := range ids {
		result, err := tx.ExecContext(
			ctx,
			`UPDATE exhibitions SET sort_order = $1, updated_at = NOW() WHERE id = $2`,
			sortOrder,
			id,
		)
		if err != nil {
			return err
		}
		if err := ensureRowsAffected(result, "series"); err != nil {
			return err
		}
	}

	return tx.Commit()
}
