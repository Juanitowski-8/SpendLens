# DROP_OFF — Estado del proyecto

Última revisión: mayo 2026.

## Qué funciona hoy

- Autenticación JWT (registro, login, sesión en frontend).
- Recuperación de contraseña (token en BD; correo SMTP en producción si `MAIL_ENABLED=true`).
- Dashboard por mes con totales, categorías, gastos recientes y **gráficos con datos reales**.
- Gastos manuales, edición, eliminación y parseo de recibo por texto.
- Gmail OAuth (solo lectura), sync, status, disconnect, limpieza de sospechosos y recategorización.
- Conversión FX a COP en importación Gmail.
- Filtros avanzados en tabla y exportación CSV / Excel / PDF.
- Landing con pricing, legal (privacidad / términos) y deploy documentado (`DEPLOY.md`, `SECURITY.md`).

## Desarrollo local

```powershell
docker compose up -d
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

`VITE_API_URL=http://localhost:8081`

En local, el enlace de reset de contraseña se imprime en los logs del backend.

## Producción (Render + Vercel)

- Backend: variables en `DEPLOY.md` (DB, JWT, Gmail OAuth, **MAIL_***).
- Frontend: `VITE_API_URL` = URL pública del API.
- Tras cada deploy importante: redeploy manual si no hay auto-deploy.

## Pendiente / roadmap

- Gráficos históricos multi-mes en una sola vista.
- Rate limiting y observabilidad (Sentry, etc.).
- Planes de pago reales (pricing actual es informativo).
- Cuentas multi-usuario / familias.

## Notas

- Carpetas `frontend/src_backup_before_v0/` y `frontend/v0-reference/` están en `.gitignore`.
- Tests: `.\mvnw.cmd test` usa H2 en memoria (no requiere Docker).
