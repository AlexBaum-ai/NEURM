#!/bin/bash

# Monitoring System Verification Script
# Verifies that all monitoring components are properly configured

echo "==================================="
echo "Monitoring System Verification"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $2 (file not found: $1)"
    ((FAILED++))
  fi
}

# Function to check if directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} $2 (directory will be created: $1)"
  fi
}

# Check core monitoring files
echo "Checking core monitoring files..."
check_file "src/services/monitoring.service.ts" "Monitoring service"
check_file "src/services/alerting.service.ts" "Alerting service"
check_file "src/middleware/prisma-logging.middleware.ts" "Database logging middleware"
check_file "src/middleware/performance-monitoring.middleware.ts" "Performance monitoring middleware"
check_file "src/modules/monitoring/monitoring.controller.ts" "Monitoring controller"
check_file "src/modules/monitoring/monitoring.routes.ts" "Monitoring routes"
check_file "src/config/bull-board.config.ts" "Bull Board configuration"
echo ""

# Check logging configuration
echo "Checking logging configuration..."
check_file "src/utils/logger.ts" "Winston logger"
check_file "src/instrument.ts" "Sentry instrumentation"
check_dir "logs" "Logs directory"
echo ""

# Check Sentry integration
echo "Checking Sentry integration..."
SENTRY_IMPORTS=$(grep -r "import.*Sentry" src/ --include="*.ts" | grep -v node_modules | wc -l)
if [ "$SENTRY_IMPORTS" -gt 50 ]; then
  echo -e "${GREEN}✓${NC} Sentry integration ($SENTRY_IMPORTS files)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Sentry integration (only $SENTRY_IMPORTS files)"
  ((FAILED++))
fi
echo ""

# Check environment variables
echo "Checking environment variables..."
if [ -f ".env" ] || [ -f ".env.development" ]; then
  ENV_FILE=".env"
  [ -f ".env.development" ] && ENV_FILE=".env.development"

  check_env_var() {
    if grep -q "^$1=" "$ENV_FILE" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} $1 configured"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠${NC} $1 not configured (optional)"
    fi
  }

  check_env_var "SENTRY_DSN"
  check_env_var "LOG_LEVEL"
  check_env_var "SLOW_QUERY_THRESHOLD"
  check_env_var "SLOW_RESPONSE_THRESHOLD"
else
  echo -e "${YELLOW}⚠${NC} No .env file found"
fi
echo ""

# Check package dependencies
echo "Checking package dependencies..."
if [ -f "package.json" ]; then
  check_dep() {
    if grep -q "\"$1\"" package.json; then
      echo -e "${GREEN}✓${NC} $1 installed"
      ((PASSED++))
    else
      echo -e "${RED}✗${NC} $1 not installed"
      ((FAILED++))
    fi
  }

  check_dep "@sentry/node"
  check_dep "winston"
  check_dep "winston-daily-rotate-file"
  check_dep "@bull-board/express"
else
  echo -e "${RED}✗${NC} package.json not found"
  ((FAILED++))
fi
echo ""

# Summary
echo "==================================="
echo "Summary"
echo "==================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All monitoring components verified successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some monitoring components are missing or misconfigured.${NC}"
  exit 1
fi
