COMPOSE=docker compose --env-file infra/.env -f infra/docker-compose.yml
COMPOSE_PROD=docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml

.PHONY: init up down logs test admin admin-prod prod-pull prod-up prod-ps prod-logs backup restore

init:
	cp -n infra/.env.example infra/.env || true
	cd backend && go mod tidy
	cd frontend && npm install

check:
	cd backend && go mod tidy
	cd frontend && npm install

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

destroy:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f --tail=100

test:
	cd backend && go test ./...
	cd frontend && npm run lint && npm run type-check && npm run build

admin:
	@test -n "$$ADMIN_EMAIL" -a -n "$$ADMIN_PASSWORD" || (echo 'Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters)' && exit 1)
	@test $${#ADMIN_PASSWORD} -ge 12 || (echo 'ADMIN_PASSWORD must contain at least 12 characters' && exit 1)
	$(COMPOSE) exec backend go run ./cmd/create-admin -email "$$ADMIN_EMAIL" -password "$$ADMIN_PASSWORD"

admin-prod:
	@test -n "$$ADMIN_EMAIL" -a -n "$$ADMIN_PASSWORD" || (echo 'Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters)' && exit 1)
	@test $${#ADMIN_PASSWORD} -ge 12 || (echo 'ADMIN_PASSWORD must contain at least 12 characters' && exit 1)
	$(COMPOSE_PROD) exec backend /app/create-admin -email "$$ADMIN_EMAIL" -password "$$ADMIN_PASSWORD"

prod-pull:
	$(COMPOSE_PROD) pull

prod-up:
	$(COMPOSE_PROD) up -d --remove-orphans

prod-ps:
	$(COMPOSE_PROD) ps

prod-logs:
	$(COMPOSE_PROD) logs -f --tail=100

backup:
	./scripts/backup-postgres.sh

restore:
	./scripts/restore-postgres.sh