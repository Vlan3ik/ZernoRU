# Исправление 404 на `/api/...`

Проблема: frontend вызывал `/api/portal/snapshot` и `/api/reference/...`, nginx проксировал запросы в backend, но backend возвращал `404`, потому что в `Zerno.Api` были подключены `MapControllers()`, а сами controllers/endpoints отсутствовали.

Что исправлено:

- добавлены Minimal API endpoints в `Backend/src/Zerno.Api/Program.cs`;
- добавлен `/api/health`;
- добавлены backend healthcheck и ожидание healthy backend в `docker-compose.yml`;
- сохранён быстрый dev-режим без `docker compose build --no-cache`;
- ускорен старт backend при плохой сети: внешние медиа-ассеты теперь не висят бесконечно, HTTP timeout ограничен 8 секундами.

Основные endpoints:

- `GET /api/portal/snapshot`
- `GET /api/reference/{category}`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/marketplace/lots/{lotId}`
- `GET /api/marketplace/auctions/{lotId}`
- `GET /api/marketplace/auctions/{lotId}/bids`
- `POST /api/marketplace/auctions/{lotId}/bids`
- `POST /api/marketplace/cart`
- `PATCH /api/marketplace/cart/{itemId}`
- `DELETE /api/marketplace/cart/{itemId}`
- `POST /api/marketplace/checkout`
- `POST /api/marketplace/grain`
- `POST /api/marketplace/equipment`
- `POST /api/forum/topics`
- `POST /api/forum/replies`
- `POST /api/seller-applications`
- `PATCH /api/seller-applications/{applicationId}/approve`
- `GET /api/subscriptions`
- `POST /api/subscriptions/activate`
- `GET /api/profile/me`
- `PUT /api/profile/me`
- `GET /api/admin/stats`
- `POST /api/logistics/quote`
- `GET /api/media/{objectKey}`

Запуск:

```bash
docker compose down
docker compose up -d --force-recreate
```

Проверка:

```bash
curl http://localhost:18081/api/health
curl http://localhost:18081/api/portal/snapshot
curl http://localhost:18081/api/reference/countries
```

Если frontend/npm volume был поломан после `ECONNRESET`:

```bash
docker compose down
docker volume rm zernoru_frontend_node_modules zernoru_frontend_npm_cache 2>/dev/null || true
docker compose up -d
```
