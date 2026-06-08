package domain

import (
	"context"
	"time"
)

// ArtworkRepository defines all DB operations for artworks.
// The actual implementation lives in repository/artwork_repository.go
type ArtworkRepository interface {
	GetAll(ctx context.Context, filter ArtworkFilter) ([]Artwork, error)
	GetByID(ctx context.Context, id int64) (*Artwork, error)
	Create(ctx context.Context, a *Artwork) (*Artwork, error)
	Update(ctx context.Context, a *Artwork) (*Artwork, error)
	Delete(ctx context.Context, id int64) error

	AddImage(ctx context.Context, img *ArtworkImage) (*ArtworkImage, error)
	GetImageByID(ctx context.Context, imageID int64) (*ArtworkImage, error)
	GetImagesByArtworkID(ctx context.Context, artworkID int64) ([]ArtworkImage, error)
	DeleteImage(ctx context.Context, imageID int64) error
	UpdateImageAltText(ctx context.Context, artworkID int64, imageID int64, altText string) (*ArtworkImage, error)
	ReorderImages(ctx context.Context, artworkID int64, imageIDs []int64) error
}

type ArtworkFilter struct {
	CategoryID    *int64
	Status        *ArtworkStatus // nil = all statuses (admin), non-nil = filter by status
	ExcludeHidden bool
	Limit         int
	Offset        int
}

// CategoryRepository defines DB operations for categories.
type CategoryRepository interface {
	GetAll(ctx context.Context) ([]Category, error)
	GetByID(ctx context.Context, id int64) (*Category, error)
	Create(ctx context.Context, c *Category) (*Category, error)
	Update(ctx context.Context, c *Category) (*Category, error)
	Delete(ctx context.Context, id int64) error
}

// OrderRepository defines DB operations for orders.
type OrderRepository interface {
	GetAll(ctx context.Context, status *OrderStatus) ([]Order, error)
	GetByID(ctx context.Context, id int64) (*Order, error)
	Create(ctx context.Context, o *Order) (*Order, error)
	UpdateStatus(ctx context.Context, id int64, status OrderStatus) error
	Delete(ctx context.Context, id int64) error
	CountActiveByArtworkID(ctx context.Context, artworkID int64) (int64, error)
	DeleteInactiveByArtworkID(ctx context.Context, artworkID int64) error
}

// AdminRepository defines DB operations for admin accounts.
type AdminRepository interface {
	GetByEmail(ctx context.Context, email string) (*Admin, error)
}

// ArtistRepository defines DB operations for the artist profile.
type ArtistRepository interface {
	Get(ctx context.Context) (*Artist, error)
	Update(ctx context.Context, a *Artist) (*Artist, error)
}

// AnalyticsRepository defines DB operations for simple internal page analytics.
type AnalyticsRepository interface {
	CreateEvent(ctx context.Context, event *AnalyticsEvent) error
	Summary(ctx context.Context) (*AnalyticsSummary, error)
	CleanupOldEvents(ctx context.Context, before time.Time) (int64, error)
}
