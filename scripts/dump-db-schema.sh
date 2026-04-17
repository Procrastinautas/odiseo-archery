#!/bin/bash

# Dump schema only from linked Supabase project

set -e

# Load environment
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep DB_PASSWORD | xargs)
  export SUPABASE_DB_PASSWORD=$DB_PASSWORD
fi

echo "📥 Dumping schema..."

DUMP_FILE="./supabase/dumps/cloud-dump-schema.sql"
mkdir -p ./supabase/dumps

{
  echo "-- Cloud Supabase Database Schema"
  echo "-- Generated: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  echo ""
  supabase db dump --linked 2>&1
} > "$DUMP_FILE"

echo "✅ Schema dump complete!"
echo "📁 File: $DUMP_FILE"
