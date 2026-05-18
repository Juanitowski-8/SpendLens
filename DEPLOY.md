# Deploy SpendLens (Vercel + Render + PostgreSQL + Gmail OAuth)

Guía para publicar SpendLens sin romper el entorno local. Para desarrollo local, sigue [README.md](./README.md).

## Arquitectura

| Componente | Plataforma sugerida | URL ejemplo |
|------------|---------------------|-------------|
| Frontend | Vercel | `https://spendlens.vercel.app` |
| Backend API | Render / Railway / Fly.io | `https://spendlens-api.onrender.com` |
| PostgreSQL | Neon / Render / Railway | JDBC en `DATABASE_URL` |
| Gmail OAuth | Google Cloud Console | Redirect al backend público |

---

## 1. PostgreSQL (Neon / Render / Railway)

1. Crea una base PostgreSQL gestionada.
2. Obtén la URL JDBC (formato `jdbc:postgresql://host:5432/db?sslmode=require`).
   - Si el proveedor solo da `postgresql://...`, conviértela a JDBC o usa variables separadas (`DATABASE_USERNAME`, `DATABASE_PASSWORD`, host, puerto, nombre DB).
3. Flyway aplicará migraciones al arrancar el backend.

**Docker local (desarrollo):**

```powershell
docker compose up -d
```

Credenciales por defecto del compose: usuario `spendlens`, contraseña `spendlens`, base `spendlens`.

---

## 2. Backend (Render)

### Configuración del servicio

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

El frontend usa `import.meta.env.VITE_API_URL` y cae en `http://localhost:8081` si no está definida.

**Conectar Gmail:** el frontend llama a `GET /api/auth/gmail/connect-url` (con JWT) y redirige a Google.

---

## 4. Google Cloud (Gmail OAuth)

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita **Gmail API**.
3. Credenciales → **OAuth 2.0 Client ID** → tipo **Web application**.

### Authorized JavaScript origins

```
https://FRONTEND.vercel.app
http://localhost:5173
```

(Añade cada preview de Vercel si las usas, o un dominio custom.)

### Authorized redirect URIs

```
https://BACKEND_PUBLIC_URL/api/auth/gmail/callback
http://localhost:8081/api/auth/gmail/callback
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

## 5. Orden de despliegue recomendado

1. PostgreSQL + migraciones (al levantar backend).
2. Backend en Render con todas las env vars.
3. Probar `https://BACKEND/api/health`.
4. Frontend en Vercel con `VITE_API_URL`.
5. Actualizar Google OAuth con URLs públicas reales.
6. Probar registro, login, dashboard y **Conectar Gmail** (redirección a Google).

---

## 6. Desarrollo local (resumen)

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

## 7. Gmail (implementado)

- `GET /api/auth/gmail/connect-url` — requiere JWT; devuelve URL de Google con `state` firmado.
- `GET /api/auth/gmail/callback` — intercambia `code`, guarda tokens, redirige `?gmail=connected|error`.
- `POST /api/auth/gmail/sync` — importa correos recientes como gastos (`source: GMAIL`).

**Limitaciones:** parsing heurístico (sin LLM), deduplicación por comercio+monto+fecha, máx. 50 correos por sync, tokens en DB sin cifrado adicional.
