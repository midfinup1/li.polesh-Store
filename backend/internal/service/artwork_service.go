package service

import (
	"context"
	"fmt"
	"log/slog"
	"mime/multipart"
	"strings"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type ArtworkService struct {
	artworks   domain.ArtworkRepository
	categories domain.CategoryRepository
	storage    *StorageService
}

func NewArtworkService(
	artworks domain.ArtworkRepository,
	categories domain.CategoryRepository,
	storage *StorageService,
) *ArtworkService {
	return &ArtworkService{artworks: artworks, categories: categories, storage: storage}
}

func (s *ArtworkService) List(ctx context.Context, f domain.ArtworkFilter) ([]domain.Artwork, error) {
	return s.artworks.GetAll(ctx, f)
}

func (s *ArtworkService) GetByID(ctx context.Context, id int64) (*domain.Artwork, error) {
	return s.artworks.GetByID(ctx, id)
}

func (s *ArtworkService) GetPublicByID(ctx context.Context, id int64) (*domain.Artwork, error) {
	a, err := s.artworks.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if a.Status == domain.ArtworkStatusHidden {
		return nil, fmt.Errorf("%w: artwork", domain.ErrNotFound)
	}
	return a, nil
}

func validArtworkStatus(status domain.ArtworkStatus) bool {
	return status == domain.ArtworkStatusAvailable || status == domain.ArtworkStatusSold || status == domain.ArtworkStatusHidden
}

func (s *ArtworkService) Create(ctx context.Context, a *domain.Artwork) (*domain.Artwork, error) {
	a.Title = strings.TrimSpace(a.Title)
	if a.Title == "" {
		return nil, fmt.Errorf("%w: title is required", domain.ErrValidation)
	}
	if a.Status == "" {
		a.Status = domain.ArtworkStatusAvailable
	}
	if !validArtworkStatus(a.Status) {
		return nil, fmt.Errorf("%w: invalid artwork status", domain.ErrValidation)
	}
	if a.Price != nil && *a.Price < 0 {
		return nil, fmt.Errorf("%w: price cannot be negative", domain.ErrValidation)
	}
	return s.artworks.Create(ctx, a)
}

func (s *ArtworkService) Update(ctx context.Context, a *domain.Artwork) (*domain.Artwork, error) {
	a.Title = strings.TrimSpace(a.Title)
	if a.Title == "" {
		return nil, fmt.Errorf("%w: title is required", domain.ErrValidation)
	}
	if !validArtworkStatus(a.Status) {
		return nil, fmt.Errorf("%w: invalid artwork status", domain.ErrValidation)
	}
	if a.Price != nil && *a.Price < 0 {
		return nil, fmt.Errorf("%w: price cannot be negative", domain.ErrValidation)
	}
	return s.artworks.Update(ctx, a)
}

// Delete removes an artwork. The DB row is deleted FIRST; storage objects are
// purged only AFTER a successful delete. This guarantees that if the delete is
// rejected (e.g. orders reference the artwork via ON DELETE RESTRICT — surfaced
// as domain.ErrConflict), no image files are orphaned in storage.
func (s *ArtworkService) Delete(ctx context.Context, id int64) error {
	images, err := s.artworks.GetImagesByArtworkID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.artworks.Delete(ctx, id); err != nil {
		return err
	}

	// Best-effort storage cleanup. The authoritative state (the DB) is already
	// consistent; a failed object delete is logged but must not fail the request.
	for _, image := range images {
		if err := s.storage.Delete(ctx, image.OriginalURL); err != nil {
			slog.Error("failed to delete artwork image object", "url", image.OriginalURL, "error", err)
		}
		if image.ThumbURL != image.OriginalURL {
			if err := s.storage.Delete(ctx, image.ThumbURL); err != nil {
				slog.Error("failed to delete artwork thumbnail object", "url", image.ThumbURL, "error", err)
			}
		}
	}
	return nil
}

func (s *ArtworkService) UploadImage(ctx context.Context, artworkID int64, file multipart.File, header *multipart.FileHeader) (*domain.ArtworkImage, error) {
	originalURL, thumbURL, err := s.storage.UploadArtworkImage(ctx, artworkID, file, header)
	if err != nil {
		return nil, err
	}

	img := &domain.ArtworkImage{
		ArtworkID:   artworkID,
		OriginalURL: originalURL,
		ThumbURL:    thumbURL,
		AltText:     "", // descriptive alt text is set later via the admin, not the filename
	}
	return s.artworks.AddImage(ctx, img)
}

func (s *ArtworkService) DeleteImage(ctx context.Context, imageID int64) error {
	image, err := s.artworks.GetImageByID(ctx, imageID)
	if err != nil {
		return err
	}
	if err := s.artworks.DeleteImage(ctx, imageID); err != nil {
		return err
	}
	if err := s.storage.Delete(ctx, image.OriginalURL); err != nil {
		slog.Error("failed to delete artwork image object", "url", image.OriginalURL, "error", err)
	}
	if image.ThumbURL != image.OriginalURL {
		if err := s.storage.Delete(ctx, image.ThumbURL); err != nil {
			slog.Error("failed to delete artwork thumbnail object", "url", image.ThumbURL, "error", err)
		}
	}
	return nil
}

func (s *ArtworkService) ReorderImages(ctx context.Context, artworkID int64, imageIDs []int64) error {
	if len(imageIDs) == 0 {
		return fmt.Errorf("%w: image_ids must not be empty", domain.ErrValidation)
	}
	return s.artworks.ReorderImages(ctx, artworkID, imageIDs)
}

// ─── Category Service ─────────────────────────────────────────────────────────

type CategoryService struct {
	repo domain.CategoryRepository
}

func NewCategoryService(repo domain.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List(ctx context.Context) ([]domain.Category, error) {
	return s.repo.GetAll(ctx)
}

func (s *CategoryService) Create(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	c.Name, c.Slug = strings.TrimSpace(c.Name), strings.TrimSpace(c.Slug)
	if c.Name == "" || c.Slug == "" {
		return nil, fmt.Errorf("%w: name and slug are required", domain.ErrValidation)
	}
	return s.repo.Create(ctx, c)
}

func (s *CategoryService) Update(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	c.Name, c.Slug = strings.TrimSpace(c.Name), strings.TrimSpace(c.Slug)
	if c.Name == "" || c.Slug == "" {
		return nil, fmt.Errorf("%w: name and slug are required", domain.ErrValidation)
	}
	return s.repo.Update(ctx, c)
}

func (s *CategoryService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

// ─── Artist Service ───────────────────────────────────────────────────────────

type ArtistService struct {
	repo    domain.ArtistRepository
	storage *StorageService
}

func NewArtistService(repo domain.ArtistRepository, storage *StorageService) *ArtistService {
	return &ArtistService{repo: repo, storage: storage}
}

func (s *ArtistService) Get(ctx context.Context) (*domain.Artist, error) {
	return s.repo.Get(ctx)
}

func (s *ArtistService) Update(ctx context.Context, a *domain.Artist) (*domain.Artist, error) {
	a.Name = strings.TrimSpace(a.Name)
	if a.Name == "" {
		return nil, fmt.Errorf("%w: artist name is required", domain.ErrValidation)
	}
	return s.repo.Update(ctx, a)
}
