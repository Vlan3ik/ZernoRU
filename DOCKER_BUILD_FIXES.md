# Что исправлено в Docker

## Главная проблема

Frontend падал на `npm ci` с ошибкой `ECONNRESET`. Это сетевой обрыв при скачивании npm-пакетов, а не ошибка React/Vite.

Дополнительно после обрыва npm оставлял частично установленный `node_modules`, например с ошибкой очистки `ENOTEMPTY` для `zustand`. Поэтому следующий запуск мог снова падать на уже испорченном volume.

## Исправления

1. `docker/frontend/dev-entrypoint.sh` теперь:
   - явно показывает registry и попытки установки;
   - чистит полубитый `node_modules` перед повторной установкой;
   - пробует несколько registry;
   - включает `replace-registry-host=always`;
   - кэширует успешную установку по hash `package-lock.json`.

2. `FrontEnd/.npmrc` добавлен в проект:
   - `registry=https://registry.npmmirror.com/`;
   - `replace-registry-host=always`;
   - увеличенные таймауты и retry.

3. `docker-compose.yml` настроен для dev-запуска без постоянного image build.

## Правильный запуск

```bash
docker compose down
docker compose up -d
```

## Если контейнер frontend уже умер

```bash
docker compose up -d --force-recreate frontend nginx
docker compose logs -f frontend
```
