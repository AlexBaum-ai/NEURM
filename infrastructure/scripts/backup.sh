#!/bin/bash
#
# Database Backup Script for Neurmatic
# This script creates compressed PostgreSQL backups and uploads them to S3
# Schedule with cron: 0 2 * * * /opt/neurmatic/infrastructure/scripts/backup.sh
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-neurmatic_production}"
DB_USER="${POSTGRES_USER:-neurmatic}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-neurmatic-backups}"
S3_PREFIX="${S3_PREFIX:-database}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)
BACKUP_FILE="${BACKUP_DIR}/neurmatic_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting database backup..."

# Check if required environment variables are set
if [ -z "${PGPASSWORD:-}" ]; then
    error_exit "PGPASSWORD environment variable is not set"
fi

# Test database connection
log "Testing database connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    error_exit "Cannot connect to database at $DB_HOST:$DB_PORT"
fi

# Create backup
log "Creating database dump..."
if ! pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    error_exit "pg_dump failed"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Compress backup
log "Compressing backup..."
if ! gzip -9 "$BACKUP_FILE"; then
    error_exit "Compression failed"
fi

COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
log "Backup compressed: $BACKUP_FILE_GZ ($COMPRESSED_SIZE)"

# Upload to S3 (if AWS CLI is available)
if command -v aws &> /dev/null; then
    log "Uploading backup to S3..."
    if aws s3 cp "$BACKUP_FILE_GZ" "s3://${S3_BUCKET}/${S3_PREFIX}/neurmatic_${TIMESTAMP}.sql.gz" \
        --storage-class STANDARD_IA \
        --metadata "timestamp=${TIMESTAMP},size=${COMPRESSED_SIZE}" 2>> "$LOG_FILE"; then
        log "Backup uploaded to S3 successfully"
    else
        log "WARNING: Failed to upload backup to S3"
    fi
else
    log "WARNING: AWS CLI not found, skipping S3 upload"
fi

# Clean up old local backups
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "neurmatic_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "Deleted $DELETED_COUNT old backup(s)"

# Clean up old S3 backups (if AWS CLI is available)
if command -v aws &> /dev/null; then
    log "Cleaning up old S3 backups..."
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}" >> "$LOG_FILE" 2>&1
            log "Deleted old S3 backup: $FILE_NAME"
        fi
    done
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE_GZ" > /dev/null 2>&1; then
    log "Backup integrity verified successfully"
else
    error_exit "Backup integrity check failed"
fi

# Summary
log "Backup completed successfully!"
log "File: $BACKUP_FILE_GZ"
log "Size: $COMPRESSED_SIZE"
log "Retention: ${RETENTION_DAYS} days"

# Send notification (optional - integrate with Slack/email if needed)
# curl -X POST -H 'Content-type: application/json' \
#   --data "{\"text\":\"Database backup completed: neurmatic_${TIMESTAMP}.sql.gz ($COMPRESSED_SIZE)\"}" \
#   "$SLACK_WEBHOOK_URL"

exit 0
