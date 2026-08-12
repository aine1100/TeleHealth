# Docker Compose — Alive Health UG

## Recommended: single app (API + React)

```bash
cp .env.example .env
docker compose up -d --build
```

Open **http://localhost:5000**

On first boot the app waits for MongoDB, then **seeds demo users**, then starts the API.

### Demo logins (seeded automatically)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@alivehealth.ug` | `Admin@123` |
| Clinic | `clinic@alivehealth.ug` | `Demo@123` |
| Doctor | `doctor@alivehealth.ug` | `Demo@123` |
| Patient | `patient@alivehealth.ug` | `Demo@123` |
| Lab | `lab@alivehealth.ug` | `Demo@123` |
| Insurance | `insurance@alivehealth.ug` | `Demo@123` |
| Pharmacy | `pharmacy@alivehealth.ug` | `Demo@123` |

Also seeded: `doctor2@…`, `doctor3@…`, `patient2@…`, `patient3@…` (same `Demo@123`).

Re-run seed anytime:
```bash
docker compose run --rm seed
```

Disable auto-seed: set `SEED_ON_BOOT=false` in `.env`.

| Service | Port | Purpose |
|---------|------|---------|
| `app`   | 5000 | Express serves React + `/api` + Socket.IO (+ seed on boot) |
| `mongo` | 27017 | MongoDB 7 |

## Optional split stack

```bash
docker compose --profile split up -d --build
```

## Render (single Web Service)

See **[RENDER.md](./RENDER.md)**. For Render, run seed once via shell: `node backend/database/seed.js` (with `MONGODB_URI` set), or set `SEED_ON_BOOT=true` if using the Docker image.
