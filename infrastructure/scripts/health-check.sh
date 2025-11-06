#!/bin/bash
#
# Health Check Script for Neurmatic
# This script checks the health of all services and reports status
#
# Usage: ./health-check.sh [--verbose] [--json]
#

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-neurmatic}"
DB_NAME="${DB_NAME:-neurmatic_production}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Flags
VERBOSE=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --json|-j)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--verbose] [--json]"
            exit 1
            ;;
    esac
done

# Health status tracking
ALL_HEALTHY=true
declare -A SERVICE_STATUS

# Logging function
log() {
    if [ "$VERBOSE" = true ] || [ "$JSON_OUTPUT" = false ]; then
        echo "$1"
    fi
}

# Check function
check_service() {
    local service_name="$1"
    local check_command="$2"

    log "Checking $service_name..."

    if eval "$check_command" > /dev/null 2>&1; then
        SERVICE_STATUS["$service_name"]="healthy"
        log "✓ $service_name is healthy"
        return 0
    else
        SERVICE_STATUS["$service_name"]="unhealthy"
        ALL_HEALTHY=false
        log "✗ $service_name is unhealthy"
        return 1
    fi
}

# Check API health
check_api() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/v1/health" --max-time 5)
    [ "$response" = "200" ]
}

# Check Frontend
check_frontend() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" --max-time 5)
    [ "$response" = "200" ]
}

# Check PostgreSQL
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1
    fi
}

# Check Redis
check_redis() {
    if command -v redis-cli &> /dev/null; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"
    else
        timeout 2 bash -c "echo -e 'PING\r\n' | nc $REDIS_HOST $REDIS_PORT" | grep -q "+PONG"
    fi
}

# Check disk space
check_disk_space() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    [ "$usage" -lt 90 ]  # Fail if disk usage > 90%
}

# Check memory
check_memory() {
    local available=$(free | grep Mem | awk '{print ($7/$2) * 100}' | cut -d. -f1)
    [ "$available" -gt 10 ]  # Fail if available memory < 10%
}

# Run health checks
log "======================================="
log "Neurmatic Health Check"
log "======================================="
log ""

check_service "Backend API" "check_api"
check_service "Frontend" "check_frontend"
check_service "PostgreSQL" "check_postgres"
check_service "Redis" "check_redis"
check_service "Disk Space" "check_disk_space"
check_service "Memory" "check_memory"

log ""
log "======================================="

# Output results
if [ "$JSON_OUTPUT" = true ]; then
    # JSON output
    echo "{"
    echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"overall_status\": \"$([ "$ALL_HEALTHY" = true ] && echo "healthy" || echo "unhealthy")\","
    echo "  \"services\": {"

    first=true
    for service in "${!SERVICE_STATUS[@]}"; do
        [ "$first" = false ] && echo ","
        echo -n "    \"$service\": \"${SERVICE_STATUS[$service]}\""
        first=false
    done

    echo ""
    echo "  }"
    echo "}"
else
    # Human-readable output
    if [ "$ALL_HEALTHY" = true ]; then
        log "Overall Status: ✓ HEALTHY"
        exit 0
    else
        log "Overall Status: ✗ UNHEALTHY"
        exit 1
    fi
fi
