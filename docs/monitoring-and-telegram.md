# Monitoring and Telegram notifications

## Внешний uptime-monitoring

Для внешнего мониторинга используется UptimeRobot.

Настроенные HTTP monitors:

```text
https://lipolesh.art
https://lipolesh.art/admin/login
https://lipolesh.art/api/health
https://lipolesh.art/api/v1/health
https://lipolesh.art/api/v1/ready
https://lipolesh.art/order
```

Рекомендуемый интервал проверки:

```text
5 минут
```

Что проверяют endpoints:

```text
/api/health
```

Проверяет доступность frontend/Caddy route.

```text
/api/v1/health
```

Проверяет, что backend-процесс жив.

```text
/api/v1/ready
```

Проверяет, что backend жив и может подключиться к PostgreSQL.

## Telegram-уведомления о новых заявках

Уведомления отправляются backend'ом после успешного создания заявки.

Переменные окружения:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_NOTIFICATIONS_ENABLED=true
```

Если `TELEGRAM_NOTIFICATIONS_ENABLED=false` или не заполнены token/chat id, уведомления отключены.

## Email-уведомления

Email/Resend-уведомления не используются. Основной канал уведомлений о заявках — Telegram.
