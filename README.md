# HR-Linkeon

Современная веб-платформа для рекрутеров и соискателей с AI-анализом совместимости кандидатов и вакансий.

## Описание

HR-Linkeon - это полнофункциональная система подбора персонала, которая помогает рекрутерам:
- Создавать и управлять вакансиями
- Анализировать кандидатов с помощью AI
- Общаться с кандидатами через чат-интерфейс
- Получать детальную аналитику по кандидатам и вакансиям
- Управлять статусами кандидатов в процессе найма

Кандидаты могут:
- Просматривать открытые вакансии
- Подавать заявки на вакансии
- Отслеживать статус своей заявки
- Общаться с AI-ассистентом для подготовки к собеседованию

## Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **React Router** - маршрутизация
- **Tailwind CSS** - стилизация
- **Lucide React** - иконки

## Требования

- Node.js 18+ 
- npm или yarn

## Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# URL backend API
VITE_HR_LINKEON_URL=https://nomira-ai-test.up.railway.app
```

### Примеры конфигурации

#### Локальная разработка
```env
VITE_HR_LINKEON_URL=http://localhost:3000
```

#### Production
```env
VITE_HR_LINKEON_URL=https://nomira-ai-test.up.railway.app
```

#### Staging
```env
VITE_HR_LINKEON_URL=https://staging-api.example.com
```

## Локальный запуск

### 1. Установка зависимостей

```bash
npm install
```

или

```bash
yarn install
```

### 2. Настройка переменных окружения

Создайте файл `.env` и укажите URL backend API:

```bash
cp .env.example .env
# Отредактируйте .env файл, указав правильный VITE_HR_LINKEON_URL
```

### 3. Запуск dev-сервера

```bash
npm run dev
```

или

```bash
yarn dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

### 4. Сборка для production

```bash
npm run build
```

или

```bash
yarn build
```

Собранные файлы будут в папке `dist/`

### 5. Просмотр production сборки

```bash
npm run preview
```

или

```bash
yarn preview
```

## Доступные команды

- `npm run dev` - запуск dev-сервера
- `npm run build` - сборка для production
- `npm run preview` - предпросмотр production сборки
- `npm run lint` - проверка кода с помощью ESLint
- `npm run typecheck` - проверка типов TypeScript

## Аутентификация

Проект использует JWT токены (access и refresh) для аутентификации:

- Access token используется для всех API запросов
- Refresh token используется для обновления access token
- Токены автоматически обновляются при истечении
- При истечении refresh token пользователь перенаправляется на страницу входа

## API

Проект использует REST API с префиксом `/api/v2`:

- `/api/v2/auth/send-code` - отправка кода подтверждения
- `/api/v2/auth/verify-code` - верификация кода и получение токенов
- `/api/v2/auth/refresh` - обновление токенов
- `/api/v2/vacancies` - управление вакансиями
- `/api/v2/rec/chat` - чат с AI-ассистентом для рекрутера
- И другие endpoints для работы с кандидатами и вакансиями

Все запросы к API автоматически включают JWT токен в заголовке `Authorization: Bearer <access_token>`.

## Структура проекта

```
src/
├── components/      # Переиспользуемые компоненты
│   ├── ui/         # UI компоненты (Button, Card, Input и т.д.)
│   └── ...         # Другие компоненты
├── lib/            # Утилиты и хелперы
│   ├── api.ts      # API клиент с JWT токенами
│   └── auth.ts     # Утилиты для работы с аутентификацией
├── pages/          # Страницы приложения
├── types/          # TypeScript типы
└── main.tsx        # Точка входа приложения
```

## Лицензия

Private
