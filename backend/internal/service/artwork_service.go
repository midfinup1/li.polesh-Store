package service

import (
	"context"
	"fmt"
	"log/slog"
	"mime/multipart"
	"net/mail"
	"regexp"
	"strings"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type ArtworkService struct {
	artworks    domain.ArtworkRepository
	categories  domain.CategoryRepository
	exhibitions domain.ExhibitionRepository
	orders      domain.OrderRepository
	storage     *StorageService
}

func NewArtworkService(
	artworks domain.ArtworkRepository,
	categories domain.CategoryRepository,
	exhibitions domain.ExhibitionRepository,
	orders domain.OrderRepository,
	storage *StorageService,
) *ArtworkService {
	return &ArtworkService{
		artworks:    artworks,
		categories:  categories,
		exhibitions: exhibitions,
		orders:      orders,
		storage:     storage,
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
		status == domain.ArtworkStatusReserved ||
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
	if err := s.validateArtworkReferences(ctx, a); err != nil {
		return nil, err
	}
	if err := validateArtworkFields(a); err != nil {
		return nil, err
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
	if err := s.validateArtworkReferences(ctx, a); err != nil {
		return nil, err
	}
	if err := validateArtworkFields(a); err != nil {
		return nil, err
	}

	updated, err := s.artworks.Update(ctx, a)
	if err != nil {
		return nil, err
	}
	slog.Info("artwork updated", "artwork_id", updated.ID, "title", updated.Title, "status", updated.Status)
	return updated, nil
}

func (s *ArtworkService) validateArtworkReferences(ctx context.Context, artwork *domain.Artwork) error {
	if artwork.CategoryID == nil || *artwork.CategoryID <= 0 {
		return fmt.Errorf("%w: category_id is required", domain.ErrValidation)
	}
	if _, err := s.categories.GetByID(ctx, *artwork.CategoryID); err != nil {
		return err
	}
	if artwork.ExhibitionID != nil {
		if *artwork.ExhibitionID <= 0 {
			return fmt.Errorf("%w: series_id is invalid", domain.ErrValidation)
		}
		if _, err := s.exhibitions.GetByID(ctx, *artwork.ExhibitionID); err != nil {
			return err
		}
	}
	return nil
}

func validateArtworkFields(artwork *domain.Artwork) error {
	if artwork.Year != nil && (*artwork.Year < 1000 || *artwork.Year > 9999) {
		return fmt.Errorf("%w: year must contain four digits", domain.ErrValidation)
	}
	fields := []struct {
		name  string
		value string
		limit int
	}{
		{name: "title", value: artwork.Title, limit: 300},
		{name: "title_en", value: artwork.TitleEN, limit: 300},
		{name: "description", value: artwork.Description, limit: 20_000},
		{name: "description_en", value: artwork.DescriptionEN, limit: 20_000},
		{name: "purchase_comment", value: artwork.PurchaseComment, limit: 4_000},
		{name: "purchase_comment_en", value: artwork.PurchaseCommentEN, limit: 4_000},
		{name: "size", value: artwork.Size, limit: 500},
		{name: "size_en", value: artwork.SizeEN, limit: 500},
		{name: "materials", value: artwork.Materials, limit: 1_000},
		{name: "materials_en", value: artwork.MaterialsEN, limit: 1_000},
	}
	for _, field := range fields {
		if len([]rune(field.value)) > field.limit {
			return fmt.Errorf("%w: %s is too long", domain.ErrValidation, field.name)
		}
	}
	return nil
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
			image.DisplayURL,
			image.DisplayWebPURL,
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
	if len([]rune(altText)) > 500 {
		return nil, fmt.Errorf("%w: alt_text is too long", domain.ErrValidation)
	}

	img := &domain.ArtworkImage{
		ArtworkID:      artworkID,
		OriginalURL:    uploaded.OriginalURL,
		ThumbURL:       uploaded.ThumbURL,
		ThumbWebPURL:   uploaded.ThumbWebPURL,
		ThumbAVIFURL:   uploaded.ThumbAVIFURL,
		DisplayURL:     uploaded.DisplayURL,
		DisplayWebPURL: uploaded.DisplayWebPURL,
		AltText:        altText,
	}

	created, err := s.artworks.AddImage(ctx, img)
	if err != nil {
		s.cleanupUploadedArtworkImage(ctx, uploaded)
		return nil, err
	}
	slog.Info("artwork image uploaded", "artwork_id", artworkID, "image_id", created.ID)
	return created, nil
}

func (s *ArtworkService) cleanupUploadedArtworkImage(ctx context.Context, uploaded *UploadedArtworkImage) {
	if uploaded == nil {
		return
	}

	seen := make(map[string]struct{})
	for _, objectURL := range []string{
		uploaded.OriginalURL,
		uploaded.ThumbURL,
		uploaded.ThumbWebPURL,
		uploaded.ThumbAVIFURL,
		uploaded.DisplayURL,
		uploaded.DisplayWebPURL,
	} {
		if objectURL == "" {
			continue
		}
		if _, exists := seen[objectURL]; exists {
			continue
		}
		seen[objectURL] = struct{}{}
		if err := s.storage.Delete(ctx, objectURL); err != nil {
			slog.Error("failed to clean up uncommitted artwork image", "url", objectURL, "error", err)
		}
	}
}

func (s *ArtworkService) DeleteImage(ctx context.Context, artworkID int64, imageID int64) error {
	image, err := s.artworks.GetImageByID(ctx, imageID)
	if err != nil {
		return err
	}
	if image.ArtworkID != artworkID {
		return fmt.Errorf("%w: artwork image", domain.ErrNotFound)
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
		image.DisplayURL,
		image.DisplayWebPURL,
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
	if len([]rune(altText)) > 500 {
		return nil, fmt.Errorf("%w: alt_text is too long", domain.ErrValidation)
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
	existing, err := s.artworks.GetAll(ctx, domain.ArtworkFilter{CategoryID: &categoryID})
	if err != nil {
		return err
	}
	existingIDs := make([]int64, 0, len(existing))
	for _, artwork := range existing {
		existingIDs = append(existingIDs, artwork.ID)
	}
	if err := validateExactOrderIDs(artworkIDs, existingIDs, "artwork_ids"); err != nil {
		return err
	}

	return s.artworks.ReorderArtworks(ctx, categoryID, artworkIDs)
}

func (s *ArtworkService) ReorderImages(
	ctx context.Context,
	artworkID int64,
	imageIDs []int64,
) error {
	if artworkID <= 0 || len(imageIDs) == 0 {
		return fmt.Errorf("%w: image_ids must not be empty", domain.ErrValidation)
	}
	existing, err := s.artworks.GetImagesByArtworkID(ctx, artworkID)
	if err != nil {
		return err
	}
	existingIDs := make([]int64, 0, len(existing))
	for _, image := range existing {
		existingIDs = append(existingIDs, image.ID)
	}
	if err := validateExactOrderIDs(imageIDs, existingIDs, "image_ids"); err != nil {
		return err
	}

	return s.artworks.ReorderImages(ctx, artworkID, imageIDs)
}

func validateExactOrderIDs(requested []int64, existing []int64, field string) error {
	if len(requested) != len(existing) {
		return fmt.Errorf("%w: %s must contain every item exactly once", domain.ErrValidation, field)
	}

	expected := make(map[int64]struct{}, len(existing))
	for _, id := range existing {
		expected[id] = struct{}{}
	}
	seen := make(map[int64]struct{}, len(requested))
	for _, id := range requested {
		if _, duplicate := seen[id]; duplicate {
			return fmt.Errorf("%w: %s contains duplicate ids", domain.ErrValidation, field)
		}
		if _, exists := expected[id]; !exists {
			return fmt.Errorf("%w: %s contains an unknown id", domain.ErrValidation, field)
		}
		seen[id] = struct{}{}
	}
	return nil
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

	if err := validateNamedCollection(c.Name, c.NameEN, c.Slug); err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, c)
}

func (s *CategoryService) Update(ctx context.Context, c *domain.Category) (*domain.Category, error) {
	c.Name = strings.TrimSpace(c.Name)
	c.NameEN = strings.TrimSpace(c.NameEN)
	c.Slug = strings.TrimSpace(c.Slug)

	if err := validateNamedCollection(c.Name, c.NameEN, c.Slug); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, c)
}

func (s *CategoryService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *CategoryService) Reorder(ctx context.Context, ids []int64) error {
	existing, err := s.repo.GetAll(ctx)
	if err != nil {
		return err
	}
	existingIDs := make([]int64, 0, len(existing))
	for _, category := range existing {
		existingIDs = append(existingIDs, category.ID)
	}
	if err := validateExactOrderIDs(ids, existingIDs, "category_ids"); err != nil {
		return err
	}
	return s.repo.Reorder(ctx, ids)
}

// ─── Exhibition Service ──────────────────────────────────────────────────────

type ExhibitionService struct {
	repo domain.ExhibitionRepository
}

func NewExhibitionService(repo domain.ExhibitionRepository) *ExhibitionService {
	return &ExhibitionService{repo: repo}
}

func (s *ExhibitionService) List(ctx context.Context) ([]domain.Exhibition, error) {
	return s.repo.GetAll(ctx)
}

func (s *ExhibitionService) GetByID(ctx context.Context, id int64) (*domain.Exhibition, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ExhibitionService) Create(ctx context.Context, e *domain.Exhibition) (*domain.Exhibition, error) {
	e.Name = strings.TrimSpace(e.Name)
	e.NameEN = strings.TrimSpace(e.NameEN)
	e.Slug = strings.TrimSpace(e.Slug)

	if err := validateNamedCollection(e.Name, e.NameEN, e.Slug); err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, e)
}

func (s *ExhibitionService) Update(ctx context.Context, e *domain.Exhibition) (*domain.Exhibition, error) {
	e.Name = strings.TrimSpace(e.Name)
	e.NameEN = strings.TrimSpace(e.NameEN)
	e.Slug = strings.TrimSpace(e.Slug)

	if err := validateNamedCollection(e.Name, e.NameEN, e.Slug); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, e)
}

func (s *ExhibitionService) Delete(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *ExhibitionService) Reorder(ctx context.Context, ids []int64) error {
	existing, err := s.repo.GetAll(ctx)
	if err != nil {
		return err
	}
	existingIDs := make([]int64, 0, len(existing))
	for _, series := range existing {
		existingIDs = append(existingIDs, series.ID)
	}
	if err := validateExactOrderIDs(ids, existingIDs, "series_ids"); err != nil {
		return err
	}
	return s.repo.Reorder(ctx, ids)
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func validateNamedCollection(name string, nameEN string, slug string) error {
	if name == "" || slug == "" {
		return fmt.Errorf("%w: name and slug are required", domain.ErrValidation)
	}
	if len([]rune(name)) > 300 || len([]rune(nameEN)) > 300 {
		return fmt.Errorf("%w: name is too long", domain.ErrValidation)
	}
	if len(slug) > 200 || !slugPattern.MatchString(slug) {
		return fmt.Errorf("%w: slug is invalid", domain.ErrValidation)
	}
	return nil
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
	if len([]rune(a.Name)) > 300 || len([]rune(a.NameEN)) > 300 {
		return nil, fmt.Errorf("%w: artist name is too long", domain.ErrValidation)
	}
	if len([]rune(a.Bio)) > 50_000 || len([]rune(a.BioEN)) > 50_000 {
		return nil, fmt.Errorf("%w: artist bio is too long", domain.ErrValidation)
	}
	if len(a.PhotoURL) > 2_048 || len(a.HomePhotoURL) > 2_048 || len(a.AboutPhotoURL) > 2_048 || len(a.Instagram) > 2_048 {
		return nil, fmt.Errorf("%w: artist URL is too long", domain.ErrValidation)
	}
	if len(a.Email) > 320 {
		return nil, fmt.Errorf("%w: artist email is too long", domain.ErrValidation)
	}
	if a.Email != "" {
		address, err := mail.ParseAddress(a.Email)
		if err != nil || address.Address != a.Email {
			return nil, fmt.Errorf("%w: artist email is invalid", domain.ErrValidation)
		}
	}

	return s.repo.Update(ctx, a)
}

func (s *ArtistService) UploadPhoto(
	ctx context.Context,
	slot string,
	file multipart.File,
	header *multipart.FileHeader,
) (*domain.Artist, error) {
	if slot != "home" && slot != "about" {
		return nil, fmt.Errorf("%w: invalid artist photo slot", domain.ErrValidation)
	}

	artist, err := s.repo.Get(ctx)
	if err != nil {
		return nil, err
	}

	oldURL := artist.HomePhotoURL
	if slot == "about" {
		oldURL = artist.AboutPhotoURL
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
	}

	updated, err := s.Update(ctx, artist)
	if err != nil {
		if cleanupErr := s.storage.Delete(ctx, url); cleanupErr != nil {
			slog.Error("failed to clean up uncommitted artist photo", "url", url, "error", cleanupErr)
		}
		return nil, err
	}

	if oldURL != "" && oldURL != updated.PhotoURL && oldURL != updated.HomePhotoURL && oldURL != updated.AboutPhotoURL {
		if cleanupErr := s.storage.Delete(ctx, oldURL); cleanupErr != nil {
			slog.Error("failed to delete replaced artist photo", "url", oldURL, "error", cleanupErr)
		}
	}

	return updated, nil
}
