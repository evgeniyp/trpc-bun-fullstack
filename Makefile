.PHONY: help install dev build check verify up down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Install deps
	bun install

dev: ## Run dev server (HMR)
	bun dev

build: ## Build frontend to dist/
	bun run build-fe

check: ## Lint + format + autofix (Biome)
	bun check

verify: ## CI gate: lint + types + build
	bunx biome check && bunx tsc --noEmit && bun run build-fe

docker-up: ## docker compose up -d
	docker compose up -d

docker-down: ## docker compose down
	docker compose down
