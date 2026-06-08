package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"strings"
	"time"
)

type TelegramNotifier struct {
	enabled bool
	token   string
	chatID  string
	siteURL string
	client  *http.Client
}

type TelegramNotifierConfig struct {
	Enabled bool
	Token   string
	ChatID  string
	SiteURL string
}

type OrderNotification struct {
	ID          int64
	ArtworkID   int64
	ArtworkName string
	Name        string
	Email       string
	Phone       string
	Message     string
	CreatedAt   time.Time
}

func NewTelegramNotifier(config TelegramNotifierConfig) *TelegramNotifier {
	return &TelegramNotifier{
		enabled: config.Enabled,
		token:   strings.TrimSpace(config.Token),
		chatID:  strings.TrimSpace(config.ChatID),
		siteURL: strings.TrimRight(strings.TrimSpace(config.SiteURL), "/"),
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (n *TelegramNotifier) SendNewOrder(ctx context.Context, order OrderNotification) error {
	if n == nil || !n.enabled {
		return nil
	}

	if n.token == "" || n.chatID == "" {
		return nil
	}

	payload := map[string]any{
		"chat_id":                  n.chatID,
		"text":                     n.buildNewOrderMessage(order),
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal telegram payload: %w", err)
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", n.token)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create telegram request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := n.client.Do(req)
	if err != nil {
		return fmt.Errorf("send telegram request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("telegram returned status %d", res.StatusCode)
	}

	return nil
}

func (n *TelegramNotifier) buildNewOrderMessage(order OrderNotification) string {
	var b strings.Builder

	b.WriteString("<b>Новая заявка на сайте</b>\n\n")

	if order.ID > 0 {
		b.WriteString(fmt.Sprintf("<b>Заявка:</b> #%d\n", order.ID))
	}

	if order.Name != "" {
		b.WriteString(fmt.Sprintf("<b>Имя:</b> %s\n", escape(order.Name)))
	}

	if order.Phone != "" {
		b.WriteString(fmt.Sprintf("<b>Контакт:</b> %s\n", escape(order.Phone)))
	}

	if order.Email != "" && order.Email != "no-email@lipolesh.art" {
		b.WriteString(fmt.Sprintf("<b>Email:</b> %s\n", escape(order.Email)))
	}

	if order.ArtworkName != "" {
		b.WriteString(fmt.Sprintf("<b>Работа:</b> %s\n", escape(order.ArtworkName)))
	}

	if order.ArtworkID > 0 && n.siteURL != "" {
		b.WriteString(fmt.Sprintf("<b>Ссылка:</b> %s/artwork/%d\n", escape(n.siteURL), order.ArtworkID))
	}

	if order.Message != "" {
		b.WriteString("\n<b>Комментарий:</b>\n")
		b.WriteString(escape(order.Message))
		b.WriteString("\n")
	}

	if !order.CreatedAt.IsZero() {
		b.WriteString("\n")
		b.WriteString(fmt.Sprintf("<b>Создана:</b> %s", escape(order.CreatedAt.Format("02.01.2006 15:04"))))
	}

	return b.String()
}

func escape(value string) string {
	return html.EscapeString(strings.TrimSpace(value))
}
