package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/notify"
)

type OrderService struct {
	orders     domain.OrderRepository
	artworks   domain.ArtworkRepository
	mailCfg    config.MailConfig
	notifier   *notify.TelegramNotifier
	httpClient *http.Client
}

func NewOrderService(orders domain.OrderRepository, artworks domain.ArtworkRepository, mailCfg config.MailConfig, notifier *notify.TelegramNotifier) *OrderService {
	return &OrderService{orders: orders, artworks: artworks, mailCfg: mailCfg, notifier: notifier, httpClient: &http.Client{Timeout: 10 * time.Second}}
}
func (s *OrderService) List(ctx context.Context, status *domain.OrderStatus) ([]domain.Order, error) {
	return s.orders.GetAll(ctx, status)
}
func (s *OrderService) GetByID(ctx context.Context, id int64) (*domain.Order, error) {
	return s.orders.GetByID(ctx, id)
}
func (s *OrderService) Create(ctx context.Context, o *domain.Order) (*domain.Order, error) {
	o.Name, o.Email, o.Phone, o.Message = strings.TrimSpace(o.Name), strings.TrimSpace(o.Email), strings.TrimSpace(o.Phone), strings.TrimSpace(o.Message)
	if o.Name == "" {
		return nil, fmt.Errorf("%w: name is required", domain.ErrValidation)
	}
	if _, err := mail.ParseAddress(o.Email); err != nil {
		return nil, fmt.Errorf("%w: valid email is required", domain.ErrValidation)
	}
	artwork, err := s.artworks.GetByID(ctx, o.ArtworkID)
	if err != nil {
		return nil, fmt.Errorf("%w: artwork", domain.ErrNotFound)
	}
	if artwork.Status != domain.ArtworkStatusAvailable {
		return nil, fmt.Errorf("%w: artwork is not available for purchase", domain.ErrConflict)
	}
	order, err := s.orders.Create(ctx, o)
	if err != nil {
		return nil, err
	}
	order.Artwork = artwork
	go func(order domain.Order) {
		notificationCtx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
		defer cancel()

		if err := s.sendOrderNotification(notificationCtx, &order); err != nil {
			slog.Error("failed to send order email notification", "order_id", order.ID, "error", err)
		}

		if err := s.sendTelegramOrderNotification(notificationCtx, &order); err != nil {
			slog.Error("failed to send order telegram notification", "order_id", order.ID, "error", err)
		}
	}(*order)
	return order, nil
}
func (s *OrderService) UpdateStatus(ctx context.Context, id int64, status domain.OrderStatus) error {
	if status != domain.OrderStatusNew && status != domain.OrderStatusContacted && status != domain.OrderStatusCompleted && status != domain.OrderStatusCancelled {
		return fmt.Errorf("%w: invalid order status", domain.ErrValidation)
	}
	return s.orders.UpdateStatus(ctx, id, status)
}
func (s *OrderService) sendOrderNotification(ctx context.Context, o *domain.Order) error {
	if s.mailCfg.ResendKey == "" || s.mailCfg.From == "" || s.mailCfg.To == "" {
		slog.Warn("mail configuration is incomplete, skipping order notification")
		return nil
	}
	price := "по запросу"
	if o.Artwork != nil && o.Artwork.Price != nil {
		price = fmt.Sprintf("%d ₽", *o.Artwork.Price)
	}
	title := "работа"
	if o.Artwork != nil {
		title = o.Artwork.Title
	}
	payload, err := json.Marshal(map[string]any{"from": s.mailCfg.From, "to": []string{s.mailCfg.To}, "subject": "Новый заказ: " + title, "text": fmt.Sprintf("Новый запрос на покупку работы.\n\nРабота: %s\nЦена: %s\n\nПокупатель: %s\nEmail: %s\nТелефон: %s\n\nСообщение:\n%s\n", title, price, o.Name, o.Email, o.Phone, o.Message)})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.mailCfg.ResendKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: %s", resp.Status)
	}
	return nil
}

func (s *OrderService) sendTelegramOrderNotification(ctx context.Context, o *domain.Order) error {
	if s.notifier == nil {
		return nil
	}

	artworkName := ""
	if o.Artwork != nil {
		artworkName = o.Artwork.Title
	}

	return s.notifier.SendNewOrder(ctx, notify.OrderNotification{
		ID:          o.ID,
		ArtworkID:   o.ArtworkID,
		ArtworkName: artworkName,
		Name:        o.Name,
		Email:       o.Email,
		Phone:       o.Phone,
		Message:     o.Message,
		CreatedAt:   o.CreatedAt,
	})
}
