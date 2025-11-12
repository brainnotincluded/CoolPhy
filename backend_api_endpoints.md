# Описание API для бэкенд разработки

## Аутентификация и профиль
POST /api/register            — регистрация пользователя
POST /api/login               — логин, выдача токена
POST /api/logout              — выход из аккаунта
POST /api/password/reset      — восстановление пароля
POST /api/password/change     — смена пароля
GET  /api/profile             — получить профиль/стату
PUT  /api/profile             — обновить профиль
GET  /api/profile/stats       — статистика, баллы, прогресс

## Пользователи (админ)
GET    /api/users                — список пользователей
GET    /api/users/{id}           — профиль пользователя
PUT    /api/users/{id}           — редактирование профиля (админ)
DELETE /api/users/{id}           — удаление пользователя

## Лекции
GET    /api/lectures                 — каталог, фильтры, поиск
POST   /api/lectures                 — создать лекцию (админ)
GET    /api/lectures/{id}            — получить лекцию
PUT    /api/lectures/{id}            — редактировать лекцию
DELETE /api/lectures/{id}            — удалить лекцию
POST   /api/lectures/{id}/complete   — отметить как изученную
GET    /api/lectures/{id}/notes      — все заметки пользователя
POST   /api/lectures/{id}/notes      — добавить заметку к лекции

## Задачи
GET    /api/tasks                    — каталог задач, фильтр, поиск
POST   /api/tasks                    — создание (админ)
GET    /api/tasks/{id}               — получить задачу
PUT    /api/tasks/{id}               — редактировать задачу
DELETE /api/tasks/{id}               — удалить задачу
POST   /api/tasks/{id}/solve         — отправить решение
GET    /api/tasks/{id}/solutions     — история попыток по задаче
PUT    /api/tasks/{id}/status        — сменить статус задачи

## Попытки решений
GET    /api/solutions                 — все попытки пользователя
GET    /api/solutions/{id}            — одна попытка
PUT    /api/solutions/{id}            — обновить попытку
DELETE /api/solutions/{id}            — удалить попытку

## Темы и структура
GET    /api/topics                    — все темы
GET    /api/topics/tree               — дерево тем
GET    /api/topics/{id}               — описание темы, задачи, лекции
POST   /api/topics                    — создать тему (админ)
PUT    /api/topics/{id}               — редактировать
DELETE /api/topics/{id}               — удалить тему

## LLM-Чат (“Профессор”)
POST   /api/professor-chat            — задать вопрос
GET    /api/professor-chat/history    — история общения
GET    /api/professor-chat/{id}       — отдельный диалог

## Уведомления
GET    /api/notifications             — все уведомления
PUT    /api/notifications/{id}/read   — отметить как прочитанное

## История и статистика
GET    /api/history/tasks             — история задач
GET    /api/history/lectures          — история лекций
GET    /api/history/profile           — общая активность

## Таблица лидеров/Ачивки
GET    /api/leaderboard               — рейтинг пользователей
GET    /api/achievements              — ачивки пользователя

## Админка
GET    /api/admin                     — панель состояния
GET    /api/admin/logs                — логи
GET    /api/admin/lectures            — лекции для админа
GET    /api/admin/tasks               — задачи для админа
GET    /api/admin/topics              — темы для админа
PUT/POST /api/admin/*                 — управление в админке

## Техническое
GET    /api/ping                      — статус сервера
