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
	orders     domain.OrderRepository
	storage    *StorageService
}

func NewArtworkService(
	artworks domain.ArtworkRepository,
	categories domain.CategoryRepository,
	orders domain.OrderRepository,
	storage *StorageService,
) *ArtworkService {
	return &ArtworkService{
		artworks:   artworks,
		categories: categories,
		orders:     orders,
		storage:    storage,
	}
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
	return status == domain.ArtworkStatusAvailable ||
		status == domain.ArtworkStatusSold ||
		status == domain.ArtworkStatusHidden
}

func (s *ArtworkService) Create(ctx context.Context, a *domain.Artwork) (*domain.Artwork, error) {
	a.Title = strings.TrimSpace(a.Title)
	a.TitleEN = strings.TrimSpace(a.TitleEN)
	a.Description = strings.TrimSpace(a.Description)
	a.DescriptionEN = strings.TrimSpace(a.DescriptionEN)
	a.PurchaseComment = strings.TrimSpace(a.PurchaseComment)
	a.PurchaseCommentEN = strings.TrimSpace(a.PurchaseCommentEN)
	a.Size = strings.TrimSpace(a.Size)
	a.SizeEN = strings.TrimSpace(a.SizeEN)
	a.Materials = strings.TrimSpace(a.Materials)
	a.MaterialsEN = strings.TrimSpace(a.MaterialsEN)

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

	created, err := s.artworks.Create(ctx, a)
	if err != nil {
		return nil, err
	}
	slog.Info("artwork created", "artwork_id", created.ID, "title", created.Title, "status", created.Status)
	return created, nil
}

func (s *ArtworkService) Update(ctx context.Context, a *domain.Artwork) (*domain.Artwork, error) {
	a.Title = strings.TrimSpace(a.Title)
	a.TitleEN = strings.TrimSpace(a.TitleEN)
	a.Description = strings.TrimSpace(a.Description)
	a.DescriptionEN = strings.TrimSpace(a.DescriptionEN)
	a.PurchaseComment = strings.TrimSpace(a.PurchaseComment)
	a.PurchaseCommentEN = strings.TrimSpace(a.PurchaseCommentEN)
	a.Size = strings.TrimSpace(a.Size)
	a.SizeEN = strings.TrimSpace(a.SizeEN)
	a.Materials = strings.TrimSpace(a.Materials)
	a.MaterialsEN = strings.TrimSpace(a.MaterialsEN)

	if a.Title == "" {
		return nil, fmt.Errorf("%w: title is required", domain.ErrValidation)
	}

	if !validArtworkStatus(a.Status) {
		return nil, fmt.Errorf("%w: invalid artwork status", domain.ErrValidation)
	}

	if a.Price != nil && *a.Price < 0 {
		return nil, fmt.Errorf("%w: price cannot be negative", domain.ErrValidation)
	}

	updated, err := s.artworks.Update(ctx, a)
	if err != nil {
		return nil, err
	}
	slog.Info("artwork updated", "artwork_id", updated.ID, "title", updated.Title, "status", updated.Status)
	return updated, nil
}

// Delete removes an artwork only when there are no active requests for it.
// Active requests (new/contacted) block deletion so the admin does not lose
// unprocessed leads. Inactive requests are removed together with the artwork,
// because they no longer require action and would otherwise be blocked by the
// orders.artwork_id ON DELETE RESTRICT constraint.
func (s *ArtworkService) Delete(ctx context.Context, id int64) error {
	images, err := s.artworks.GetImagesByArtworkID(ctx, id)
	if err != nil {
		return err
	}

	activeOrdersCount, err := s.orders.CountActiveByArtworkID(ctx, id)
	if err != nil {
		return err
	}

	if activeOrdersCount > 0 {
		return fmt.Errorf(
			"%w: нельзя удалить работу, потому что по ней есть активные заявки. Завершите или отмените заявки, затем повторите удаление",
			domain.ErrConflict,
		)
	}

	if err := s.artworks.DeleteWithInactiveOrders(ctx, id); err != nil {
		return err
	}
	slog.Info("artwork deleted", "artwork_id", id)

	// Best-effort storage cleanup. The authoritative state (the DB) is already
	// consistent; a failed object delete is logged but must not fail the request.
	for _, image := range images {
		if err := s.storage.Delete(ctx, image.OriginalURL); err != nil {
			slog.Error(
				"failed to delete artwork image object",
				"url",
				image.OriginalURL,
				"error",
				err,
			)
		}

		for _, url := range []string{
			image.ThumbURL,
			image.ThumbWebPURL,
			image.ThumbAVIFURL,
		} {
			if url == "" || url == image.OriginalURL {
				continue
			}

			if err := s.storage.Delete(ctx, url); err != nil {
				slog.Error(
					"failed to delete artwork thumbnail object",
					"url",
					url,
					"error",
					err,
				)
			}
		}
	}

	return nil
}

func (s *ArtworkService) UploadImage(
	ctx context.Context,
	artworkID int64,
	file multipart.File,
	header *multipart.FileHeader,
) (*domain.ArtworkImage, error) {
	artwork, err := s.artworks.GetByID(ctx, artworkID)
	if err != nil {
		return nil, err
	}

	uploaded, err := s.storage.UploadArtworkImage(ctx, artworkID, file, header)
	if err != nil {
		return nil, err
	}

	altText := strings.TrimSpace(artwork.Title)
	if altText == "" {
		altText = "Работа художницы"
	}

	img := &domain.ArtworkImage{
		ArtworkID:    artworkID,
		OriginalURL:  uploaded.OriginalURL,
		ThumbURL:     uploaded.ThumbURL,
		ThumbWebPURL: uploaded.ThumbWebPURL,
		ThumbAVIFURL: uploaded.ThumbAVIFURL,
		AltText:      altText,
	}

	created, err := s.artworks.AddImage(ctx, img)
	if err != nil {
		return nil, err
	}
	slog.Info("artwork image uploaded", "artwork_id", artworkID, "image_id", created.ID)
	return created, nil
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
		slog.Error(
			"failed to delete artwork image object",
			"url",
			image.OriginalURL,
			"error",
			err,
		)
	}

	for _, url := range []string{
		image.ThumbURL,
		image.ThumbWebPURL,
		image.ThumbAVIFURL,
	} {
		if url == "" || url == image.OriginalURL {
			continue
		}

		if err := s.storage.Delete(ctx, url); err != nil {
			slog.Error(
				"failed to delete artwork thumbnail object",
				"url",
				url,
				"error",
				err,
			)
		}
	}

	slog.Info("artwork image deleted", "image_id", imageID, "artwork_id", image.ArtworkID)
	return nil
}

func (s *ArtworkService) UpdateImageAltText(
	ctx context.Context,
	artworkID int64,
	imageID int64,
	altText string,
) (*domain.ArtworkImage, error) {
	altText = strings.TrimSpace(altText)

	if altText == "" {
		artwork, err := s.artworks.GetByID(ctx, artworkID)
		if err != nil {
			return nil, err
		}

		altText = strings.TrimSpace(artwork.Title)
		if altText == "" {
			altText = "Работа художницы"
		}
	}

	return s.artworks.UpdateImageAltText(ctx, artworkID, imageID, altText)
}

func (s *ArtworkService) ReorderArtworks(
	ctx context.Context,
	categoryID int64,
	artworkIDs []int64,
) error {
	if categoryID <= 0 {
		return fmt.Errorf("%w: category_id is required", domain.ErrValidation)
	}

	if len(artworkIDs) == 0 {
		return fmt.Errorf("%w: artwork_ids must not be empty", domain.ErrValidation)
	}

	if _, err := s.categories.GetByID(ctx, categoryID); err != nil {
		return err
	}

	return s.artworks.ReorderArtworks(ctx, categoryID, artworkIDs)
}

func (s *ArtworkService) ReorderImages(
	ctx context.Context,
	artworkID int64,
	imageIDs []int64,
) error {
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

func (s *CategoryService) GetByID(ctx context.Context, id int64) (*domain.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *CategoryService) Create(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	c.Name = strings.TrimSpace(c.Name)
	c.NameEN = strings.TrimSpace(c.NameEN)
	c.Slug = strings.TrimSpace(c.Slug)

	if c.Name == "" || c.Slug == "" {
		return nil, fmt.Errorf("%w: name and slug are required", domain.ErrValidation)
	}

	return s.repo.Create(ctx, c)
}

func (s *CategoryService) Update(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	c.Name = strings.TrimSpace(c.Name)
	c.NameEN = strings.TrimSpace(c.NameEN)
	c.Slug = strings.TrimSpace(c.Slug)

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
	a.NameEN = strings.TrimSpace(a.NameEN)
	a.Bio = strings.TrimSpace(a.Bio)
	a.BioEN = strings.TrimSpace(a.BioEN)
	a.PhotoURL = strings.TrimSpace(a.PhotoURL)
	a.HomePhotoURL = strings.TrimSpace(a.HomePhotoURL)
	a.AboutPhotoURL = strings.TrimSpace(a.AboutPhotoURL)
	a.Email = strings.TrimSpace(a.Email)
	a.Instagram = strings.TrimSpace(a.Instagram)

	if a.Name == "" {
		return nil, fmt.Errorf("%w: artist name is required", domain.ErrValidation)
	}

	return s.repo.Update(ctx, a)
}

func (s *ArtistService) UploadPhoto(
	ctx context.Context,
	slot string,
	file multipart.File,
	header *multipart.FileHeader,
) (*domain.Artist, error) {
	artist, err := s.repo.Get(ctx)
	if err != nil {
		return nil, err
	}

	url, err := s.storage.UploadArtistImage(ctx, slot, file, header)
	if err != nil {
		return nil, err
	}

	switch slot {
	case "home":
		artist.HomePhotoURL = url
	case "about":
		artist.AboutPhotoURL = url
	default:
		return nil, fmt.Errorf("%w: invalid artist photo slot", domain.ErrValidation)
	}

	return s.Update(ctx, artist)
}
