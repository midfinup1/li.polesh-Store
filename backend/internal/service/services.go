package service

import (
	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/notify"
	"github.com/midfinup1/li.polesh-Store/backend/internal/repository"
)

type Services struct {
	Artworks   *ArtworkService
	Categories *CategoryService
	Orders     *OrderService
	Auth       *AuthService
	Artist     *ArtistService
	Storage    *StorageService
	Analytics  *AnalyticsService
}

type Deps struct {
	Repos  *repository.Repositories
	Config *config.Config
}

func NewServices(d Deps) *Services {
	storage := NewStorageService(d.Config.S3)

	telegramNotifier := notify.NewTelegramNotifier(notify.TelegramNotifierConfig{
		Enabled: d.Config.Telegram.NotificationsEnabled,
		Token:   d.Config.Telegram.BotToken,
		ChatID:  d.Config.Telegram.ChatID,
		SiteURL: d.Config.App.PublicSiteURL,
	})

	return &Services{
		Artworks:   NewArtworkService(d.Repos.Artworks, d.Repos.Categories, d.Repos.Orders, storage),
		Categories: NewCategoryService(d.Repos.Categories),
		Orders:     NewOrderService(d.Repos.Orders, d.Repos.Artworks, telegramNotifier),
		Auth:       NewAuthService(d.Repos.Admins, d.Config.JWT),
		Artist:     NewArtistService(d.Repos.Artist, storage),
		Storage:    storage,
		Analytics:  NewAnalyticsService(d.Repos.Analytics),
	}
}
