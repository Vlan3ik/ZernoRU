# Быстрый Docker-запуск

Обычный локальный запуск теперь не делает `docker compose build --no-cache`.
Такой build каждый раз заново ходит в npm/NuGet/Microsoft registry и из-за плохой сети может висеть очень долго.

## Запуск

```bash
docker compose down
docker compose up -d
```

Сайт:

```text
http://localhost:18081
```

Логи frontend:

```bash
docker compose logs -f frontend
```

## Если frontend пишет ECONNRESET

В проект добавлен более устойчивый entrypoint:

- чистит полубитый `node_modules` после неудачной установки;
- пробует registry `https://registry.npmmirror.com/`;
- включает `replace-registry-host=always`, чтобы ссылки из `package-lock.json` не тянули пакеты с `registry.npmjs.org`, если выбран mirror;
- делает retry и fallback на другие registry.

После замены файлов запусти:

```bash
docker compose down
# старый volume мог остаться битым после ECONNRESET, но новый скрипт его чистит сам
docker compose up -d --force-recreate frontend nginx
```

Если хочешь полностью снести npm volume и начать чисто:

```bash
docker compose down
# осторожно: удалит только frontend npm/node_modules volumes этого compose-проекта
docker volume rm zernoru_frontend_node_modules zernoru_frontend_npm_cache 2>/dev/null || true
docker compose up -d
```

## Не делай без необходимости

```bash
docker compose build --no-cache
```

Это снова заставит Docker всё скачивать с нуля.

## Доступ из локальной сети

Compose публикует порты на `0.0.0.0`, поэтому сайт можно открыть с другого устройства в той же сети:

```text
http://<IP-вашего-компьютера>:18081
```

Если нужно явно указать IP для Vite HMR, создайте `.env`:

```bash
cp .env.example .env
```

и заполните:

```env
LAN_HOST=192.168.1.50
```

Подробная инструкция — `LAN_ACCESS.md`.
