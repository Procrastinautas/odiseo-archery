#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Cloud credentials can be passed via command line args or env vars
// Usage: npm run db:dump -- --url=https://xxx.supabase.co --key=sb_... --service-key=sb_secret_...
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

// Get Supabase credentials
const SUPABASE_URL = args.url || process.env.CLOUD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = args.key || process.env.CLOUD_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = args['service-key'] || process.env.CLOUD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase cloud credentials\n');
  console.error('Provide via:');
  console.error('  1. Command args: npm run db:dump -- --url=https://xxx.supabase.co --key=sb_... --service-key=sb_secret_...');
  console.error('  2. Environment vars: CLOUD_SUPABASE_URL, CLOUD_SUPABASE_ANON_KEY, CLOUD_SUPABASE_SERVICE_ROLE_KEY');
  console.error('  3. Or in .env.local with CLOUD_ prefix\n');
  process.exit(1);
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Service role key not provided - may hit RLS restrictions');
}

const { createClient } = require('@supabase/supabase-js');

async function dumpDatabase() {
  console.log('🔄 Cloud Database Dump Script');
  console.log('==============================\n');

  try {
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('🔗 Connecting to cloud database...');

    // Test connection
    const { error: testError } = await supabase.from('profiles').select('id').limit(1);
    if (testError) {
      throw testError;
    }

    console.log('✅ Connected successfully\n');
    console.log('📥 Dumping tables...\n');

    const tables = [
      'profiles',
      'bows',
      'arrows',
      'training_sessions',
      'rounds',
      'round_scores',
      'scope_marks',
      'locations',
      'scheduled_sessions',
      'payments',
      'bank_settings',
      'improvement_areas',
      'marketplace_posts',
      'notifications',
      'stretching_plans',
      'warmup_plans',
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const schemaFile = path.join('./supabase/dumps', `cloud-dump-schema-${timestamp}.sql`);
    const dataFile = path.join('./supabase/dumps', `cloud-dump-data-${timestamp}.sql`);

    // Ensure directory exists
    if (!fs.existsSync('./supabase/dumps')) {
      fs.mkdirSync('./supabase/dumps', { recursive: true });
    }

    // ============================================================
    // SCHEMA FILE
    // ============================================================
    let schemaSql = '-- Cloud Supabase Database Schema\n';
    schemaSql += `-- Generated: ${new Date().toISOString()}\n`;
    schemaSql += '-- Source: ' + SUPABASE_URL + '\n\n';
    schemaSql += 'SET statement_timeout = 0;\n';
    schemaSql += 'SET lock_timeout = 0;\n';
    schemaSql += 'SET idle_in_transaction_session_timeout = 0;\n';
    schemaSql += 'SET client_encoding = \'UTF8\';\n';
    schemaSql += 'SET standard_conforming_strings = on;\n\n';

    // Read schema from schema.sql file
    try {
      const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        schemaSql += schemaContent + '\n\n';
        console.log('  ✅ Schema file prepared');
      }
    } catch (err) {
      console.log('  ⚠️  Could not read schema.sql');
    }

    // ============================================================
    // DATA FILE
    // ============================================================
    let sql = '-- Cloud Supabase Database Data\n';
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += '-- Source: ' + SUPABASE_URL + '\n\n';
    sql += 'SET statement_timeout = 0;\n';
    sql += 'SET client_encoding = \'UTF8\';\n\n';

    // Dump each table
    for (const table of tables) {
      try {
        console.log(`  Exporting ${table}...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(10000);

        if (error) {
          console.log(`    ⚠️  Skipped (${error.message})`);
          continue;
        }

        if (data && data.length > 0) {
          sql += `\n-- ${table}\n`;
          sql += `DELETE FROM public.${table};\n`;

          const columns = Object.keys(data[0]);
          const columnList = columns.map(c => `"${c}"`).join(', ');

          for (const row of data) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            }).join(', ');

            sql += `INSERT INTO public.${table} (${columnList}) VALUES (${values});\n`;
          }

          console.log(`    ✅ ${data.length} rows exported`);
        } else {
          console.log(`    ⊘ No data`);
        }
      } catch (err) {
        console.log(`    ❌ Error: ${err.message}`);
      }
    }

    // Write to separate files
    fs.writeFileSync(schemaFile, schemaSql);
    fs.writeFileSync(dataFile, sql);

    console.log(`\n✅ Dump complete!`);
    console.log(`📁 Schema: ${schemaFile}`);
    console.log(`📁 Data:   ${dataFile}`);
    console.log(`\nTo import locally:\n  npm run db:import`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dumpDatabase();
