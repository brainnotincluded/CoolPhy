#!/bin/bash
set -e

# CoolPhy Full Deployment Script
# Deploy backend and frontend to VPS server

SERVER="root@178.255.127.62"
SERVER_DIR="/root/coolphy"
PROJECT_DIR="/Users/mac/projects/CoolPhy"

echo "🚀 Starting CoolPhy Deployment to VPS..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Prepare local files
echo -e "${BLUE}📦 Step 1: Preparing local files...${NC}"
cd "$PROJECT_DIR"

# Commit any uncommitted changes
cd coolphy-frontend
git add -A
git commit -m "deploy: preparing for VPS deployment" || true
cd ..

cd coolphy-backend  
git add -A
git commit -m "deploy: preparing for VPS deployment" || true
cd ..

echo -e "${GREEN}✅ Local files prepared${NC}"

# Step 2: Create deployment package
echo -e "${BLUE}📦 Step 2: Creating deployment package...${NC}"
cd "$PROJECT_DIR"
tar -czf /tmp/coolphy-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='bin' \
    coolphy-backend coolphy-frontend admin-panel

echo -e "${GREEN}✅ Package created: $(du -h /tmp/coolphy-deploy.tar.gz | cut -f1)${NC}"

# Step 3: Upload to server
echo -e "${BLUE}📤 Step 3: Uploading to server...${NC}"
scp /tmp/coolphy-deploy.tar.gz $SERVER:/tmp/

echo -e "${GREEN}✅ Files uploaded${NC}"

# Step 4: Deploy on server
echo -e "${BLUE}🔧 Step 4: Deploying on server...${NC}"

ssh $SERVER << 'ENDSSH'
set -e

echo "📦 Extracting files..."
cd /root
rm -rf coolphy
mkdir -p coolphy
cd coolphy
tar -xzf /tmp/coolphy-deploy.tar.gz
mv coolphy-backend backend
mv coolphy-frontend frontend

echo "🐳 Setting up Docker services..."

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: coolphy-postgres
    environment:
      POSTGRES_DB: coolphy
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: golang:1.21-alpine
    container_name: coolphy-backend
    working_dir: /app
    volumes:
      - ./backend:/app
      - go_modules:/go/pkg/mod
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
      - PORT=8080
      - DB_URL=postgres://postgres:postgres@postgres:5432/coolphy?sslmode=disable
      - JWT_SECRET=prod_secret_change_me_in_production_$(date +%s)
      - RATE_LIMIT=100-M
      - CORS_ALLOWED_ORIGINS=*
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "apk add --no-cache git && go run ./cmd/server"
    restart: unless-stopped

  frontend:
    image: node:18-alpine
    container_name: coolphy-frontend
    working_dir: /app
    volumes:
      - ./frontend:/app
      - node_modules:/app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://178.255.127.62:8080/api/v1
      - NEXT_PUBLIC_ADMIN_PANEL_URL=/admin-panel
    command: sh -c "npm install && npm run build && npm start"
    restart: unless-stopped

volumes:
  postgres_data:
  go_modules:
  node_modules:
EOF

echo "🚀 Starting services..."
docker compose down || true
docker compose up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "📊 Checking service status..."
docker compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://178.255.127.62:3000"
echo "   Backend:  http://178.255.127.62:8080"
echo "   Admin:    http://178.255.127.62:3000/admin/dashboard"
echo ""
echo "📝 Setup admin access:"
echo "   Visit: http://178.255.127.62:3000/setup-admin.html"
echo ""
echo "🔍 View logs:"
echo "   docker compose logs -f backend"
echo "   docker compose logs -f frontend"
echo ""

ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Your application is now live:"
echo ""
echo "   Frontend: http://178.255.127.62:3000"
echo "   Backend:  http://178.255.127.62:8080"
echo "   Admin:    http://178.255.127.62:3000/admin/dashboard"
echo ""
echo "📝 Next steps:"
echo "   1. Visit http://178.255.127.62:3000/setup-admin.html"
echo "   2. Set up your admin account"
echo "   3. Start creating content!"
echo ""
echo "🔍 Monitor deployment:"
echo "   ssh $SERVER 'cd /root/coolphy && docker compose logs -f'"
echo ""
