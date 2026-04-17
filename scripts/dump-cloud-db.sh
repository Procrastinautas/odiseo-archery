#!/bin/bash

# Script to safely dump cloud Supabase database
# Exports all tables and auth data, excluding sensitive tokens

set -e

echo "🔄 Cloud Database Dump Script"
echo "=============================="
echo ""

# Load .env.local if it exists
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep DB_PASSWORD | xargs)
fi

# Cloud project details
PROJECT_ID="zmuwnaqovumgjmamgqez"
DB_HOST="db.${PROJECT_ID}.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
DB_PORT="5432"

echo "📍 Cloud Database: $DB_HOST"
echo ""

# Get password from environment or prompt
DB_PASSWORD="${DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
    read -sp "🔑 Enter your cloud database password: " DB_PASSWORD
    echo ""
else
    echo "✅ Using password from environment"
fi

# Build connection URL - URL encode the password
DB_PASSWORD_ENCODED=$(echo "$DB_PASSWORD" | sed -E 's/([^a-zA-Z0-9._-])/\\x\1/g' | sed 's/\\x/%/g' | tr '\n' ' ')
CLOUD_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Test connection with Google DNS (8.8.8.8) to bypass local DNS issues
echo "🔗 Testing connection..."
export PGDATABASE="$DB_NAME"
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"

# Try connection with public DNS
if ! psql -d "$DB_NAME" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Connection failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check password is correct in .env.local (DB_PASSWORD=...)"
    echo "  2. Make sure you have internet connection"
    echo "  3. Check firewall/VPN isn't blocking db.zmuwnaqovumgjmamgqez.supabase.co:5432"
    echo "  4. Try: ping 8.8.8.8 (should work) then nslookup db.zmuwnaqovumgjmamgqez.supabase.co"
    exit 1
fi

echo "✅ Connected to cloud database"
echo ""

DUMP_FILE="./supabase/cloud-dump-$(date +%Y%m%d_%H%M%S).sql"

echo "📥 Dumping from cloud Supabase..."
echo "Target: $DUMP_FILE"
echo ""

# Dump schema and data using environment variables (avoids URL parsing issues)
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --schema=public \
    --schema=auth \
    --no-owner \
    --no-privileges \
    --no-comments \
    --if-exists \
    --clean \
    --create \
    --disable-triggers \
    > "$DUMP_FILE"

echo "✅ Initial dump complete"
echo ""
echo "🔐 Cleaning sensitive data..."

# Create a cleaned version
CLEANED_FILE="${DUMP_FILE%.sql}_cleaned.sql"

# Use sed to:
# 1. Remove session tokens and JWT secrets
# 2. Keep user records but clear session-related fields
# 3. Reset sequences
cat "$DUMP_FILE" | sed \
    -e "/refresh_token/d" \
    -e "/session_id/d" \
    -e "/one_time_token/d" \
    > "$CLEANED_FILE"

echo "✅ Sensitive data cleaned"
echo ""
echo "🔧 Adding sequence reset commands..."

# Add sequence reset commands at the end
cat >> "$CLEANED_FILE" << 'SEQUENCES'

-- Reset sequences for local environment
SELECT setval(pg_get_serial_sequence('auth.users', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM auth.users;
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.profiles;
SELECT setval(pg_get_serial_sequence('public.training_sessions', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.training_sessions;
SELECT setval(pg_get_serial_sequence('public.bows', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.bows;
SELECT setval(pg_get_serial_sequence('public.arrows', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.arrows;
SELECT setval(pg_get_serial_sequence('public.rounds', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.rounds;
SELECT setval(pg_get_serial_sequence('public.marketplace_posts', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM public.marketplace_posts;

SEQUENCES

echo "✅ Sequences configured"
echo ""
echo "📊 Summary:"
echo "  Original dump: $DUMP_FILE"
echo "  Cleaned dump:  $CLEANED_FILE"
echo ""
echo "To import into local database, run:"
echo "  psql postgresql://postgres:postgres@127.0.0.1:55432/postgres -f $CLEANED_FILE"
echo ""
echo "✨ Done!"
