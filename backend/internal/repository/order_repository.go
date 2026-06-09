package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

// Order

type orderRepository struct {
	db *sqlx.DB
}

func NewOrderRepository(db *sqlx.DB) domain.OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) GetAll(ctx context.Context, status *domain.OrderStatus) ([]domain.Order, error) {
	query := `
		SELECT o.*
		FROM orders o
		WHERE 1 = 1
	`

	args := make([]any, 0)

	if status != nil {
		query += " AND o.status = $1"
		args = append(args, *status)
	}

	query += " ORDER BY o.created_at DESC"

	orders := make([]domain.Order, 0)

	err := r.db.SelectContext(ctx, &orders, query, args...)
	if err != nil {
		return nil, err
	}

	if len(orders) == 0 {
		return orders, nil
	}

	artworkIDs := make([]int64, 0, len(orders))
	for _, order := range orders {
		artworkIDs = append(artworkIDs, order.ArtworkID)
	}

	artworksByID, err := r.getArtworksByIDs(ctx, artworkIDs)
	if err != nil {
		return nil, err
	}

	for index := range orders {
		artwork, exists := artworksByID[orders[index].ArtworkID]
		if exists {
			orders[index].Artwork = artwork
		}
	}

	return orders, nil
}

func (r *orderRepository) GetByID(ctx context.Context, id int64) (*domain.Order, error) {
	var order domain.Order

	err := r.db.GetContext(
		ctx,
		&order,
		`SELECT * FROM orders WHERE id = $1`,
		id,
	)
	if err != nil {
		return nil, err
	}

	artworksByID, err := r.getArtworksByIDs(ctx, []int64{order.ArtworkID})
	if err != nil {
		return nil, err
	}

	if artwork, exists := artworksByID[order.ArtworkID]; exists {
		order.Artwork = artwork
	}

	return &order, nil
}

func (r *orderRepository) Create(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	var id int64

	err := r.db.QueryRowContext(
		ctx,
		`
			INSERT INTO orders (artwork_id, name, email, phone, message, status)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`,
		order.ArtworkID,
		order.Name,
		order.Email,
		order.Phone,
		order.Message,
		domain.OrderStatusNew,
	).Scan(&id)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *orderRepository) UpdateStatus(ctx context.Context, id int64, status domain.OrderStatus) error {
	result, err := r.db.ExecContext(
		ctx,
		`
			UPDATE orders
			SET status = $1,
				updated_at = NOW()
			WHERE id = $2
		`,
		status,
		id,
	)

	if err != nil {
		return err
	}
	return ensureRowsAffected(result, "order")
}

func (r *orderRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM orders WHERE id = $1`,
		id,
	)
	if err != nil {
		return err
	}
	return ensureRowsAffected(result, "order")
}

func (r *orderRepository) CountActiveByArtworkID(ctx context.Context, artworkID int64) (int64, error) {
	var count int64

	err := r.db.GetContext(
		ctx,
		&count,
		`
			SELECT COUNT(*)
			FROM orders
			WHERE artwork_id = $1
			  AND status IN ('new', 'contacted')
		`,
		artworkID,
	)

	return count, err
}

func (r *orderRepository) DeleteInactiveByArtworkID(ctx context.Context, artworkID int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`
			DELETE FROM orders
			WHERE artwork_id = $1
			  AND status NOT IN ('new', 'contacted')
		`,
		artworkID,
	)

	if err != nil {
		return err
	}
	_, err = result.RowsAffected()
	return err
}

func (r *orderRepository) getArtworksByIDs(ctx context.Context, ids []int64) (map[int64]*domain.Artwork, error) {
	result := make(map[int64]*domain.Artwork)

	if len(ids) == 0 {
		return result, nil
	}

	query, args, err := sqlx.In(
		`
			SELECT *
			FROM artworks
			WHERE id IN (?)
		`,
		ids,
	)
	if err != nil {
		return nil, err
	}

	query = r.db.Rebind(query)

	artworks := make([]domain.Artwork, 0)

	if err := r.db.SelectContext(ctx, &artworks, query, args...); err != nil {
		return nil, err
	}

	for index := range artworks {
		artwork := artworks[index]
		artwork.Images = make([]domain.ArtworkImage, 0)
		result[artwork.ID] = &artwork
	}

	return result, nil
}
