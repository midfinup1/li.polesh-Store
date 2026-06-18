package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type ArtworkHandler struct {
	svc   *service.ArtworkService
	audit *service.AuditService
}

func NewArtworkHandler(svc *service.ArtworkService, audit *service.AuditService) *ArtworkHandler {
	return &ArtworkHandler{svc: svc, audit: audit}
}

func (h *ArtworkHandler) ListAdmin(w http.ResponseWriter, r *http.Request) {
	artworks, err := h.svc.List(r.Context(), domain.ArtworkFilter{})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch artworks")
		return
	}
	respondOK(w, artworks)
}

func (h *ArtworkHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := domain.ArtworkFilter{}

	// Public endpoint: show available, reserved and sold artworks, never hidden drafts.
	filter.ExcludeHidden = true

	if catID := q.Get("category_id"); catID != "" {
		id, _ := strconv.ParseInt(catID, 10, 64)
		filter.CategoryID = &id
	}

	artworks, err := h.svc.List(r.Context(), filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch artworks")
		return
	}
	respondOK(w, artworks)
}

func (h *ArtworkHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	artwork, err := h.svc.GetPublicByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "artwork not found")
		return
	}
	respondOK(w, artwork)
}

func (h *ArtworkHandler) Create(w http.ResponseWriter, r *http.Request) {
	var a domain.Artwork
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	created, err := h.svc.Create(r.Context(), &a)
	if err != nil {
		respondServiceError(w, err, "failed to create artwork")
		return
	}
	recordAdminAudit(r, h.audit, "artwork.create", "artwork", &created.ID, map[string]any{
		"title":       created.Title,
		"status":      created.Status,
		"category_id": created.CategoryID,
	})
	respondCreated(w, created)
}

func (h *ArtworkHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	oldArtwork, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondServiceError(w, err, "artwork not found")
		return
	}

	var a domain.Artwork
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	a.ID = id

	updated, err := h.svc.Update(r.Context(), &a)
	if err != nil {
		respondServiceError(w, err, "failed to update artwork")
		return
	}
	recordAdminAudit(r, h.audit, "artwork.update", "artwork", &updated.ID, map[string]any{
		"old": map[string]any{
			"title":               oldArtwork.Title,
			"title_en":            oldArtwork.TitleEN,
			"description":         oldArtwork.Description,
			"description_en":      oldArtwork.DescriptionEN,
			"purchase_comment":    oldArtwork.PurchaseComment,
			"purchase_comment_en": oldArtwork.PurchaseCommentEN,
			"price":               oldArtwork.Price,
			"status":              oldArtwork.Status,
			"category_id":         oldArtwork.CategoryID,
			"year":                oldArtwork.Year,
			"size":                oldArtwork.Size,
			"size_en":             oldArtwork.SizeEN,
			"materials":           oldArtwork.Materials,
			"materials_en":        oldArtwork.MaterialsEN,
			"sort_order":          oldArtwork.SortOrder,
		},
		"new": map[string]any{
			"title":               updated.Title,
			"title_en":            updated.TitleEN,
			"description":         updated.Description,
			"description_en":      updated.DescriptionEN,
			"purchase_comment":    updated.PurchaseComment,
			"purchase_comment_en": updated.PurchaseCommentEN,
			"price":               updated.Price,
			"status":              updated.Status,
			"category_id":         updated.CategoryID,
			"year":                updated.Year,
			"size":                updated.Size,
			"size_en":             updated.SizeEN,
			"materials":           updated.Materials,
			"materials_en":        updated.MaterialsEN,
			"sort_order":          updated.SortOrder,
		},
	})
	respondOK(w, updated)
}

func (h *ArtworkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	oldArtwork, _ := h.svc.GetByID(r.Context(), id)

	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete artwork")
		return
	}
	metadata := map[string]any{}
	if oldArtwork != nil {
		metadata["old"] = oldArtwork
	}
	recordAdminAudit(r, h.audit, "artwork.delete", "artwork", &id, metadata)
	w.WriteHeader(http.StatusNoContent)
}

func (h *ArtworkHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "image is too large")
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, http.StatusBadRequest, "image file required")
		return
	}
	defer file.Close()

	img, err := h.svc.UploadImage(r.Context(), id, file, header)
	if err != nil {
		respondServiceError(w, err, "failed to upload image")
		return
	}
	recordAdminAudit(r, h.audit, "image.upload", "artwork_image", &img.ID, map[string]any{
		"artwork_id": id,
		"filename":   header.Filename,
	})
	respondCreated(w, img)
}

func (h *ArtworkHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	imageID, err := strconv.ParseInt(chi.URLParam(r, "imageId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid imageId")
		return
	}

	if err := h.svc.DeleteImage(r.Context(), imageID); err != nil {
		respondServiceError(w, err, "failed to delete image")
		return
	}
	recordAdminAudit(r, h.audit, "image.delete", "artwork_image", &imageID, nil)
	w.WriteHeader(http.StatusNoContent)
}

func (h *ArtworkHandler) UpdateImageAltText(w http.ResponseWriter, r *http.Request) {
	artworkID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	imageID, err := strconv.ParseInt(chi.URLParam(r, "imageId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid imageId")
		return
	}

	var body struct {
		AltText string `json:"alt_text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	image, err := h.svc.UpdateImageAltText(r.Context(), artworkID, imageID, body.AltText)
	if err != nil {
		respondServiceError(w, err, "failed to update image alt text")
		return
	}
	recordAdminAudit(r, h.audit, "image.alt_update", "artwork_image", &imageID, map[string]any{
		"artwork_id": artworkID,
	})

	respondOK(w, image)
}

func (h *ArtworkHandler) ReorderArtworks(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CategoryID int64   `json:"category_id"`
		ArtworkIDs []int64 `json:"artwork_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	if body.CategoryID <= 0 || len(body.ArtworkIDs) == 0 {
		respondError(w, http.StatusBadRequest, "category_id and artwork_ids are required")
		return
	}

	oldArtworks, err := h.svc.List(r.Context(), domain.ArtworkFilter{CategoryID: &body.CategoryID})
	if err != nil {
		respondServiceError(w, err, "failed to fetch current artwork order")
		return
	}

	oldOrder := make([]int64, 0, len(oldArtworks))
	for _, artwork := range oldArtworks {
		oldOrder = append(oldOrder, artwork.ID)
	}

	if err := h.svc.ReorderArtworks(r.Context(), body.CategoryID, body.ArtworkIDs); err != nil {
		respondServiceError(w, err, "failed to reorder artworks")
		return
	}

	recordAdminAudit(r, h.audit, "artwork.reorder", "category", &body.CategoryID, map[string]any{
		"category_id": body.CategoryID,
		"old_order":   oldOrder,
		"new_order":   body.ArtworkIDs,
	})

	w.WriteHeader(http.StatusNoContent)
}

func (h *ArtworkHandler) ReorderImages(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var body struct {
		ImageIDs []int64 `json:"image_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	if err := h.svc.ReorderImages(r.Context(), id, body.ImageIDs); err != nil {
		respondServiceError(w, err, "failed to reorder images")
		return
	}
	recordAdminAudit(r, h.audit, "image.reorder", "artwork", &id, map[string]any{
		"image_ids": body.ImageIDs,
	})
	w.WriteHeader(http.StatusNoContent)
}
