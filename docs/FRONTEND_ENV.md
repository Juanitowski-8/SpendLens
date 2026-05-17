**Frontend Environment**

- **VITE_API_URL**: Base URL for the backend API used by the frontend. Default used in development is `http://localhost:8081`.

Setup

- Copy the example file into a local env file (PowerShell):

  ```powershell
  cd frontend
  Copy-Item .env.example .env.local
  ```

- Start dev server:

  ```powershell
  npm install
  npm run dev
  ```

- Build for production:

  ```powershell
  npm run build
  ```

Notes

- Vite exposes only variables prefixed with `VITE_` to the client. Do not store secrets here.
- If you run the backend on another host or port, update `VITE_API_URL` accordingly.
