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
			INSERT INTO categories (name, slug, sort_order)
			VALUES ($1, $2, $3)
			RETURNING id, created_at
		`,
		category.Name,
		category.Slug,
		category.SortOrder,
	).Scan(
		&category.ID,
		&category.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	_, err := r.db.ExecContext(
		ctx,
		`
			UPDATE categories
			SET name = $1,
				slug = $2,
				sort_order = $3
			WHERE id = $4
		`,
		category.Name,
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
	_, err := r.db.ExecContext(
		ctx,
		`DELETE FROM categories WHERE id = $1`,
		id,
	)

	return err
}

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
	_, err := r.db.ExecContext(
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

// Artist

type artistRepository struct {
	db *sqlx.DB
}

func NewArtistRepository(db *sqlx.DB) domain.ArtistRepository {
	return &artistRepository{db: db}
}

func (r *artistRepository) Get(ctx context.Context) (*domain.Artist, error) {
	var artist domain.Artist

	err := r.db.GetContext(
		ctx,
		&artist,
		`SELECT * FROM artist ORDER BY id ASC LIMIT 1`,
	)
	if err != nil {
		return nil, err
	}

	return &artist, nil
}

func (r *artistRepository) Update(ctx context.Context, artist *domain.Artist) (*domain.Artist, error) {
	err := r.db.GetContext(
		ctx,
		artist,
		`
			UPDATE artist
			SET name = $1,
				bio = $2,
				photo_url = $3,
				email = $4,
				instagram = $5,
				updated_at = NOW()
			WHERE id = (
				SELECT id
				FROM artist
				ORDER BY id ASC
				LIMIT 1
			)
			RETURNING *
		`,
		artist.Name,
		artist.Bio,
		artist.PhotoURL,
		artist.Email,
		artist.Instagram,
	)
	if err != nil {
		return nil, err
	}

	return artist, nil
}
