# ZernoRU

Полноценный full-stack портал для рынка зерна: витрина лотов, новости, цены, логистика, форум, личный кабинет, подписки, уведомления, админ-сводка и справочники.  
`ReactDesign/` используется как дизайн-референс, а рабочее приложение собирается из `FrontEnd/` и `Backend/`.

## Стек

- Frontend: React 19, TypeScript, Vite, Ant Design, Zustand
- Backend: ASP.NET Core 8, EF Core, PostgreSQL
- Media: MinIO
- Reverse proxy: nginx
- Контейнеризация: Docker Compose

## Архитектура

- `FrontEnd/` - основной пользовательский интерфейс
- `Backend/` - API, бизнес-логика, миграции, seed и storage
- `docker-compose.yml` - единая точка запуска
- `docker/nginx/default.conf` - маршрутизация `/` и `/api`

### Backend

- `GET /api/portal/snapshot` - основной bootstrap всего интерфейса
- `GET /api/reference/{category}` - read-only справочники
- `GET /api/media/{objectKey}` - медиа из MinIO
- `POST /api/auth/login` и `POST /api/auth/register` - аутентификация
- `GET/POST/PATCH /api/marketplace/*` - лоты, корзина и checkout
- `GET/POST /api/forum/*` - форум
- `GET/POST /api/notifications/*` - уведомления
- `GET/POST /api/subscriptions/*` - подписки
- `GET/PUT /api/profile/me` - профиль
- `GET /api/admin/stats` - админ-статистика

### Seed и миграции

- База создается миграциями EF Core.
- При старте backend вызывает `Database.MigrateAsync()`.
- Seed версионирован и идемпотентен.
- В MinIO при первом запуске загружаются реальные изображения и SVG-ассеты.
- В PostgreSQL при первом запуске создаются:
  - пользователи и демо-аккаунты
  - зерновые и техничеcкие лоты
  - корзина и заказы
  - форум-темы и ответы
  - уведомления
  - подписки
  - новости, цены, аналитика
  - справочники: страны, культуры, организации, маршруты, ж/д тарифы, пошлины, биржевые ориентиры

## Запуск

### Один compose

```bash
docker compose up --build
```

После старта:

- Frontend: [http://localhost:8080](http://localhost:8080)
- API: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- MinIO Console: [http://localhost:9001](http://localhost:9001)
- pgAdmin: [http://localhost:5050](http://localhost:5050)

### Локальная разработка

Frontend:

```bash
cd FrontEnd
npm install
npm run dev
```

Backend:

```bash
cd Backend
dotnet run --project src/Zerno.Api/Zerno.Api.csproj
```

## Демо-аккаунты

Пароль для всех демо-пользователей: `Password123!`

- `participant1@zerno.local` - покупатель
- `participant2@zerno.local` - продавец
- `participant3@zerno.local` - продавец техники
- `admin@zerno.local` - администратор

## Проверка

```bash
cd Backend
dotnet test

cd ../FrontEnd
npm test
npm run build
```

Для ручной проверки после `docker compose up --build`:

- открыть главную страницу и лоты
- проверить вход через `/auth`
- проверить корзину и оформление заказа
- открыть форум и добавить тему
- открыть админ-панель под `admin@zerno.local`
- проверить доступность медиа через карточки лотов и новостей

## Примечания

- `ReactDesign/` не участвует в продакшен-запуске.
- Фронтенд работает через nginx и обращается к API по относительному `/api`.
- Хранилище медиа и БД не требуют ручной инициализации.
