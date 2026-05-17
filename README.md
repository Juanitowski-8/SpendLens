# SpendLens (monorepo)

This repository contains two workspaces: `frontend/` and `backend/` (backend scaffold not yet added).

Frontend: a Vite + React + TypeScript app located in `frontend/`.

To build the frontend:

1. cd frontend
2. npm install
3. npm run build

## Run locally

1. Start PostgreSQL:

   ```powershell
   docker compose up -d
   ```

2. Start the backend:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

3. Start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. Environment variables:

   - Review `docs/FRONTEND_ENV.md`
   - Copy `frontend/.env.example` to `frontend/.env.local` if needed
   - Set `VITE_API_URL=http://localhost:8081`

5. Current temporary routes:

   - GET `/api/auth/expenses`
   - POST `/api/auth/expenses`
   - GET `/api/auth/dashboard/summary`
   - GET `/api/auth/dashboard/category-breakdown`
   - GET `/api/auth/dashboard/recent-expenses`
