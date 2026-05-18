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
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET|POST|PUT|DELETE /api/auth/expenses`
- `GET /api/auth/dashboard/summary?year=&month=`, `category-breakdown`, `recent-expenses`
- `POST /api/auth/imports/mock-receipts`, `parse-text`
- `GET /api/auth/gmail/connect-url`, `GET /api/auth/gmail/callback`, `POST /api/auth/gmail/sync`
- `GET /api/auth/gmail/status`, `DELETE /api/auth/gmail/disconnect`
- `GET|DELETE /api/auth/gmail/suspicious-transactions`, `POST /api/auth/gmail/recategorize`

## Funcionalidades

- Dashboard por mes con totales en COP
- Importación Gmail (OAuth solo lectura), validación de montos, categorías y FX
- Gastos manuales, edición, eliminación y procesamiento de recibo por texto
- Filtros avanzados en tabla y exportación CSV / Excel / PDF
- Recuperación de contraseña y desconexión de Gmail

## Recuperación de contraseña (correo)

En **producción** (Render), configura SMTP:

| Variable | Ejemplo |
|----------|---------|
| `MAIL_ENABLED` | `true` |
| `MAIL_HOST` | `smtp.sendgrid.net` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | credenciales del proveedor |
| `MAIL_FROM` | remitente verificado |

En **local**, el enlace de reset se imprime en los logs del backend si no activas SMTP.

## Deploy en producción

Ver **[DEPLOY.md](./DEPLOY.md)** (Vercel + Render + Neon + Google OAuth + SMTP).

Tras cada push a `master`:

1. **Vercel**: redeploy del frontend con `VITE_API_URL` apuntando al backend.
2. **Render**: redeploy del backend (aplica migraciones Flyway V5+).

## Documentación

- `DEPLOY.md` — pasos de despliegue
- `SECURITY.md` — secretos, OAuth y rotación
- `docs/FRONTEND_ENV.md` — variables del frontend
