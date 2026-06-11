package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type artworkRepository struct {
	db *sqlx.DB
}

func NewArtworkRepository(db *sqlx.DB) domain.ArtworkRepository {
	return &artworkRepository{db: db}
}

func (r *artworkRepository) GetAll(ctx context.Context, filter domain.ArtworkFilter) ([]domain.Artwork, error) {
	query := `
		SELECT a.*
		FROM artworks a
		WHERE 1 = 1
	`

	args := make([]any, 0)
	argumentNumber := 1

	if filter.Status != nil {
		query += fmt.Sprintf(" AND a.status = $%d", argumentNumber)
		args = append(args, *filter.Status)
		argumentNumber++
	}

	if filter.ExcludeHidden {
		query += fmt.Sprintf(" AND a.status <> $%d", argumentNumber)
		args = append(args, domain.ArtworkStatusHidden)
		argumentNumber++
	}

	if filter.CategoryID != nil {
		query += fmt.Sprintf(" AND a.category_id = $%d", argumentNumber)
		args = append(args, *filter.CategoryID)
		argumentNumber++
	}

	query += " ORDER BY a.sort_order ASC, a.created_at DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argumentNumber, argumentNumber+1)
		args = append(args, filter.Limit, filter.Offset)
	}

	artworks := make([]domain.Artwork, 0)

	if err := r.db.SelectContext(ctx, &artworks, query, args...); err != nil {
		return nil, err
	}

	if len(artworks) == 0 {
		return artworks, nil
	}

	ids := make([]int64, 0, len(artworks))
	for _, artwork := range artworks {
		ids = append(ids, artwork.ID)
	}

	images, err := r.getImagesByArtworkIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	for index := range artworks {
		artworkImages, exists := images[artworks[index].ID]
		if !exists {
			artworkImages = make([]domain.ArtworkImage, 0)
		}

		artworks[index].Images = artworkImages
	}

	return artworks, nil
}

func (r *artworkRepository) GetByID(ctx context.Context, id int64) (*domain.Artwork, error) {
	var artwork domain.Artwork

	err := r.db.GetContext(
		ctx,
		&artwork,
		`SELECT * FROM artworks WHERE id = $1`,
		id,
	)
	if err != nil {
		return nil, err
	}

	images, err := r.getImagesByArtworkIDs(ctx, []int64{id})
	if err != nil {
		return nil, err
	}

	artwork.Images = images[id]
	if artwork.Images == nil {
		artwork.Images = make([]domain.ArtworkImage, 0)
	}

	return &artwork, nil
}

func (r *artworkRepository) Create(ctx context.Context, artwork *domain.Artwork) (*domain.Artwork, error) {
	var id int64

	err := r.db.QueryRowContext(
		ctx,
		`
			INSERT INTO artworks (
				title,
				title_en,
				description,
				description_en,
				purchase_comment,
				purchase_comment_en,
				price,
				status,
				category_id,
				year,
				size,
				size_en,
				materials,
				materials_en,
				sort_order
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			RETURNING id
		`,
		artwork.Title,
		artwork.TitleEN,
		artwork.Description,
		artwork.DescriptionEN,
		artwork.PurchaseComment,
		artwork.PurchaseCommentEN,
		artwork.Price,
		artwork.Status,
		artwork.CategoryID,
		artwork.Year,
		artwork.Size,
		artwork.SizeEN,
		artwork.Materials,
		artwork.MaterialsEN,
		artwork.SortOrder,
	).Scan(&id)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *artworkRepository) Update(ctx context.Context, artwork *domain.Artwork) (*domain.Artwork, error) {
	result, err := r.db.ExecContext(
		ctx,
		`
			UPDATE artworks
			SET title = $1,
				title_en = $2,
				description = $3,
				description_en = $4,
				purchase_comment = $5,
				purchase_comment_en = $6,
				price = $7,
				status = $8,
				category_id = $9,
				year = $10,
				size = $11,
				size_en = $12,
				materials = $13,
				materials_en = $14,
				sort_order = $15,
				updated_at = NOW()
			WHERE id = $16
		`,
		artwork.Title,
		artwork.TitleEN,
		artwork.Description,
		artwork.DescriptionEN,
		artwork.PurchaseComment,
		artwork.PurchaseCommentEN,
		artwork.Price,
		artwork.Status,
		artwork.CategoryID,
		artwork.Year,
		artwork.Size,
		artwork.SizeEN,
		artwork.Materials,
		artwork.MaterialsEN,
		artwork.SortOrder,
		artwork.ID,
	)
	if err != nil {
		return nil, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("%w: artwork", domain.ErrNotFound)
	}

	return r.GetByID(ctx, artwork.ID)
}

func (r *artworkRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM artworks WHERE id = $1`,
		id,
	)
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23503" {
		return fmt.Errorf("%w: artwork has related orders; hide it instead of deleting", domain.ErrConflict)
	}
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: artwork", domain.ErrNotFound)
	}

	return nil
}

func (r *artworkRepository) DeleteWithInactiveOrders(ctx context.Context, id int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(
		ctx,
		`
			DELETE FROM orders
			WHERE artwork_id = $1
			  AND status NOT IN ('new', 'contacted')
		`,
		id,
	); err != nil {
		return err
	}

	result, err := tx.ExecContext(ctx, `DELETE FROM artworks WHERE id = $1`, id)
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23503" {
		return fmt.Errorf("%w: artwork has active related orders", domain.ErrConflict)
	}
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: artwork", domain.ErrNotFound)
	}

	return tx.Commit()
}

func (r *artworkRepository) ReorderArtworks(ctx context.Context, categoryID int64, artworkIDs []int64) error {
	transaction, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer transaction.Rollback()

	for sortOrder, artworkID := range artworkIDs {
		result, err := transaction.ExecContext(
			ctx,
			`
				UPDATE artworks
				SET sort_order = $1,
					updated_at = NOW()
				WHERE id = $2
				  AND category_id = $3
			`,
			sortOrder,
			artworkID,
			categoryID,
		)
		if err != nil {
			return err
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return fmt.Errorf("%w: artwork", domain.ErrNotFound)
		}
	}

	return transaction.Commit()
}

func (r *artworkRepository) AddImage(ctx context.Context, image *domain.ArtworkImage) (*domain.ArtworkImage, error) {
	err := r.db.QueryRowContext(
		ctx,
		`
			INSERT INTO artwork_images (
				artwork_id,
				original_url,
				thumb_url,
				thumb_webp_url,
				thumb_avif_url,
				display_url,
				display_webp_url,
				alt_text,
				sort_order
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`,
		image.ArtworkID,
		image.OriginalURL,
		image.ThumbURL,
		image.ThumbWebPURL,
		image.ThumbAVIFURL,
		image.DisplayURL,
		image.DisplayWebPURL,
		image.AltText,
		image.SortOrder,
	).Scan(&image.ID)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func (r *artworkRepository) GetImageByID(ctx context.Context, imageID int64) (*domain.ArtworkImage, error) {
	var image domain.ArtworkImage

	err := r.db.GetContext(
		ctx,
		&image,
		`SELECT * FROM artwork_images WHERE id = $1`,
		imageID,
	)
	if err != nil {
		return nil, err
	}

	return &image, nil
}

func (r *artworkRepository) GetImagesByArtworkID(ctx context.Context, artworkID int64) ([]domain.ArtworkImage, error) {
	images := make([]domain.ArtworkImage, 0)

	err := r.db.SelectContext(
		ctx,
		&images,
		`
			SELECT *
			FROM artwork_images
			WHERE artwork_id = $1
			ORDER BY sort_order ASC, id ASC
		`,
		artworkID,
	)
	if err != nil {
		return nil, err
	}

	return images, nil
}

func (r *artworkRepository) DeleteImage(ctx context.Context, imageID int64) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM artwork_images WHERE id = $1`,
		imageID,
	)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: artwork image", domain.ErrNotFound)
	}

	return nil
}

func (r *artworkRepository) UpdateImageAltText(ctx context.Context, artworkID int64, imageID int64, altText string) (*domain.ArtworkImage, error) {
	var image domain.ArtworkImage

	err := r.db.GetContext(
		ctx,
		&image,
		`
			UPDATE artwork_images
			SET alt_text = $1
			WHERE id = $2
			  AND artwork_id = $3
			RETURNING *
		`,
		altText,
		imageID,
		artworkID,
	)
	if err != nil {
		return nil, err
	}

	return &image, nil
}

func (r *artworkRepository) ReorderImages(ctx context.Context, artworkID int64, imageIDs []int64) error {
	transaction, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer transaction.Rollback()

	for order, imageID := range imageIDs {
		result, err := transaction.ExecContext(
			ctx,
			`
				UPDATE artwork_images
				SET sort_order = $1
				WHERE id = $2
				  AND artwork_id = $3
			`,
			order,
			imageID,
			artworkID,
		)
		if err != nil {
			return err
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return fmt.Errorf("%w: artwork image", domain.ErrNotFound)
		}
	}

	return transaction.Commit()
}

func (r *artworkRepository) getImagesByArtworkIDs(ctx context.Context, ids []int64) (map[int64][]domain.ArtworkImage, error) {
	result := make(map[int64][]domain.ArtworkImage)

	if len(ids) == 0 {
		return result, nil
	}

	query, args, err := sqlx.In(
		`
			SELECT *
			FROM artwork_images
			WHERE artwork_id IN (?)
			ORDER BY sort_order ASC, id ASC
		`,
		ids,
	)
	if err != nil {
		return nil, err
	}

	query = r.db.Rebind(query)

	images := make([]domain.ArtworkImage, 0)

	if err := r.db.SelectContext(ctx, &images, query, args...); err != nil {
		return nil, err
	}

	for _, image := range images {
		result[image.ArtworkID] = append(result[image.ArtworkID], image)
	}

	return result, nil
}
