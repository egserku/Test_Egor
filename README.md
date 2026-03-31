<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PrintMaster Pro (локальный запуск)

## Run Locally

**Prerequisites:**  Node.js


1. (Опционально) Создайте `.env` из `.env.example` и задайте переменные.
2. Запустите приложение (Windows):
   `start.bat`

### Что происходит после отправки заказа

- Заказ сохраняется на диск как JSON в `data/orders/`
- Trello временно отключен (заглушка)

### Если “не поднимается”

Частая причина — порт занят. Сервер автоматически подберёт свободный и выведет в консоль строку:
`Server running on http://localhost:XXXX`

### Минимальные переменные окружения

- `ADMIN_PASSWORD` — пароль входа в админку
- `VITE_GEMINI_API_KEY` — ключ Gemini для советов/резюме (если пусто, используются встроенные тексты)
