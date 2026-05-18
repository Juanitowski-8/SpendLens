# Seguridad — SpendLens

## Secretos y configuración

- **Nunca** subas a Git: `application-local.properties`, `.env`, `.env.local`, client secrets, contraseñas de base de datos ni `JWT_SECRET` reales.
- Usa variables de entorno en **Render** (backend) y **Vercel** (`VITE_API_URL` en frontend).
- `application-local.properties` y `.env*` están en `.gitignore`.

## Rotación de credenciales (si se expusieron)

1. **DATABASE_PASSWORD (Render Postgres):** genera nueva contraseña en el panel de Render → actualiza `DATABASE_PASSWORD` en el Web Service → redeploy.
2. **JWT_SECRET:** genera un string aleatorio largo (≥ 32 caracteres) → actualiza en Render → los usuarios deberán volver a iniciar sesión.
3. **GOOGLE_GMAIL_CLIENT_SECRET:** revoca/regenera en [Google Cloud Console](https://console.cloud.google.com/) → actualiza en Render → usuarios reconectan Gmail.

## OAuth Gmail

- Permisos de **solo lectura** (`gmail.readonly`).
- Los tokens de acceso/refresh se almacenan en PostgreSQL; **no** se devuelven al frontend.
- El usuario puede **desconectar** Gmail desde el dashboard.

## Producción recomendada

- Definir `JWT_SECRET` fuerte (no el valor por defecto del repo).
- `FRONTEND_URL` y `VITE_API_URL` alineados entre Render y Vercel.
- Google OAuth: orígenes y redirect URIs de producción en Google Console.
- Considerar en el futuro: rate limiting, monitoreo (Sentry/Datadog), auditoría de logs.

## Correo (recuperación de contraseña)

- Variables SMTP en Render: `MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`.
- Si rotas la contraseña SMTP, actualiza `MAIL_PASSWORD` y redeploy.
- En local (`SPRING_PROFILES_ACTIVE=local`) el enlace de reset puede aparecer en logs; no uses eso en producción.

## Logs

- No registrar tokens JWT completos, refresh tokens de Gmail ni contraseñas.
- El servicio de recuperación solo registra URLs de reset cuando el correo SMTP no está activo y el perfil es local/desarrollo.

## Contacto

Para reportes de seguridad, contacta al mantenedor del repositorio de forma privada.
