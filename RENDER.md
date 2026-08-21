# Deploy Alive Health UG as ONE Render Web Service

UI + API + Socket.IO all run on the **same URL** (same origin), so they communicate without `REACT_APP_API_URL`.

```
https://your-app.onrender.com          → React app
https://your-app.onrender.com/api/...  → Express API
https://your-app.onrender.com/socket.io → WebRTC / chat sockets
```

## Render settings

Create **one Web Service** from this repo:

| Setting | Value |
|---------|--------|
| Language | Node |
| **Root Directory** | *(leave empty — repo root)* |
| Build Command | `npm run build:render` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### Environment variables

```env
NODE_ENV=production
HOST=0.0.0.0

MONGODB_URI=mongodb+srv://USER:PASS@cluster/alive_health
JWT_SECRET=long-random-secret
JWT_EXPIRE=7d
MOCK_PAYMENTS=true

PLATFORM_URL=https://YOUR-SERVICE.onrender.com
FRONTEND_URL=https://YOUR-SERVICE.onrender.com
CORS_ORIGIN=https://YOUR-SERVICE.onrender.com

# Cloudflare R2 (public CDN for uploads)
# R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET_NAME=afyalink
R2_PUBLIC_URL=https://pub-ae342959899f40b29244cada8abbbafe.r2.dev

# Web Push for medicine reminders (browser / phone)
# VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_SUBJECT=mailto:support@alivehealth.ug

# Seed demo users once (or via shell). Prefer shell on Render free tier.
SEED_ON_BOOT=false
ADMIN_EMAIL=admin@alivehealth.ug
ADMIN_PASSWORD=Admin@123
DEMO_PASSWORD=Demo@123
```

**Do not set `REACT_APP_API_URL`** for single-service hosting.

After first deploy, seed from Render Shell:
```bash
node backend/database/seed.js
```

Or use Docker runtime with `SEED_ON_BOOT=true`.

## MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/atlas) (or any hosted Mongo).  
Allow network access from anywhere (`0.0.0.0/0`) or Render’s IPs.

## After deploy

1. Open `https://YOUR-SERVICE.onrender.com/api/health` → should return `"Ok"`
2. Open `https://YOUR-SERVICE.onrender.com` → app UI
3. Optional seed admin:
   ```bash
   # From Render shell, or locally with same MONGODB_URI:
   npm run seed
   ```

## Optional: Docker on Render

If you prefer Docker runtime:

- Dockerfile path: `./Dockerfile` (repo root)
- Same env vars as above
- Start command is already in the image (`node server.js`)

## Local check of the single-service build

```bash
npm run build:render
npm start
# open http://localhost:5000
```
