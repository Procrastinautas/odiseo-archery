#!/bin/bash

# Dump schema + data from linked Supabase project
# Runs both schema and data dumps

set -e

echo "📥 Dumping database (schema + data)..."
echo ""

bash scripts/dump-db-schema.sh
echo ""
bash scripts/dump-db-data.sh

echo ""
echo "✅ Complete dump saved!"
echo "  Schema: ./supabase/dumps/cloud-dump-schema.sql"
echo "  Data:   ./supabase/dumps/cloud-dump-data.sql"
