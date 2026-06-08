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
	svc *service.ArtworkService
}

func NewArtworkHandler(svc *service.ArtworkService) *ArtworkHandler {
	return &ArtworkHandler{svc: svc}
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

	// Public endpoint: show available and sold artworks, never hidden drafts.
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
	respondCreated(w, created)
}

func (h *ArtworkHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
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
	respondOK(w, updated)
}

func (h *ArtworkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete artwork")
		return
	}
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

	respondOK(w, image)
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
	w.WriteHeader(http.StatusNoContent)
}
