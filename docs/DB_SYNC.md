# Local Database Sync with Cloud

Safely sync your cloud Supabase database to local development.

## Setup

### 1. Add Cloud Database Password to `.env.local`

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`odiseo`)
3. Go to **Settings** → **Database**
4. Copy your database password
5. Add to `.env.local`:
```bash
DB_PASSWORD=your_password_here
```

### 2. Ensure Local Supabase is Running

```bash
supabase start
```

## Usage

### Dump Cloud Database
```bash
npm run db:dump
```

The script will:
1. Read password from `.env.local` (DB_PASSWORD)
2. Test the connection to cloud database
3. Export all tables and data

Creates a cleaned SQL dump in `./supabase/cloud-dump-*.sql` with:
- ✅ All tables and data
- ✅ All auth users (with passwords intact)
- ✅ All RLS policies
- ❌ Session tokens (removed for security)
- ❌ Refresh tokens (removed for security)
- ✅ Sequences reset for local use

### Import to Local
```bash
npm run db:import
```

Applies the latest dump to your local database. **Warning:** This will replace all local data.

### Sync Everything (One Command)
```bash
npm run db:sync
```

Runs dump + import in sequence.

## What Gets Exported

| Item | Included | Notes |
|------|----------|-------|
| Users (auth.users) | ✅ | Passwords intact, tokens removed |
| Profiles | ✅ | User metadata preserved |
| Training Sessions | ✅ | All session data |
| Bows & Arrows | ✅ | Gear inventory |
| Rounds & Scores | ✅ | Training history |
| Marketplace Posts | ✅ | Listings |
| RLS Policies | ✅ | Security intact |
| Session Tokens | ❌ | Removed for security |
| Refresh Tokens | ❌ | Removed for security |

## Sensitive Data Handling

### Removed Before Import
- `refresh_token` - Single-use auth tokens
- `session_id` - Active session identifiers
- `one_time_token` - 2FA tokens

### Preserved
- User passwords (bcrypt hashed) - can still login
- User metadata - name, email, profile data
- All database records - trainings, bows, sessions

## Troubleshooting

### "Password authentication failed"
- Double-check your cloud database password
- Make sure you copied it correctly from Supabase Settings
- If your password contains special characters, you may need to escape them

### "relation already exists"
- Local database has conflicts
- Run: `supabase db reset` first (⚠️ loses all local data)
- Then run: `npm run db:import`

### Import is slow
- Normal for large databases
- Network speed affects transfer time
- Give it a few minutes

### Users can't login after import
- Passwords are encrypted and should work
- Try resetting a password in cloud first
- Check auth middleware isn't blocking access

## Next Steps

After syncing:
1. Restart dev server: `npm run dev`
2. Try logging in with a cloud user
3. Verify your data is there
4. Continue development locally

## Automation

Add to CI/CD to regularly sync development environment:

```bash
# In your deploy script
CLOUD_DB_URL=$PROD_DB_URL npm run db:sync
```
