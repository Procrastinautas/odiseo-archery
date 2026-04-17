#!/bin/bash

# Dump data only from linked Supabase project

set -e

# Load environment
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep DB_PASSWORD | xargs)
  export SUPABASE_DB_PASSWORD=$DB_PASSWORD
fi

echo "📥 Dumping data..."

DUMP_FILE="./supabase/dumps/cloud-dump-data.sql"
mkdir -p ./supabase/dumps

{
  echo "-- Cloud Supabase Database Data"
  echo "-- Generated: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  echo ""
  supabase db dump --data-only --linked 2>&1
} > "$DUMP_FILE"

echo "✅ Data dump complete!"
echo "📁 File: $DUMP_FILE"
