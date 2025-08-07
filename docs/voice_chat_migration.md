# Миграция на LiveKit

Этот документ описывает переход голосового чата проекта на LiveKit.

## Отличия

- Для голосового чата используется отдельный сервер LiveKit.
- Аутентификация клиентов осуществляется по токенам, подписанным `LIVEKIT_API_SECRET`.
- Появились новые переменные окружения: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`,
  `LIVEKIT_URL`, `LIVEKIT_METRICS_URL`, `USE_LIVEKIT` и `VITE_USE_LIVEKIT`.

## Шаги перехода

1. Запустить сервер LiveKit и убедиться, что он доступен по `LIVEKIT_URL`.
2. Задать перечисленные переменные окружения для backend и frontend.
3. Собрать frontend с `VITE_USE_LIVEKIT=true`.
4. Перезапустить сервисы, чтобы они использовали LiveKit.

## Откат

Если возникли проблемы, можно вернуться к предыдущей реализации:

1. Установить `USE_LIVEKIT=false` и пересобрать frontend с `VITE_USE_LIVEKIT=false`.
2. Удалить переменные `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` и `LIVEKIT_METRICS_URL`.
3. Перезапустить сервисы без LiveKit.

