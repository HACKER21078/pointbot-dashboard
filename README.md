# PointBot Dashboard

Web dashboard for configuring your PointBot Discord bot.

## Features

- Login with Discord (OAuth2)
- Automatically shows only servers where **you** have Administrator
- Settings (daily points, cooldown, event points)
- Rank management (points thresholds + nickname prefixes)
- Points manager (leaderboard + add/remove points)
- Roblox integration (API key, Group ID, join-request channel)
- Shares the **same MySQL database** as your bot

## Setup

### 1. Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Under **OAuth2 → Redirects** add:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
   (For production add your real domain too)
4. Copy the **Client ID** and **Client Secret**

### 2. Environment variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_long_random_string

DB_HOST=127.0.0.1
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Production

- Set `NEXTAUTH_URL` to your real domain
- Add the production callback URL in the Discord Developer Portal
- Deploy to Vercel, Railway, Render, etc.
- Make sure the server can reach your MySQL database

## Security notes

- Every API request re-checks that the logged-in user still has Administrator in the target guild
- Roblox API keys are never sent fully to the browser (only a masked version)
- The dashboard only writes to the same tables the bot already uses

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Login page
│   ├── dashboard/               # Main dashboard
│   │   └── [guildId]/
│   │       ├── settings/
│   │       ├── ranks/
│   │       ├── points/
│   │       └── roblox/
│   └── api/                     # Backend routes
├── lib/
│   ├── auth.ts                  # NextAuth config
│   ├── db.ts                    # MySQL pool
│   ├── discord.ts               # Discord API helpers
│   └── guild.ts                 # Settings / points helpers
└── components/
```

## Requirements

- Node.js 18+
- Access to the same MySQL database your PointBot uses
- Discord application with `identify` + `guilds` scopes
