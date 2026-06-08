# Uptime monitoring and Telegram notifications

## Health endpoints

Frontend health endpoint:

```text
GET /api/health
```

Backend liveness endpoint:

```text
GET /api/v1/health
```

Backend readiness endpoint with database check:

```text
GET /api/v1/ready
```

For external uptime monitoring use at least these checks:

```text
https://lipolesh.art/api/health
https://lipolesh.art/api/v1/health
https://lipolesh.art/api/v1/ready
```

Recommended settings:

```text
Method: GET
Expected status: 200
Interval: 1-5 minutes
Timeout: 10 seconds
Notification channel: Telegram or email
```

`/api/v1/health` checks that the backend process is alive.
`/api/v1/ready` checks that the backend process is alive and PostgreSQL is reachable.

## Telegram notifications for new orders

Backend sends Telegram notifications after a new order is successfully saved.
If Telegram is unavailable, order creation is not blocked.

Add these variables to `infra/.env` or `infra/.env.prod`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_NOTIFICATIONS_ENABLED=true
PUBLIC_SITE_URL=https://lipolesh.art
```

How to get values:

1. Create a bot via `@BotFather` and copy the token to `TELEGRAM_BOT_TOKEN`.
2. Send any message to the bot.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates`.
4. Copy `message.chat.id` to `TELEGRAM_CHAT_ID`.

For a group chat, add the bot to the group, send a message in the group and get the negative chat id from `getUpdates`.
