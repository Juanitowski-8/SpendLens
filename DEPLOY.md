# Deploy SpendLens (Vercel + Render + PostgreSQL + Gmail OAuth)

Guía para publicar SpendLens sin romper el entorno local. Para desarrollo local, sigue [README.md](./README.md).

## Arquitectura

| Componente | Plataforma sugerida | URL ejemplo |
|------------|---------------------|-------------|
| Frontend | Vercel | `https://spendlens.vercel.app` |
| Backend API | Render / Railway / Fly.io | `https://spendlens-api.onrender.com` |
| PostgreSQL | **Render PostgreSQL** (recomendado si usas Render API) | `DATABASE_URL` auto o JDBC |
| Gmail OAuth | Google Cloud Console | Redirect al backend público |

---

## 1. PostgreSQL en Render (recomendado)

### Crear la base

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **PostgreSQL**.
2. Elige nombre, región (la **misma** que el backend) y plan.
3. Espera a que el estado sea **Available**.

### Conectar al backend (forma más fácil)

1. Crea o abre tu **Web Service** del backend (`spendlens-api`).
2. **Environment** → **Add from database** (o **Link database**) → selecciona tu Postgres de Render.
3. Render inyecta automáticamente `DATABASE_URL` (formato `postgres://user:pass@host/db`).

El backend convierte esa URL a JDBC al arrancar (`RenderDatabaseEnvironmentPostProcessor`). **No necesitas** pegar JDBC a mano si usas el link de Render.

### Si configuras la URL manualmente

Render muestra **Internal Database URL** (desde otro servicio Render) y **External** (desde fuera).

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | `jdbc:postgresql://HOST:5432/DBNAME?sslmode=require` |

O deja `DATABASE_URL` como `postgres://...` del panel y el backend la normaliza.

| `DATABASE_USERNAME` | Solo si no usas link automático |
| `DATABASE_PASSWORD` | Solo si no usas link automático |

Flyway crea las tablas en el **primer deploy** exitoso del backend.

### Alternativa: Neon / Railway

Misma idea: JDBC `jdbc:postgresql://host:5432/db?sslmode=require` + usuario + contraseña.

**Docker local (desarrollo):**

```powershell
docker compose up -d
```

Credenciales por defecto del compose: usuario `spendlens`, contraseña `spendlens`, base `spendlens`.

---

## 2. Backend (Render)

### Opción A — Docker (recomendado, `Dockerfile` en la raíz del repo)

| Campo | Valor |
|-------|--------|
| **Runtime** | Docker |
| **Dockerfile Path** | `./Dockerfile` |
| **Root Directory** | *(vacío — raíz del repo)* |
| **Health Check Path** | `/api/health` |

### Opción B — Java nativo

| Campo | Valor |
|-------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `./mvnw clean package -DskipTests` |
| **Start Command** | `java -jar target/backend-0.0.1-SNAPSHOT.jar` |

En Windows local el wrapper es `mvnw.cmd`; en Render/Linux usa `./mvnw`.

### Variables de entorno (Render)

| Variable | Obligatoria | Ejemplo / notas |
|----------|-------------|-----------------|
| `PORT` | Auto en Render | Render la inyecta; default local `8081` |
| `DATABASE_URL` | Sí | `jdbc:postgresql://...` |
| `DATABASE_USERNAME` | Si no va en URL | usuario DB |
| `DATABASE_PASSWORD` | Si no va en URL | contraseña DB |
| `JWT_SECRET` | Sí | string largo aleatorio (≥ 32 caracteres) |
| `JWT_EXPIRATION_MS` | No | `86400000` |
| `FRONTEND_URL` | Sí | `https://tu-app.vercel.app` (sin barra final) |
| `GOOGLE_GMAIL_CLIENT_ID` | Sí (OAuth) | Client ID de Google Cloud |
| `GOOGLE_GMAIL_CLIENT_SECRET` | Sí (OAuth) | Client secret |
| `GOOGLE_GMAIL_REDIRECT_URI` | Sí | `https://BACKEND_PUBLIC_URL/api/auth/gmail/callback` |
| `GOOGLE_GMAIL_SCOPES` | No | `https://www.googleapis.com/auth/gmail.readonly` |

**Health check:** `GET /api/health`

### Railway / Fly.io

Mismas variables y comandos. Ajusta `PORT` según la plataforma.

---

## 3. Frontend (Vercel)

### Configuración del proyecto

| Campo | Valor |
|-------|--------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Variables de entorno (Vercel)

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://BACKEND_PUBLIC_URL` (sin `/` final) |

El frontend usa `import.meta.env.VITE_API_URL`. En desarrollo, si falta, usa `http://localhost:8081`. En producción (Vercel) **debes** definir `VITE_API_URL` o login y dashboard no funcionarán.

Opcional: el repo incluye `frontend/vercel.json` (Vite + SPA rewrite).

**Conectar Gmail:** el frontend llama a `GET /api/auth/gmail/connect-url` (con JWT) mediante `connectGmail()` y redirige a Google.

---

## 4. Google Cloud (Gmail OAuth)

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita **Gmail API**.
3. Credenciales → **OAuth 2.0 Client ID** → tipo **Web application**.

### Authorized JavaScript origins

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
https://TU-FRONTEND.vercel.app
```

(Añade cada preview de Vercel si las usas, o un dominio custom.)

### Authorized redirect URIs

```
http://localhost:8081/api/auth/gmail/callback
https://TU-BACKEND.onrender.com/api/auth/gmail/callback
```

`BACKEND_PUBLIC_URL` debe coincidir exactamente con `GOOGLE_GMAIL_REDIRECT_URI` (sin path distinto).

### Local

Copia `backend/src/main/resources/application-local.properties.example` a `application-local.properties` (gitignored) y arranca con:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

O define `GOOGLE_GMAIL_*` como variables de entorno.

---

## 5. Seguridad (obligatorio antes de publicar)

- **Nunca** subas `application-local.properties` (está en `.gitignore`).
- **Nunca** subas `.env`, `.env.local` ni pegues el **client secret** en README, commits o chat público.
- Usa **variables de entorno** en Render y Vercel (`JWT_SECRET`, `GOOGLE_GMAIL_*`, `DATABASE_*`).
- En producción define un `JWT_SECRET` largo y aleatorio (no el default del repo).
- `GOOGLE_GMAIL_REDIRECT_URI` debe coincidir **carácter por carácter** con la URI autorizada en Google Cloud.
- El JWT filter **no** excluye `/api/auth/gmail/connect-url` ni `/sync` (requieren Bearer); solo el **callback** es público.

### Validación local

```powershell
cd frontend
npm run build

cd ..\backend
.\mvnw.cmd -q test-compile
```

---

## 6. Stack completo (Vercel ya desplegado)

Si tu frontend ya está en Vercel (ej. `https://spend-lens-pearl.vercel.app`), completa en este orden:

### A. PostgreSQL en Render

1. **New +** → **PostgreSQL** (misma región que el API).
2. Anota usuario, contraseña y nombre de base.

### B. Web Service (backend)

1. **New +** → **Web Service** → repo **SpendLens**.
2. **Runtime: Docker** → Dockerfile `./Dockerfile` (raíz del repo).
3. **Link database** → tu Postgres de Render.
4. **Environment** (completa):

```env
DATABASE_URL=jdbc:postgresql://HOST:5432/DATABASE?sslmode=require
DATABASE_USERNAME=USER
DATABASE_PASSWORD=PASSWORD
JWT_SECRET=genera-un-guid-largo
JWT_EXPIRATION_MS=86400000
FRONTEND_URL=https://spend-lens-pearl.vercel.app
GOOGLE_GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_GMAIL_CLIENT_SECRET=tu-client-secret
GOOGLE_GMAIL_REDIRECT_URI=https://TU-SERVICIO.onrender.com/api/auth/gmail/callback
GOOGLE_GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly
```

5. Deploy → prueba `https://TU-SERVICIO.onrender.com/api/health` → `UP`.

### C. Vercel (conectar al backend)

1. **Settings** → **Environment Variables**:
   ```env
   VITE_API_URL=https://TU-SERVICIO.onrender.com
   ```
2. **Deployments** → **Redeploy** (obligatorio: Vite embebe la variable en el build).
3. El banner amarillo debe desaparecer; login debe llamar a Render, no a Vercel.

### D. Google OAuth

- **JavaScript origins:** `https://spend-lens-pearl.vercel.app`, `http://localhost:5173`
- **Redirect URI:** `https://TU-SERVICIO.onrender.com/api/auth/gmail/callback`

### E. Prueba final

1. Abre Vercel → **Registro** (cuenta nueva en DB de Render).
2. **Login** → **Dashboard** → crear gasto.
3. **Conectar Gmail** → **Sincronizar Gmail**.

---

## 7. Paso a paso: Render PostgreSQL + Render API + Vercel (primera vez)

Tu Docker local **solo sirve en tu PC**. Orden recomendado:

### Paso A — PostgreSQL en Render (5 min)

1. **New PostgreSQL** en Render (misma región que usarás para el API).
2. Anota el nombre del recurso (ej. `spendlens-db`).

### Paso B — Backend en Render (10–15 min)

1. [render.com](https://render.com) → **New** → **Web Service** → conecta GitHub (repo SpendLens).
2. Configuración:

   | Campo | Valor |
   |-------|--------|
   | Root Directory | `backend` |
   | Runtime | Java |
   | Build Command | `./mvnw clean package -DskipTests` |
   | Start Command | `java -jar target/backend-0.0.1-SNAPSHOT.jar` |
   | Health Check Path | `/api/health` |

   (Opcional: **New → Blueprint** si subiste `render.yaml` en la raíz.)

3. **Environment**:
   - **Link database** → elige tu Postgres de Render (inyecta `DATABASE_URL` solo).
   - Añade el resto manualmente:

   ```env
   JWT_SECRET=genera-un-string-largo-aleatorio-minimo-32-caracteres
   JWT_EXPIRATION_MS=86400000
   FRONTEND_URL=https://TU-PROYECTO.vercel.app
   GOOGLE_GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_GMAIL_CLIENT_SECRET=tu-client-secret
   GOOGLE_GMAIL_REDIRECT_URI=https://TU-SERVICIO.onrender.com/api/auth/gmail/callback
   GOOGLE_GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly
   ```

   **Importante:** `GOOGLE_GMAIL_REDIRECT_URI` y la URL pública del servicio Render deben coincidir.  
   `FRONTEND_URL` la actualizarás en el paso C si aún no tienes la URL de Vercel (puedes poner un placeholder y corregir después).

4. **Deploy** → espera build verde → abre:

   ```text
   https://TU-SERVICIO.onrender.com/api/health
   ```

   Debe responder sin error 401/500. Flyway crea las tablas en el primer arranque.

   **Plan free:** el servicio se “duerme”; la primera petición puede tardar ~30–60 s.

### Paso C — Frontend en Vercel (5 min)

1. [vercel.com](https://vercel.com) → **Add New Project** → importa el mismo repo.
2. Configuración:

   | Campo | Valor |
   |-------|--------|
   | Root Directory | `frontend` |
   | Framework | Vite |
   | Build | `npm run build` |
   | Output | `dist` |

3. **Environment Variables:**

   ```env
   VITE_API_URL=https://TU-SERVICIO.onrender.com
   ```

   Sin barra final. **Redeploy** después de guardar.

4. Copia la URL de producción, ej. `https://spendlens-xxx.vercel.app`.

5. Vuelve a **Render** → Environment → actualiza:

   ```env
   FRONTEND_URL=https://spendlens-xxx.vercel.app
   ```

   Guarda y **Manual Deploy** si hace falta.

### Paso D — Google OAuth (5 min)

En [Google Cloud Console](https://console.cloud.google.com/) → tu OAuth Client (Web):

**Authorized JavaScript origins**

```text
https://spendlens-xxx.vercel.app
http://localhost:5173
```

**Authorized redirect URIs**

```text
https://TU-SERVICIO.onrender.com/api/auth/gmail/callback
http://localhost:8081/api/auth/gmail/callback
```

Las mismas credenciales (`CLIENT_ID` / `SECRET`) van en Render como `GOOGLE_GMAIL_*`.

### Paso E — Prueba desde otra PC o móvil

1. Abre la URL de Vercel (no `localhost`).
2. **Registro** → **Login** → **Dashboard**.
3. Crear gasto / importar mock.
4. **Conectar Gmail** (logueado) → Google → vuelve con `?gmail=connected`.
5. **Sincronizar Gmail** en el dashboard.

Si login falla: revisa `VITE_API_URL` en Vercel y CORS (`FRONTEND_URL` en Render).

---

## 8. Orden de despliegue recomendado (resumen)

1. PostgreSQL en Render (+ link al Web Service).
2. Backend en Render con todas las env vars.
3. Probar `https://BACKEND/api/health`.
4. Frontend en Vercel con `VITE_API_URL`.
5. Actualizar `FRONTEND_URL` en Render y Google OAuth.
6. Probar registro, login, dashboard y **Conectar Gmail**.

---

## 9. Desarrollo local (resumen)

```powershell
docker compose up -d
cd backend
$env:SPRING_PROFILES_ACTIVE="local"   # si usas application-local.properties
.\mvnw.cmd spring-boot:run

cd ..\frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

`frontend/.env.local`:

```
VITE_API_URL=http://localhost:8081
```

CORS permite `http://localhost:*`, `https://*.vercel.app` y el valor de `FRONTEND_URL`.

---

## 10. Gmail (implementado)

- `GET /api/auth/gmail/connect-url` — requiere JWT; devuelve URL de Google con `state` firmado.
- `GET /api/auth/gmail/callback` — intercambia `code`, guarda tokens, redirige `?gmail=connected|error`.
- `POST /api/auth/gmail/sync` — importa correos recientes como gastos (`source: GMAIL`).

**Limitaciones:** parsing heurístico (sin LLM), deduplicación por comercio+monto+fecha, máx. 50 correos por sync, tokens en DB sin cifrado adicional.
