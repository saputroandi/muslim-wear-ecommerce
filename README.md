# Muslim Wear Ecommerce - Starter

Starter project ecommerce berbasis **NestJS + MVC + PostgreSQL + Docker** untuk mengeksekusi roadmap bertahap pada issue:
https://github.com/saputroandi/muslim-wear-ecommerce/issues/1

> Scope repository saat ini hanya fondasi/starter. Fitur roadmap belum diimplementasikan.

## Stack

- **Backend:** NestJS (modular monolith, MVC)
- **View engine:** Handlebars (`hbs`)
- **Database:** PostgreSQL (TypeORM)
- **Containerization:** Docker + Docker Compose
- **Design starter UI:** mengikuti token dark-first dari `DESIGN.md`

## Struktur Utama

```txt
src/
  app.module.ts
  config/
  modules/
    admin/
    auth/
    catalog/
    checkout/
    health/
    marketing/
    orders/
    payments/
    storefront/
  persistence/entities/
public/css/design.css
views/
  home.hbs
  products.hbs
  admin.hbs
docker-compose.yml
Dockerfile
```

## Menjalankan Lokal (tanpa Docker)

1. Copy environment:

```bash
cp .env.example .env
```

2. Jalankan PostgreSQL sendiri (lokal) atau pakai Docker DB.

3. Start app:

```bash
npm install
npm run start:dev
```

4. Endpoint utama:

- `GET /` storefront starter
- `GET /products` katalog starter
- `GET /admin` admin starter
- `GET /health` health check

API placeholder roadmap:

- `GET /api/auth/starter-status`
- `GET /api/catalog/starter-status`
- `GET /api/checkout/starter-status`
- `GET /api/payments/starter-status`
- `GET /api/orders/starter-status`
- `GET /api/marketing/starter-status`

## Menjalankan Dengan Docker

```bash
docker compose up --build
```

Service yang jalan:
- App: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Scripts

```bash
npm run build
npm run start:dev
npm run start:prod
npm run lint
npm run test
```

## Catatan Arsitektur Starter

- Pattern: **Modular Monolith** (cocok untuk 1 admin + fase awal)
- Tiap domain roadmap sudah punya modul terpisah agar implementasi bisa bertahap dan minim konflik.
- Entitas dasar sudah disiapkan (`AdminUser`, `Product`, `Order`) sebagai baseline skema data.
