# Paperlantern

Paperlantern is a full-stack creator platform for publishing, reading, moderating, and monetizing comics, novels, and creator updates.

## Stack

- Client: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- Server: Laravel, Sanctum, queued jobs, repository/service application layers
- Tooling: ESLint, Prettier config, PHPUnit, Laravel Pint

## Repository Layout

```text
Paperlantern/
  client/                 React/Vite frontend
    src/
      api/                Axios clients and API modules
      components/         Shared UI, layout, navbar, search, profile, and modal pieces
      features/           Domain modules such as work, studio, admin, tickets, credits
      layouts/            Route shells for public and authenticated experiences
      pages/              Route-level static or generic pages
      routes/             Route definitions and lazy imports
      store/              Zustand stores
      utils/              Cross-feature helpers
  server/                 Laravel API
    app/
      Http/Controllers/   API and web controllers
      Models/             Eloquent models
      Repositories/       Persistence-focused data access
      Services/           Business workflows and integrations
    database/             Migrations, factories, seeders
    routes/               API, web, and console route entry points
    tests/                Feature and unit tests
```

## Local Setup

1. Install frontend dependencies:

    ```bash
    cd client
    npm install
    cp .env.example .env
    ```

2. Install backend dependencies:

    ```bash
    cd server
    composer install
    cp .env.example .env
    php artisan key:generate
    php artisan migrate
    php artisan storage:link
    ```

3. Return to the repository root and run the apps in separate terminals:

    ```bash
    npm run client:dev
    npm run server:serve
    ```

## Common Commands

Run these from the repository root:

```bash
npm run client:dev
npm run client:build
npm run client:lint
npm run server:serve
npm run server:migrate
npm run server:test
```

## Structure Rules

- Keep route-level screens in `client/src/pages` or the owning `client/src/features/<feature>/pages` folder.
- Keep feature-specific hooks, components, schemas, constants, and API clients inside their feature folder.
- Keep reusable shell pieces in `client/src/components/layout`.
- Keep reusable primitives in `client/src/components/ui`.
- Put backend business logic in services and persistence details in repositories.
- Keep controllers thin: validate input, call services, and return responses.

1. pageCustomizerRegistry.ts
2. createWidget default settings
3. useCommissions.ts
4. CommissionPageWidgetData
5. CommissionPageWidgets renderer
6. ExploreCommissions.tsx data passing
