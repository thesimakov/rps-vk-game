# Как сделать, чтобы онлайн и API работали (VK Mini App)

**С нуля простыми словами:** см. [DEPLOY_DLYA_CHAYNIKA.md](./DEPLOY_DLYA_CHAYNIKA.md).

Запросы к `/api/presence`, `/api/match`, `/api/player` должны попадать на **сервер с Next.js** (Route Handlers), а не на статический хостинг без бэкенда.

## Вариант A — проще всего: один домен (VPS)

Весь проект (и страницы, и API) крутится на одном сервере.

1. На сервере в `.env` (или переменные окружения процесса):
   - `NEXT_OUTPUT_EXPORT=0` — **обязательно**, иначе API не соберётся в серверный режим.
   - Секреты ВК, ключи и т.д. по необходимости.
   - Права на запись к каталогу данных, например `/var/rps-data` (для `game-state.sqlite` и `players.json`).

2. Сборка и запуск (пример):
   ```bash
   pnpm install
   pnpm run build
   pnpm start
   ```
   Или через PM2 / systemd — смотрите ваш процесс.

3. **Не задавайте** `NEXT_PUBLIC_API_BASE_URL`, если фронт и API открываются с **одного и того же** origin (например `https://play.example.com`). Тогда `fetch` идёт на тот же домен — `/api/...` работает сам.

4. В настройках мини-приложения ВК укажите URL приложения на этот домен (и при необходимости `NEXT_PUBLIC_BASE_PATH`, если приложение в подпапке).

---

## Вариант B: фронт отдельно (статика) + API на VPS

Когда HTML/JS лежат на GitHub Pages, VK Static, CDN, а **API только на VPS**.

1. На **машине, где собираете статику**, в `.env` перед `pnpm run build`:
   ```env
   NEXT_OUTPUT_EXPORT=export
   NEXT_PUBLIC_API_BASE_URL=https://ВАШ-API-ДОМЕН.ru
   ```
   Замените на **точный** URL бэкенда **без** слэша в конце, например `https://api.example.ru` или `https://play.example.ru`.

   > `NEXT_PUBLIC_*` подставляется **на этапе сборки**. После смены URL пересоберите фронт.

2. На **VPS**, где крутится полноценный Next (`NEXT_OUTPUT_EXPORT=0`):
   - Тот же код / деплой бэкенда с API.
   - Включите **CORS**, иначе браузер в iframe ВК заблокирует ответы.

   Пример `.env` на сервере:
   ```env
   NEXT_OUTPUT_EXPORT=0
   CORS_ALLOWED_ORIGINS=https://web.vk.com,https://vk.com,https://m.vk.com,https://vk.ru,https://vk.me,https://id.vk.com,https://YOUR.github.io,https://YOUR.pages.dev
   ```
   Добавьте origin, с которого реально открывается ваш фронт (страница VK, Pages и т.д.). Для GitHub Pages удобно добавить `https://*.github.io` в списке (см. `middleware.ts`).

3. Проверка: в DevTools → Network запрос к `https://ВАШ-API.../api/presence/online-count` должен быть **200** и JSON с `"ok":true`, а не ошибка CORS.

---

## Проверка без ВК

```bash
curl -sS "https://ВАШ-ДОМЕН/api/presence/online-count"
```

Должен вернуться JSON вида `{ "ok": true, "count": ... }`.

---

## Частые проблемы

| Симптом | Что проверить |
|--------|----------------|
| 501 / `no_server` | На бэкенде не должен быть статический export для API — `NEXT_OUTPUT_EXPORT=0`. |
| CORS error в консоли | `CORS_ALLOWED_ORIGINS` на сервере + правильный `NEXT_PUBLIC_API_BASE_URL` при сборке статики. |
| Счётчик онлайн «ломается» | Один общий файл БД на все воркеры: см. `GAME_STATE_DB_PATH`, права на `/var/rps-data`. |

---

## Локальная разработка

Обычно достаточно `pnpm dev` — API на `localhost`, `NEXT_PUBLIC_API_BASE_URL` не нужен.

Если тестируете с телефона в ВК — нужен **HTTPS** и доступный с интернета URL (туннель ngrok/localtunnel и т.д.), и этот URL указать как бэкенд при необходимости.
