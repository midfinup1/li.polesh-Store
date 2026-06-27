package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

// ─── Order ────────────────────────────────────────────────────────────────────

type OrderHandler struct {
	svc   *service.OrderService
	audit *service.AuditService
}

func NewOrderHandler(svc *service.OrderService, audit *service.AuditService) *OrderHandler {
	return &OrderHandler{svc: svc, audit: audit}
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var o domain.Order
	if err := decodeJSONBody(w, r, &o, maxOrderJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	created, err := h.svc.Create(r.Context(), &o)
	if err != nil {
		respondServiceError(w, err, "failed to create order")
		return
	}
	respondCreated(w, created)
}

func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	orders, err := h.svc.List(r.Context(), nil)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch orders")
		return
	}
	respondOK(w, orders)
}

func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	order, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "order not found")
		return
	}
	respondOK(w, order)
}

func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Status domain.OrderStatus `json:"status"`
	}
	if err := decodeJSONBody(w, r, &body, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	oldOrder, _ := h.svc.GetByID(r.Context(), id)
	if err := h.svc.UpdateStatus(r.Context(), id, body.Status); err != nil {
		respondServiceError(w, err, "failed to update order status")
		return
	}
	metadata := map[string]any{
		"new_status": body.Status,
	}
	if oldOrder != nil {
		metadata["old_status"] = oldOrder.Status
		metadata["artwork_id"] = oldOrder.ArtworkID
	}
	recordAdminAudit(r, h.audit, "order.status_update", "order", &id, metadata)
	w.WriteHeader(http.StatusOK)
}

func (h *OrderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	oldOrder, _ := h.svc.GetByID(r.Context(), id)
	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete order")
		return
	}
	metadata := map[string]any{}
	if oldOrder != nil {
		metadata["old"] = map[string]any{
			"artwork_id": oldOrder.ArtworkID,
			"status":     oldOrder.Status,
			"created_at": oldOrder.CreatedAt,
		}
	}
	recordAdminAudit(r, h.audit, "order.delete", "order", &id, metadata)

	w.WriteHeader(http.StatusNoContent)
}
