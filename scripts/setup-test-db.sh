#!/bin/bash

# Script to setup test database for E2E tests
# This script creates a separate test database and runs migrations

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up test database...${NC}"

# Load environment variables from .env.test
if [ -f .env.test ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
else
  echo -e "${RED}Error: .env.test file not found${NC}"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*@.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}Database details:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
  echo -e "${RED}Error: PostgreSQL is not running on $DB_HOST:$DB_PORT${NC}"
  echo "Please start PostgreSQL and try again."
  exit 1
fi

echo -e "${GREEN}PostgreSQL is running${NC}"

# Drop test database if it exists
echo -e "${YELLOW}Dropping existing test database (if exists)...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

# Create test database
echo -e "${YELLOW}Creating test database: $DB_NAME${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Database created successfully${NC}"
else
  echo -e "${RED}Failed to create database${NC}"
  exit 1
fi

# Run Prisma migrations
echo -e "${YELLOW}Running Prisma migrations...${NC}"
cd "$(dirname "$0")/.."

# Generate Prisma Client
pnpm exec prisma generate

# Run migrations
DATABASE_URL=$DATABASE_URL pnpm exec prisma migrate deploy

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migrations completed successfully${NC}"
else
  echo -e "${RED}Failed to run migrations${NC}"
  exit 1
fi

# Seed test data (optional)
if [ "$1" == "--seed" ]; then
  echo -e "${YELLOW}Seeding test database...${NC}"

  # Check if seed script exists
  if [ -f "scripts/seed-test-data.ts" ]; then
    DATABASE_URL=$DATABASE_URL pnpm exec tsx scripts/seed-test-data.ts

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Database seeded successfully${NC}"
    else
      echo -e "${RED}Failed to seed database${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}No seed script found at scripts/seed-test-data.ts${NC}"
  fi
fi

echo ""
echo -e "${GREEN}✓ Test database setup complete!${NC}"
echo ""
echo -e "${YELLOW}You can now run tests with:${NC}"
echo "  pnpm test:e2e"
echo ""
echo -e "${YELLOW}To reset the test database, run:${NC}"
echo "  ./scripts/setup-test-db.sh"
echo ""
