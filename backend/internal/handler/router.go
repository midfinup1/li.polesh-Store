package handler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/middleware"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type Deps struct {
	Services *service.Services
	Config   *config.Config
	Logger   *slog.Logger
}

func NewRouter(d Deps) http.Handler {
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID, chimiddleware.RealIP, chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestLogger(&chimiddleware.DefaultLogFormatter{Logger: slog.NewLogLogger(d.Logger.Handler(), slog.LevelInfo), NoColor: true}))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: d.Config.App.CORSAllowedOrigins, AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}, AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"}, AllowCredentials: true, MaxAge: 300}))

	if d.Config.App.Env != "production" {
		uploads := http.StripPrefix("/uploads/", http.FileServer(http.Dir(d.Config.App.UploadDir)))
		r.Handle("/uploads/*", uploads)
	}

	artworks := NewArtworkHandler(d.Services.Artworks)
	categories := NewCategoryHandler(d.Services.Categories)
	orders := NewOrderHandler(d.Services.Orders)
	auth := NewAuthHandler(d.Services.Auth, d.Config.App.Env == "production")
	artist := NewArtistHandler(d.Services.Artist)
	required := middleware.NewAuth(d.Services.Auth)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, _ *http.Request) { respondOK(w, map[string]string{"status": "ok"}) })
		r.Get("/artworks", artworks.List)
		r.Get("/artworks/{id}", artworks.GetByID)
		r.Get("/categories", categories.List)
		r.Get("/artist", artist.Get)
		r.Post("/orders", orders.Create)
		r.Post("/auth/login", auth.Login)
		r.Post("/auth/logout", auth.Logout)
		r.Group(func(r chi.Router) {
			r.Use(required.Require)
			r.Get("/admin/artworks", artworks.ListAdmin)
			r.Post("/admin/artworks", artworks.Create)
			r.Put("/admin/artworks/{id}", artworks.Update)
			r.Delete("/admin/artworks/{id}", artworks.Delete)
			r.Post("/admin/artworks/{id}/images", artworks.UploadImage)
			r.Delete("/admin/artworks/{id}/images/{imageId}", artworks.DeleteImage)
			r.Patch("/admin/artworks/{id}/images/reorder", artworks.ReorderImages)
			r.Post("/admin/categories", categories.Create)
			r.Put("/admin/categories/{id}", categories.Update)
			r.Delete("/admin/categories/{id}", categories.Delete)
			r.Get("/admin/orders", orders.List)
			r.Get("/admin/orders/{id}", orders.GetByID)
			r.Patch("/admin/orders/{id}/status", orders.UpdateStatus)
			r.Put("/admin/artist", artist.Update)
		})
	})
	return r
}
