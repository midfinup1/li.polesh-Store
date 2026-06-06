# Production observability

В backend добавлен Prometheus endpoint:

```text
/metrics
```

Основные метрики:

```text
artist_portfolio_http_requests_total
artist_portfolio_http_request_duration_seconds
```

## Локальный запуск мониторинга

```bash
docker compose --env-file infra/.env -f infra/docker-compose.yml -f infra/docker-compose.monitoring.yml up -d
```

Адреса:

```text
Prometheus:  http://localhost:9090
Grafana:     http://localhost:3001
Uptime Kuma: http://localhost:3002
Loki:        http://localhost:3100
```

Для Uptime Kuma добавь HTTP-мониторинг:

```text
http://backend:8080/api/v1/ready
```

или снаружи production-домена:

```text
https://example.com/api/v1/ready
```

## Базовые алерты

Минимальный набор алертов:

```text
1. /api/v1/ready недоступен больше 1 минуты
2. доля 5xx больше 5 процентов за 5 минут
3. p95 latency больше 1 секунды за 5 минут
4. backup не создавался больше 24 часов
5. свободное место на диске меньше 15 процентов
```
