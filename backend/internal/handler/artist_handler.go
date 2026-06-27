package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

// ─── Artist ───────────────────────────────────────────────────────────────────

type ArtistHandler struct {
	svc   *service.ArtistService
	audit *service.AuditService
}

func NewArtistHandler(svc *service.ArtistService, audit *service.AuditService) *ArtistHandler {
	return &ArtistHandler{svc: svc, audit: audit}
}

func (h *ArtistHandler) Get(w http.ResponseWriter, r *http.Request) {
	artist, err := h.svc.Get(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch artist")
		return
	}
	respondOK(w, artist)
}

func (h *ArtistHandler) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	oldArtist, _ := h.svc.Get(r.Context())
	slot := chi.URLParam(r, "slot")
	if slot != "home" && slot != "about" {
		respondError(w, http.StatusBadRequest, "invalid photo slot")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBodyBytes)
	if err := r.ParseMultipartForm(maxUploadBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "image is too large")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, http.StatusBadRequest, "image file required")
		return
	}
	defer file.Close()

	updated, err := h.svc.UploadPhoto(r.Context(), slot, file, header)
	if err != nil {
		respondServiceError(w, err, "failed to upload artist photo")
		return
	}
	metadata := map[string]any{
		"slot":     slot,
		"filename": header.Filename,
		"new": map[string]any{
			"photo_url":       updated.PhotoURL,
			"home_photo_url":  updated.HomePhotoURL,
			"about_photo_url": updated.AboutPhotoURL,
		},
	}
	if oldArtist != nil {
		metadata["old"] = map[string]any{
			"photo_url":       oldArtist.PhotoURL,
			"home_photo_url":  oldArtist.HomePhotoURL,
			"about_photo_url": oldArtist.AboutPhotoURL,
		}
	}
	recordAdminAudit(r, h.audit, "artist.photo_upload", "artist", &updated.ID, metadata)

	respondOK(w, updated)
}

func (h *ArtistHandler) Update(w http.ResponseWriter, r *http.Request) {
	oldArtist, _ := h.svc.Get(r.Context())
	var a domain.Artist
	if err := decodeJSONBody(w, r, &a, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	updated, err := h.svc.Update(r.Context(), &a)
	if err != nil {
		respondServiceError(w, err, "failed to update artist")
		return
	}
	metadata := map[string]any{
		"new": map[string]any{
			"name":            updated.Name,
			"name_en":         updated.NameEN,
			"bio":             updated.Bio,
			"bio_en":          updated.BioEN,
			"photo_url":       updated.PhotoURL,
			"home_photo_url":  updated.HomePhotoURL,
			"about_photo_url": updated.AboutPhotoURL,
			"email":           updated.Email,
			"instagram":       updated.Instagram,
		},
	}
	if oldArtist != nil {
		metadata["old"] = map[string]any{
			"name":            oldArtist.Name,
			"name_en":         oldArtist.NameEN,
			"bio":             oldArtist.Bio,
			"bio_en":          oldArtist.BioEN,
			"photo_url":       oldArtist.PhotoURL,
			"home_photo_url":  oldArtist.HomePhotoURL,
			"about_photo_url": oldArtist.AboutPhotoURL,
			"email":           oldArtist.Email,
			"instagram":       oldArtist.Instagram,
		}
	}
	recordAdminAudit(r, h.audit, "artist.update", "artist", &updated.ID, metadata)
	respondOK(w, updated)
}
