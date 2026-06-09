package repository

import (
	"context"
	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

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
				name_en = $2,
				bio = $3,
				bio_en = $4,
				photo_url = $5,
				home_photo_url = $6,
				about_photo_url = $7,
				email = $8,
				instagram = $9,
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
		artist.NameEN,
		artist.Bio,
		artist.BioEN,
		artist.PhotoURL,
		artist.HomePhotoURL,
		artist.AboutPhotoURL,
		artist.Email,
		artist.Instagram,
	)
	if err != nil {
		return nil, err
	}

	return artist, nil
}
