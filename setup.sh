#!/bin/bash
# TracFin Module - Setup Script for Mac/Linux
# Automatically installs and configures the project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🎰 TracFin Module - Automatic setup${NC}"
echo -e "${CYAN}============================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}   Download it at https://nodejs.org/${NC}"
    exit 1
fi

# pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm installed: $PNPM_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm is not installed. Installing...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✅ pnpm installed successfully${NC}"
fi

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo -e "${YELLOW}   Mac: https://www.docker.com/products/docker-desktop/${NC}"
    echo -e "${YELLOW}   Linux: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

# Check that Docker is running
if docker ps &> /dev/null; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}   Start Docker then re-run this script${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}✅ Dependencies installed successfully${NC}\n"

echo -e "${YELLOW}🐳 Starting PostgreSQL...${NC}"
pnpm run db:up

echo -e "${YELLOW}⏳ Waiting for PostgreSQL to start (20 seconds)...${NC}"
sleep 20

# Check that PostgreSQL is ready
echo -e "${YELLOW}🔍 Checking PostgreSQL connection...${NC}"
MAX_ATTEMPTS=10
ATTEMPT=0
CONNECTED=false

while [ "$CONNECTED" = false ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    if docker compose exec -T postgres pg_isready -U tracfin_user &> /dev/null; then
        CONNECTED=true
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}\n"
    else
        echo -e "${GRAY}   Attempt $ATTEMPT/$MAX_ATTEMPTS...${NC}"
        sleep 3
    fi
done

if [ "$CONNECTED" = false ]; then
    echo -e "${RED}❌ Unable to connect to PostgreSQL${NC}"
    echo -e "${YELLOW}   Check logs with: pnpm run db:logs${NC}"
    exit 1
fi

echo -e "${YELLOW}🌱 Generating 40,000 players and their data...${NC}"
echo -e "${GRAY}   ⏱️  This may take 3-7 minutes depending on your machine${NC}\n"

pnpm run db:seed:build

echo ""
echo -e "${GREEN}✨ Setup completed successfully!${NC}\n"
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}🎯 Next steps:${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${YELLOW}1️⃣  Start the Next.js application:${NC}"
echo -e "    ${NC}pnpm dev${NC}"
echo ""
echo -e "${YELLOW}2️⃣  Open in your browser:${NC}"
echo -e "    ${NC}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}3️⃣  Access pgAdmin (DB web interface):${NC}"
echo -e "    ${NC}http://localhost:5050${NC}"
echo -e "    ${GRAY}Email: admin@example.com${NC}"
echo -e "    ${GRAY}Password: admin${NC}"
echo ""
echo -e "${YELLOW}📚 Full documentation:${NC}"
echo -e "    ${NC}README.md${NC}"
echo ""
echo -e "${YELLOW}🛠️  Useful commands:${NC}"
echo -e "    ${GRAY}pnpm run db:logs    # View PostgreSQL logs${NC}"
echo -e "    ${GRAY}pnpm run db:down    # Stop the database${NC}"
echo -e "    ${GRAY}pnpm run db:reset   # Full database reset${NC}"
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}✅ All set! Happy coding! 🚀${NC}"
echo -e "${CYAN}=========================================${NC}"
