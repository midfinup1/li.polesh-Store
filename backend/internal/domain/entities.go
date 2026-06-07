package domain

import "time"

// ─── Artwork ──────────────────────────────────────────────────────────────────

type ArtworkStatus string

const (
	ArtworkStatusAvailable ArtworkStatus = "available"
	ArtworkStatusSold      ArtworkStatus = "sold"
	ArtworkStatusHidden    ArtworkStatus = "hidden"
)

type Artwork struct {
	ID            int64         `db:"id"             json:"id"`
	Title         string        `db:"title"          json:"title"`
	TitleEN       string        `db:"title_en"       json:"title_en"`
	Description   string        `db:"description"    json:"description"`
	DescriptionEN string        `db:"description_en" json:"description_en"`
	Price         *int64        `db:"price"          json:"price"`
	Status        ArtworkStatus `db:"status"         json:"status"`
	CategoryID    *int64        `db:"category_id"    json:"category_id"`
	Year          *int          `db:"year"           json:"year"`
	Size          string        `db:"size"           json:"size"`
	SizeEN        string        `db:"size_en"        json:"size_en"`
	Materials     string        `db:"materials"      json:"materials"`
	MaterialsEN   string        `db:"materials_en"   json:"materials_en"`
	SortOrder     int           `db:"sort_order"     json:"sort_order"`
	CreatedAt     time.Time     `db:"created_at"     json:"created_at"`
	UpdatedAt     time.Time     `db:"updated_at"     json:"updated_at"`

	Images   []ArtworkImage `db:"-" json:"images"`
	Category *Category      `db:"-" json:"category,omitempty"`
}

type ArtworkImage struct {
	ID           int64     `db:"id"             json:"id"`
	ArtworkID    int64     `db:"artwork_id"     json:"artwork_id"`
	OriginalURL  string    `db:"original_url"   json:"original_url"`
	ThumbURL     string    `db:"thumb_url"      json:"thumb_url"`
	ThumbWebPURL string    `db:"thumb_webp_url" json:"thumb_webp_url"`
	ThumbAVIFURL string    `db:"thumb_avif_url" json:"thumb_avif_url"`
	AltText      string    `db:"alt_text"       json:"alt_text"`
	SortOrder    int       `db:"sort_order"     json:"sort_order"`
	CreatedAt    time.Time `db:"created_at"     json:"created_at"`
}

// ─── Category ─────────────────────────────────────────────────────────────────

type Category struct {
	ID        int64     `db:"id"         json:"id"`
	Name      string    `db:"name"       json:"name"`
	NameEN    string    `db:"name_en"    json:"name_en"`
	Slug      string    `db:"slug"       json:"slug"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// ─── Order ────────────────────────────────────────────────────────────────────

type OrderStatus string

const (
	OrderStatusNew       OrderStatus = "new"
	OrderStatusContacted OrderStatus = "contacted"
	OrderStatusCompleted OrderStatus = "completed"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID        int64       `db:"id"          json:"id"`
	ArtworkID int64       `db:"artwork_id"  json:"artwork_id"`
	Name      string      `db:"name"        json:"name"`
	Email     string      `db:"email"       json:"email"`
	Phone     string      `db:"phone"       json:"phone"`
	Message   string      `db:"message"     json:"message"`
	Status    OrderStatus `db:"status"      json:"status"`
	CreatedAt time.Time   `db:"created_at"  json:"created_at"`
	UpdatedAt time.Time   `db:"updated_at"  json:"updated_at"`

	Artwork *Artwork `db:"-" json:"artwork,omitempty"`
}

// ─── Admin ────────────────────────────────────────────────────────────────────

type Admin struct {
	ID           int64     `db:"id"            json:"id"`
	Email        string    `db:"email"         json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at"    json:"created_at"`
}

// ─── Artist ───────────────────────────────────────────────────────────────────

type Artist struct {
	ID        int64     `db:"id"         json:"id"`
	Name      string    `db:"name"       json:"name"`
	NameEN    string    `db:"name_en"    json:"name_en"`
	Bio       string    `db:"bio"        json:"bio"`
	BioEN     string    `db:"bio_en"     json:"bio_en"`
	PhotoURL  string    `db:"photo_url"  json:"photo_url"`
	Email     string    `db:"email"      json:"email"`
	Instagram string    `db:"instagram"  json:"instagram"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
