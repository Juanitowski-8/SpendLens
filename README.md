# SpendLens (monorepo)

SpendLens convierte recibos y gastos en un dashboard financiero. Monorepo con **frontend** (React + Vite + TypeScript + Tailwind) y **backend** (Spring Boot 3 + PostgreSQL + Flyway + JWT).

## Desarrollo local

### 1. PostgreSQL

```powershell
docker compose up -d
```

Base: `spendlens`, usuario/contraseña: `spendlens` / `spendlens`.

### 2. Backend

```powershell
cd backend
# Opcional: copia application-local.properties.example → application-local.properties (Gmail OAuth local)
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

API: `http://localhost:8081`  
Health: `GET /api/health`

### 3. Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

En `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8081
```

### 4. Build

```powershell
cd frontend
npm run build

cd ..\backend
.\mvnw.cmd compile -DskipTests
```

## API principal (JWT)

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET|POST|DELETE /api/auth/expenses`
- `GET /api/auth/dashboard/summary`, `category-breakdown`, `recent-expenses`
- `POST /api/auth/imports/mock-receipts`, `parse-text`
- `GET /api/auth/gmail/connect-url` (JWT), `GET /api/auth/gmail/callback`, `POST /api/auth/gmail/sync`

## Deploy en producción

Ver **[DEPLOY.md](./DEPLOY.md)** (Vercel + Render/Railway/Fly.io + Neon + Google OAuth).

## Documentación

- `docs/FRONTEND_ENV.md` — variables del frontend
- `DROP_OFF.md` — notas de estado del proyecto
