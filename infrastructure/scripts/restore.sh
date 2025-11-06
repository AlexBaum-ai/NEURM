#!/bin/bash
#
# Database Restore Script for Neurmatic
# This script restores a PostgreSQL backup from local file or S3
#
# Usage:
#   ./restore.sh <backup_file>                    # Restore from local file
#   ./restore.sh s3://bucket/path/backup.sql.gz   # Restore from S3
#

set -e
set -u

# Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-neurmatic_production}"
DB_USER="${POSTGRES_USER:-neurmatic}"
TEMP_DIR="${TEMP_DIR:-/tmp}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/neurmatic_restore_${TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file|s3_uri>"
    echo "Examples:"
    echo "  $0 /backups/neurmatic_20250106_020000.sql.gz"
    echo "  $0 s3://neurmatic-backups/database/neurmatic_20250106_020000.sql.gz"
    exit 1
fi

BACKUP_SOURCE="$1"

log "Starting database restore..."
log "Source: $BACKUP_SOURCE"

# Check if required environment variables are set
if [ -z "${PGPASSWORD:-}" ]; then
    error_exit "PGPASSWORD environment variable is not set"
fi

# Test database connection
log "Testing database connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    error_exit "Cannot connect to database at $DB_HOST:$DB_PORT"
fi

# Determine if source is S3 or local file
if [[ "$BACKUP_SOURCE" =~ ^s3:// ]]; then
    log "Downloading backup from S3..."
    BACKUP_FILE="${TEMP_DIR}/restore_${TIMESTAMP}.sql.gz"
    if ! aws s3 cp "$BACKUP_SOURCE" "$BACKUP_FILE"; then
        error_exit "Failed to download backup from S3"
    fi
else
    BACKUP_FILE="$BACKUP_SOURCE"
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file not found: $BACKUP_FILE"
    fi
fi

log "Using backup file: $BACKUP_FILE"

# Verify backup integrity
log "Verifying backup integrity..."
if ! gunzip -t "$BACKUP_FILE" > /dev/null 2>&1; then
    error_exit "Backup file is corrupted"
fi

# Confirmation prompt (safety check)
echo ""
echo "WARNING: This will restore the database '$DB_NAME' on $DB_HOST:$DB_PORT"
echo "Current data will be LOST. This action CANNOT be undone."
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Create a backup of current database before restore
log "Creating safety backup of current database..."
SAFETY_BACKUP="/backups/pre_restore_${TIMESTAMP}.sql.gz"
mkdir -p "$(dirname "$SAFETY_BACKUP")"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"; then
    log "Safety backup created: $SAFETY_BACKUP"
else
    log "WARNING: Failed to create safety backup"
fi

# Disconnect all active connections
log "Disconnecting active connections..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
EOF

# Drop and recreate database
log "Dropping existing database..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>> "$LOG_FILE"; then
    error_exit "Failed to drop database"
fi

log "Creating new database..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8';" 2>> "$LOG_FILE"; then
    error_exit "Failed to create database"
fi

# Restore database
log "Restoring database from backup..."
if gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>> "$LOG_FILE"; then
    log "Database restored successfully"
else
    error_exit "Database restore failed. Check $LOG_FILE for details"
fi

# Run migrations (in case backup is from older version)
log "Running Prisma migrations..."
if command -v npx &> /dev/null && [ -f "/app/prisma/schema.prisma" ]; then
    cd /app
    if npx prisma migrate deploy 2>> "$LOG_FILE"; then
        log "Migrations completed successfully"
    else
        log "WARNING: Migrations failed or not needed"
    fi
else
    log "WARNING: Prisma not found, skipping migrations"
fi

# Verify restore
log "Verifying restore..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)
log "Restored $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -gt 0 ]; then
    log "Restore verification successful"
else
    error_exit "Restore verification failed - no tables found"
fi

# Clean up temporary files
if [[ "$BACKUP_SOURCE" =~ ^s3:// ]]; then
    log "Cleaning up temporary files..."
    rm -f "$BACKUP_FILE"
fi

log "Database restore completed successfully!"
log "Safety backup available at: $SAFETY_BACKUP"
log "Full log available at: $LOG_FILE"

exit 0
