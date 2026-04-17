#!/bin/bash

# Import database dump into local Supabase
# Cleans existing schema first, then applies dump

set -e

echo "📤 Import Database Dump"
echo "======================="

LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:55432/postgres}"

SCHEMA_FILE="./supabase/dumps/cloud-dump-schema.sql"
DATA_FILE="./supabase/dumps/cloud-dump-data.sql"

if [ ! -f "$SCHEMA_FILE" ] || [ ! -f "$DATA_FILE" ]; then
    echo "❌ Dump files not found:"
    echo "  Schema: $SCHEMA_FILE"
    echo "  Data:   $DATA_FILE"
    echo "Run: npm run db:dump first"
    exit 1
fi

echo "📁 Schema: $SCHEMA_FILE"
echo "📁 Data:   $DATA_FILE"
echo "📍 Target: Local database"
echo ""

# Confirm before proceeding
read -p "⚠️  This will DELETE all local data. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Import cancelled"
    exit 1
fi

echo ""
echo "🧹 Cleaning existing schema..."

# Clean up: Drop all tables and types
psql "$LOCAL_DB_URL" \
    --set ON_ERROR_STOP=off \
    --quiet \
    << 'CLEANUP'
-- Disable RLS temporarily
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bows DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.arrows DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.round_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scope_marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scheduled_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.improvement_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stretching_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.warmup_plans DISABLE ROW LEVEL SECURITY;

-- Drop tables (cascading will handle foreign keys)
DROP TABLE IF EXISTS public.warmup_plans CASCADE;
DROP TABLE IF EXISTS public.stretching_plans CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.marketplace_posts CASCADE;
DROP TABLE IF EXISTS public.improvement_areas CASCADE;
DROP TABLE IF EXISTS public.bank_settings CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.scheduled_sessions CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.scope_marks CASCADE;
DROP TABLE IF EXISTS public.round_scores CASCADE;
DROP TABLE IF EXISTS public.rounds CASCADE;
DROP TABLE IF EXISTS public.training_sessions CASCADE;
DROP TABLE IF EXISTS public.arrows CASCADE;
DROP TABLE IF EXISTS public.bows CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.bow_hand CASCADE;
DROP TYPE IF EXISTS public.bow_type CASCADE;
DROP TYPE IF EXISTS public.session_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.weather_type CASCADE;
DROP TYPE IF EXISTS public.training_type CASCADE;
DROP TYPE IF EXISTS public.score_method CASCADE;
DROP TYPE IF EXISTS public.marketplace_category CASCADE;
DROP TYPE IF EXISTS public.marketplace_status CASCADE;
CLEANUP

echo "✅ Schema cleaned"
echo ""
echo "🔄 Applying schema..."

# Apply schema
psql "$LOCAL_DB_URL" \
    --set ON_ERROR_STOP=on \
    --quiet \
    -f "$SCHEMA_FILE"

echo "✅ Schema applied"
echo ""
echo "🔄 Importing data..."

# Import data
psql "$LOCAL_DB_URL" \
    --set ON_ERROR_STOP=on \
    --quiet \
    -f "$DATA_FILE"

echo "✅ Import complete!"
echo ""
echo "📋 Verifying..."

PROFILES=$(psql "$LOCAL_DB_URL" -t -c "SELECT COUNT(*) FROM public.profiles;" 2>/dev/null || echo "0")
SESSIONS=$(psql "$LOCAL_DB_URL" -t -c "SELECT COUNT(*) FROM public.training_sessions;" 2>/dev/null || echo "0")

echo "  Profiles: $PROFILES"
echo "  Training Sessions: $SESSIONS"
echo ""
echo "✨ Done! Database synced."
