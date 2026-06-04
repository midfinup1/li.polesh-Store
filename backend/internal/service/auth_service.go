package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

type AuthService struct {
	admins domain.AdminRepository
	cfg    config.JWTConfig
}

func NewAuthService(admins domain.AdminRepository, cfg config.JWTConfig) *AuthService {
	return &AuthService{admins: admins, cfg: cfg}
}

type TokenClaims struct {
	AdminID int64  `json:"admin_id"`
	Email   string `json:"email"`
	jwt.RegisteredClaims
}

func (s *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	admin, err := s.admins.GetByEmail(ctx, email)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, TokenClaims{
		AdminID: admin.ID,
		Email:   admin.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.ExpiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	return token.SignedString([]byte(s.cfg.Secret))
}

func (s *AuthService) ValidateToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.cfg.Secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return token.Claims.(*TokenClaims), nil
}

// HashPassword is a utility used in seeding/migrations
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}
