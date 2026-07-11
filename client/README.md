# Paperlantern Client

React/Vite frontend for the Paperlantern reader, studio, wallet, support, and admin experiences.

## Source Layout

```text
src/
  api/                  HTTP clients and endpoint modules
  assets/               Static assets imported by the app
  components/
    layout/             App shell pieces such as nav, footer, subscribe section
    navbar/             Navbar views and interaction wrappers
    profile/            Profile menu and profile display components
    search/             Shared search UI
    shared/             Cross-feature modals and loading states
    ui/                 Reusable UI primitives
  features/
    admin/              Admin dashboard, moderation, users, tickets, withdrawals
    announcements/      Announcement display and fetching logic
    auth/               Login, registration, and creator application flows
    credits/            Wallet credit purchase UI
    settings/           Account and profile settings
    studio/             Creator studio work, chapter, earnings, and sticky-note tools
    tickets/            User support tickets
    transactions/       Wallet and earnings transaction views
    work/               Public discovery, reading, and work detail pages
  hooks/                Truly cross-feature hooks
  layouts/              Public and authenticated route shells
  lib/                  Shared library helpers
  pages/                Generic route-level pages
  routes/               Route registration and lazy imports
  store/                Zustand stores
  types/                Shared TypeScript types
  utils/                Shared utilities
```

## Environment

Create `client/.env` from `client/.env.example`.

```bash
VITE_API_URL=http://127.0.0.1:8000/api
VITE_API_URL_PROD=https://laterncomix.com/api
```

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Conventions

- Use `@/` imports for source modules.
- Put new feature code under `src/features/<feature>`.
- Use `src/components/ui` only for reusable primitives.
- Prefer colocating feature-specific hooks and components with the feature that owns them.
- Keep route files small; move view logic into feature components and hooks.

