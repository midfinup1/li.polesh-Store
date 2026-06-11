# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS builder

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
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata libavif-apps libwebp-tools

COPY --from=builder /server /app/server
COPY --from=builder /create-admin /app/create-admin
COPY --from=builder /migrate /app/migrate
COPY --from=builder /backfill-images /app/backfill-images
COPY migrations/ /app/migrations/

EXPOSE 8080

CMD ["/app/server"]
