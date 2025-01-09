# Makefile
.PHONY: build run stop clean test logs help dev-backend dev-frontend dev install-dev

DOCKER_COMPOSE := docker compose
PYTHON := python3
PIP := pip3
DEV_BACKEND_PORT := 8000
DEV_FRONTEND_PORT := 3000

help:
	@echo "Security Analyzer Make Commands:"
	@echo "Basic Commands:"
	@echo "  make build           - Build all containers"
	@echo "  make run            - Run all containers"
	@echo "  make stop           - Stop all containers"
	@echo "  make clean          - Clean up containers and images"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install-dev    - Install development dependencies"
	@echo "  make dev           - Run both frontend and backend in development mode"
	@echo "  make dev-frontend  - Run frontend development server"
	@echo "  make dev-backend   - Run backend development server"
	@echo ""
	@echo "Logging Commands:"
	@echo "  make logs          - Show all logs"

# Development setup
install-dev:
	@echo "Installing development dependencies..."
	$(PIP) install watchdog uvicorn fastapi sqlalchemy openai python-multipart

# Run both servers using a shell script
dev:
	@echo "Starting development servers..."
	@trap 'kill %1; kill %2' SIGINT; \
	http-server frontend -c-1 --port=3000 -a localhost  & \
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000 & \
	wait

dev-frontend:
	@echo "Starting frontend development server on port 3000..."
	http-server frontend -c-1 --port 3000 -a localhost

dev-backend:
	@echo "Starting backend development server on port 8000..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Docker commands
build:
	@echo "Building Docker images..."
	$(DOCKER_COMPOSE) build

run:
	@echo "Starting application in Docker..."
	$(DOCKER_COMPOSE) up -d
	@echo "Application is running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

stop:
	@echo "Stopping application..."
	$(DOCKER_COMPOSE) down

clean:
	@echo "Cleaning up..."
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans

logs:
	@echo "Showing all logs..."
	$(DOCKER_COMPOSE) logs -f

frontend-logs:
	@echo "Showing frontend logs..."
	$(DOCKER_COMPOSE) logs -f frontend

backend-logs:
	@echo "Showing backend logs..."
	$(DOCKER_COMPOSE) logs -f backend

# Testing and verification
test:
	@echo "Running tests..."
	$(PYTHON) verify_setup.py
