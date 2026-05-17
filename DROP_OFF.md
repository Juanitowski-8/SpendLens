# DROP_OFF

## Estado actual del proyecto

- Backend Spring Boot en `backend/` compila correctamente y corre en `http://localhost:8081`.
- Frontend Vite + React en `frontend/` compila correctamente y consume el backend real.
- PostgreSQL corre en Docker y se levanta con `docker compose up -d`.
- Hay dashboard real y gastos reales cargados desde el backend.
- El formulario de crear gasto manual funciona contra `POST /api/auth/expenses`.
- Existen `frontend/.env.example` y `docs/FRONTEND_ENV.md`.
- `README.md` ya está actualizado con pasos de arranque y rutas.

## Qué funciona

- GET `/api/auth/expenses`
- POST `/api/auth/expenses`
- GET `/api/auth/dashboard/summary`
- GET `/api/auth/dashboard/category-breakdown`
- GET `/api/auth/dashboard/recent-expenses`

## Cómo correr Docker/PostgreSQL

```powershell
cd c:\Users\Juane\Downloads\SpendLens\SpendLens
docker compose up -d
```

## Cómo correr el backend

```powershell
cd c:\Users\Juane\Downloads\SpendLens\SpendLens\backend
.\mvnw.cmd spring-boot:run
```

## Cómo correr el frontend

```powershell
cd c:\Users\Juane\Downloads\SpendLens\SpendLens\frontend
npm install
npm run dev
```

## Variables de entorno

- Revisar `docs/FRONTEND_ENV.md`
- Copiar `frontend/.env.example` a `frontend/.env.local` si hace falta
- `VITE_API_URL=http://localhost:8081`

## Qué falta

- Seguridad JWT final completa
- Integración de Gmail real
- Integración LLM real
- Deploy/infra de producción

## Notas importantes

- Actualmente los endpoints son temporales bajo `/api/auth`.
- En modo desarrollo se usa el usuario fijo `juano@test.com`.
- No se deben cambiar migraciones, `SecurityConfig` ni `JwtAuthenticationFilter` en esta etapa.
- Hay carpetas de referencia/backup en `frontend/` como `src_backup_before_v0` y `v0-reference`.
- En el nivel raíz también existe `src/` y una carpeta `public/` vacía; estas parecen ser artefactos o duplicados legados y no han sido eliminadas.
