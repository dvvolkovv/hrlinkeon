# Автоматическое начисление токенов при создании пользователя

## Описание

Эта миграция автоматически начисляет **20 000 токенов** каждому новому пользователю при создании его аккаунта в системе HR-Linkeon.

## Что делает миграция

1. **Устанавливает дефолтное значение** для поля `users.tokens` = 20000
2. **Создает триггер BEFORE INSERT** который устанавливает начальный баланс 20000 токенов
3. **Создает триггер AFTER INSERT** который записывает транзакцию начисления в таблицу `token_transactions`
4. **Логирует welcome-бонус** с метаданными (email, имя, компания пользователя)

## Как применить миграцию

### Вариант 1: Через psql

```bash
psql -h <host> -U <username> -d <database> -f db_migrations/auto_grant_tokens_on_user_creation.sql
```

### Вариант 2: Через PostgreSQL клиент (DBeaver, pgAdmin и т.д.)

1. Откройте файл `db_migrations/auto_grant_tokens_on_user_creation.sql`
2. Скопируйте содержимое
3. Выполните SQL в вашем PostgreSQL клиенте

### Вариант 3: Через Node.js / n8n

Если вы используете n8n для работы с БД:

1. Создайте новый workflow
2. Добавьте PostgreSQL Execute Query ноду
3. Вставьте SQL из файла миграции
4. Выполните workflow

## Структура триггеров

### Триггер 1: `set_initial_tokens_on_user_creation`

- **Тип**: BEFORE INSERT
- **Функция**: `grant_initial_tokens()`
- **Действие**: Устанавливает `NEW.tokens = 20000` если значение NULL или 0

### Триггер 2: `log_initial_tokens_on_user_creation`

- **Тип**: AFTER INSERT
- **Функция**: `log_initial_tokens_transaction()`
- **Действие**: Создает запись в `token_transactions` с типом `bonus`

## Пример работы

### До миграции:

```sql
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('user@example.com', 'hash', 'John Doe', 'Acme Corp', 'hr');

-- Результат: tokens = 0 (или NULL)
-- Транзакция: не создается
```

### После миграции:

```sql
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('user@example.com', 'hash', 'John Doe', 'Acme Corp', 'hr');

-- Результат: tokens = 20000
-- Транзакция: автоматически создается запись в token_transactions:
--   - transaction_type: 'bonus'
--   - amount: 20000
--   - description: 'Welcome bonus: initial tokens grant'
--   - metadata: {user_email, user_name, company, granted_at}
```

## Проверка работы

После применения миграции выполните тестовый INSERT:

```sql
-- 1. Создайте тестового пользователя
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('test@example.com', '$2b$10$test_hash', 'Test User', 'Test Company', 'hr')
RETURNING id, email, tokens;

-- Ожидаемый результат: tokens = 20000

-- 2. Проверьте транзакцию
SELECT * FROM token_transactions 
WHERE user_id = (SELECT id::TEXT FROM users WHERE email = 'test@example.com')
ORDER BY created_at DESC 
LIMIT 1;

-- Ожидаемый результат:
-- transaction_type: 'bonus'
-- amount: 20000
-- balance_after: 20000
-- description: 'Welcome bonus: initial tokens grant'

-- 3. Очистите тестовые данные
DELETE FROM users WHERE email = 'test@example.com';
```

## Обновление существующих пользователей

Если у вас уже есть пользователи с нулевым балансом токенов, раскомментируйте секцию в конце SQL файла:

```sql
-- Раскомментируйте эти строки в файле миграции:
UPDATE users 
SET tokens = 20000 
WHERE tokens = 0 OR tokens IS NULL;

-- Создаем транзакции для всех обновленных пользователей
INSERT INTO token_transactions (...)
SELECT ...
FROM users
WHERE tokens = 20000;
```

## Откат миграции

Если нужно откатить изменения:

```sql
-- Удаляем триггеры
DROP TRIGGER IF EXISTS set_initial_tokens_on_user_creation ON users;
DROP TRIGGER IF EXISTS log_initial_tokens_on_user_creation ON users;

-- Удаляем функции
DROP FUNCTION IF EXISTS grant_initial_tokens();
DROP FUNCTION IF EXISTS log_initial_tokens_transaction();

-- Возвращаем дефолтное значение к 0 (опционально)
ALTER TABLE users 
ALTER COLUMN tokens SET DEFAULT 0;

-- Удаляем транзакции welcome-бонусов (опционально)
DELETE FROM token_transactions 
WHERE transaction_type = 'bonus' 
AND description = 'Welcome bonus: initial tokens grant';
```

## Связанные файлы

- `token_system_migration_final.sql` - основная миграция системы токенов
- `add_yookassa_users_integration.sql` - интеграция YooKassa с таблицей users
- `update_token_packages.sql` - обновление пакетов токенов

## Зависимости

Эта миграция требует наличия:

1. Таблицы `users` с полем `tokens`
2. Таблицы `token_transactions`
3. Enum типа `transaction_type_enum` с значением `'bonus'`

Если эти объекты не существуют, сначала примените:
- `token_system_migration_final.sql`
- `add_yookassa_users_integration.sql`

## Вопросы и поддержка

При возникновении проблем проверьте:

1. Применены ли зависимые миграции
2. Существует ли таблица `token_transactions`
3. Есть ли права на создание триггеров и функций
4. Нет ли конфликтующих триггеров на таблице `users`
