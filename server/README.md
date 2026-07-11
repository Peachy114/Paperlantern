# Paperlantern Server

Laravel API for Paperlantern authentication, publishing, reading, wallet credits, earnings, moderation, announcements, and support tickets.

## Application Layout

```text
app/
  Console/Commands/        Maintenance and scheduled commands
  Exports/                 Excel and report exports
  Http/
    Controllers/Api/       JSON API controllers
    Middleware/            Request guards and role checks
    Requests/              Form request validation
  Mail/                    Mailables
  Models/                  Eloquent models
  Observers/               Model side-effect hooks
  Providers/               App and repository bindings
  Repositories/            Database access and query composition
  Services/                Business workflows and integrations
database/
  factories/               Model factories
  migrations/              Schema history
  seeders/                 Local/demo data
routes/
  api.php                  API routes
  web.php                  Web routes
  console.php              Scheduled and console routes
tests/
  Feature/                 HTTP and workflow tests
  Unit/                    Unit tests
```

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
```

## Development

```bash
php artisan serve
php artisan queue:listen --tries=1 --timeout=0
php artisan pail --timeout=0
```

The Composer `dev` script runs the HTTP server, queue listener, logs, and Vite together for Laravel-served assets.

```bash
composer dev
```

## Testing And Quality

```bash
php artisan test
vendor/bin/pint
```

## Conventions

- Controllers should stay thin and delegate business work to services.
- Services should coordinate workflows, transactions, external integrations, and repository calls.
- Repositories should own database access and query details.
- Use form requests for reusable validation.
- Add migrations for every schema change and keep seeders safe to rerun.

