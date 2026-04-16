.PHONY: help install dev dev-backend dev-frontend build up down logs clean test lint format

help:
	@echo "📚 Commandes disponibles:"
	@echo "  make install       - Installer les dépendances"
	@echo "  make up            - Démarrer les services Docker"
	@echo "  make down          - Arrêter les services Docker"
	@echo "  make dev           - Démarrer en mode développement (Docker)"
	@echo "  make dev-backend   - Démarrer le backend seul"
	@echo "  make dev-frontend  - Démarrer le frontend seul"
	@echo "  make build         - Builder les images Docker"
	@echo "  make logs          - Afficher les logs des services"
	@echo "  make test          - Lancer les tests"
	@echo "  make lint          - Vérifier le code"
	@echo "  make format        - Formater le code"
	@echo "  make clean         - Nettoyer les volumes Docker"

install:
	cd backend && npm install
	cd frontend && npm install

up:
	docker-compose up -d

down:
	docker-compose down

dev: up
	@echo "✅ Services démarrés!"
	@echo "   Frontend : http://localhost:3000"
	@echo "   Backend  : http://localhost:3001"

dev-backend:
	cd backend && npm run start:dev

dev-frontend:
	cd frontend && npm run dev

build:
	docker-compose build

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

lint-backend:
	cd backend && npm run lint

lint-frontend:
	cd frontend && npm run lint

format-backend:
	cd backend && npm run format

format-frontend:
	cd frontend && npm run format

format: format-backend format-frontend

clean:
	docker-compose down -v
	rm -rf backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist

.DEFAULT_GOAL := help

