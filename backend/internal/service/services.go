package service

import (
	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/repository"
)

type Services struct {
	Artworks   *ArtworkService
	Categories *CategoryService
	Orders     *OrderService
	Auth       *AuthService
	Artist     *ArtistService
	Storage    *StorageService
}

type Deps struct {
	Repos  *repository.Repositories
	Config *config.Config
}

func NewServices(d Deps) *Services {
	storage := NewStorageService(d.Config.S3)

	return &Services{
		Artworks:   NewArtworkService(d.Repos.Artworks, d.Repos.Categories, storage),
		Categories: NewCategoryService(d.Repos.Categories),
		Orders:     NewOrderService(d.Repos.Orders, d.Repos.Artworks, d.Config.Mail),
		Auth:       NewAuthService(d.Repos.Admins, d.Config.JWT),
		Artist:     NewArtistService(d.Repos.Artist, storage),
		Storage:    storage,
	}
}
