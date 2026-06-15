# Запуск портала в локальной сети

Портал настроен так, чтобы быть доступным не только на `localhost`, но и с других устройств в вашей локальной сети.

## 1. Найдите IP компьютера

Linux / WSL:

```bash
hostname -I | awk '{print $1}'
```

Windows PowerShell:

```powershell
ipconfig
```

Нужен IPv4 адрес активного сетевого адаптера, например:

```text
192.168.1.50
```

## 2. Запустите проект

```bash
docker compose down
docker compose up -d --force-recreate
```

## 3. Откройте с другого устройства

На телефоне, планшете или другом ПК в той же Wi‑Fi/LAN сети:

```text
http://192.168.1.50:18081
```

Замените `192.168.1.50` на IP вашего компьютера.

## 4. Если страница не открывается с телефона/другого ПК

Проверьте:

1. Устройство находится в той же сети Wi‑Fi/LAN.
2. Docker контейнеры запущены:

```bash
docker compose ps
```

3. Сайт открывается на самом компьютере:

```text
http://localhost:18081
```

4. В Windows Firewall разрешен входящий TCP-порт `18081` для частных сетей.

Для Docker Desktop на Windows доступ извне идет через IP Windows-хоста, а не через внутренний IP контейнера и не через `172.*` адрес Docker-сети.

## 5. Если Vite HMR/WebSocket ругается в консоли

Создайте `.env` из примера:

```bash
cp .env.example .env
```

Впишите ваш LAN IP:

```env
LAN_HOST=192.168.1.50
```

Перезапустите:

```bash
docker compose down
docker compose up -d --force-recreate
```

## Порты

- Портал через nginx: `18081`
- Frontend Vite напрямую: `15173`
- Backend API напрямую: `18080`
- PostgreSQL: `15432`
- pgAdmin: `15050`
- MinIO API: `19000`
- MinIO Console: `19001`

Основной адрес для работы — `http://<LAN_IP>:18081`.
