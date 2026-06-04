package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type Repositories struct {
	Artworks   domain.ArtworkRepository
	Categories domain.CategoryRepository
	Orders     domain.OrderRepository
	Admins     domain.AdminRepository
	Artist     domain.ArtistRepository
}

func NewRepositories(db *sqlx.DB) *Repositories {
	return &Repositories{
		Artworks:   NewArtworkRepository(db),
		Categories: NewCategoryRepository(db),
		Orders:     NewOrderRepository(db),
		Admins:     NewAdminRepository(db),
		Artist:     NewArtistRepository(db),
	}
}
