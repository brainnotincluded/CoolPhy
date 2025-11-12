SHELL := /bin/bash

APP_NAME := coolphy-backend
PKG := ./...

.PHONY: run dev build tidy test docker-up docker-down migrate

run:
	go run ./cmd/server

dev:
	reflex -r '\\.(go|mod)$$' -s -- sh -c 'go run ./cmd/server'

build:
	go build -o bin/server ./cmd/server

 tidy:
	go mod tidy

 test:
	go test -v $(PKG)

 docker-up:
	docker compose up -d

 docker-down:
	docker compose down

migrate:
	@echo "Migrations via GORM AutoMigrate on startup"
