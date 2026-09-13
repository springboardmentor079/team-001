# BuildTrack Frontend (Milestone 1)

Angular 17 (standalone components) frontend for the BuildTrack construction management platform.

## Stack

Angular · TypeScript · Angular Material · Bootstrap 5 grid utilities · RxJS · Reactive Forms

## Prerequisites

- Node.js 18+ and npm
- The BuildTrack backend running locally (default: `http://localhost:8000`)

## Setup

```bash
cd frontend
npm install
npm start
```

The app runs at **http://localhost:4200** and expects the API at `http://localhost:8000/api/v1`
(configured in `src/environments/environment.ts`).

## Project layout

```
src/app/
  core/
    models/        TypeScript interfaces mirroring backend schemas
    services/       AuthService, UserService, DashboardService, ApiService
    guards/         authGuard, roleGuard
    interceptors/   authInterceptor (attaches JWT, handles 401s)
  shared/
    components/     navbar, sidebar, loading, unauthorized, stat-card
  features/
    auth/           login, register, forgot-password, reset-password
    dashboard/       one component per role + shared authenticated layout shell
    profile/         view/update own profile
    projects/        read-only project list (role-scoped)
    admin/           admin-only user management screen
    coming-soon/      placeholder for modules planned for a later milestone
  app.routes.ts       route table (guards, lazy-loaded standalone components)
  app.config.ts       providers: router, HttpClient + interceptor, animations
```

## Demo accounts

See the root `README.md` for demo credentials (password: `Password123!`).

## Building for production

```bash
npm run build
```

Output is written to `dist/buildtrack-frontend`.
