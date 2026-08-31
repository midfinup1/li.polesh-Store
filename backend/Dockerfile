# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.26.6-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git libavif-apps libwebp-tools

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /create-admin ./cmd/create-admin && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /migrate ./cmd/migrate && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /backfill-images ./cmd/backfill-images

# ── Final stage ───────────────────────────────────────────────────────────────
FROM alpine:3.24.1

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata libavif-apps libwebp-tools && \
    addgroup -S app && adduser -S -D -H -G app app

COPY --from=builder --chown=app:app /server /app/server
COPY --from=builder --chown=app:app /create-admin /app/create-admin
COPY --from=builder --chown=app:app /migrate /app/migrate
COPY --from=builder --chown=app:app /backfill-images /app/backfill-images
COPY --chown=app:app migrations/ /app/migrations/

EXPOSE 8080

USER app

CMD ["/app/server"]
