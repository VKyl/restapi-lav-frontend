# KMArtists — Frontend

React + Vite frontend for the KMArtists music forum (artist wiki, events, Find Band).

## Requirements

- Node.js 18 or newer (20+ recommended)
- The KMArtists backend API running locally

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Point the dev server at your backend. Copy the example env file and set the API address:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_API_PROXY_TARGET=http://127.0.0.1:8000/kmartists
   ```

   In development, every request to `/api/*` is forwarded to this address with the `/api` prefix removed, so `/api/artists/` becomes `http://127.0.0.1:8000/kmartists/artists/`. This also avoids CORS issues.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173.

## Scripts

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload          |
| `npm run build`   | Build for production into `dist/`             |
| `npm run preview` | Serve the production build locally            |

## Production build

The `/api` proxy only exists in the dev server. For a production build, set `VITE_API_URL` to the backend's public address before building:

```bash
VITE_API_URL=https://api.example.com npm run build
```

The backend must then allow requests from the frontend's origin (CORS).

## Project structure

```
src/
  api/client.js      API calls and error handling
  components/        Shared UI (layout, logo, forms, pagination, dialogs)
  hooks/             Data fetching and URL-synced filters
  pages/             One file per route
  utils/             Date formatting and form error helpers
  styles.css         Theme and all styles
```

## Notes

- Find Band and user profile pages call the `/users/...` endpoints. Until the backend provides them, these pages show a "not live yet" message.
