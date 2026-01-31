#!/bin/sh
# NOCO Ops - PostgreSQL Backup Script
# Synology DS223J için günlük yedekleme

set -e

# Backup dizini
BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/noco_ops_$DATE.sql.gz"

# Yedekleme
echo "[$(date)] Starting backup..."
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE | gzip > $BACKUP_FILE

# Boyut kontrolü
SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($SIZE)"

# Eski yedekleri temizle (30 günden eski)
echo "[$(date)] Cleaning old backups..."
find $BACKUP_DIR -name "noco_ops_*.sql.gz" -mtime +30 -delete

# Kalan yedek sayısı
COUNT=$(ls -1 $BACKUP_DIR/noco_ops_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Total backups: $COUNT"

echo "[$(date)] Backup script completed successfully"
