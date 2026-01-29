# 🚀 Быстрый старт: Автоматическое начисление токенов

## Что это дает?

При создании каждого нового пользователя автоматически:
- ✅ Начисляется **20 000 токенов**
- ✅ Создается запись в истории транзакций
- ✅ Логируются метаданные (email, имя, компания)

## Применить за 30 секунд

### PostgreSQL:

```bash
psql -h localhost -U postgres -d hrlinkeon -f db_migrations/auto_grant_tokens_on_user_creation.sql
```

### DBeaver / pgAdmin:

1. Откройте `db_migrations/auto_grant_tokens_on_user_creation.sql`
2. Нажмите Execute (F5)
3. Готово! ✅

### n8n:

Используйте PostgreSQL Execute Query ноду с содержимым файла миграции.

## Проверить что работает

```sql
-- Создать тестового пользователя
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('test@test.com', '$2b$10$hash', 'Test', 'TestCo', 'hr')
RETURNING id, email, tokens;

-- Должно вернуть: tokens = 20000 ✅

-- Проверить транзакцию
SELECT * FROM token_transactions 
WHERE description = 'Welcome bonus: initial tokens grant'
ORDER BY created_at DESC LIMIT 1;

-- Удалить тестового пользователя
DELETE FROM users WHERE email = 'test@test.com';
```

## Обновить существующих пользователей?

Если у вас уже есть пользователи с `tokens = 0`, выполните:

```sql
-- Начислить токены существующим пользователям
UPDATE users 
SET tokens = 20000 
WHERE tokens = 0 OR tokens IS NULL;

-- Создать транзакции для них
INSERT INTO token_transactions (user_id, transaction_type, amount, balance_after, description, metadata)
SELECT 
    id::TEXT,
    'bonus',
    20000,
    20000,
    'Retroactive welcome bonus',
    jsonb_build_object('user_email', email, 'retroactive', true)
FROM users
WHERE tokens = 20000 AND id NOT IN (
    SELECT (user_id::UUID) FROM token_transactions 
    WHERE description LIKE '%Welcome bonus%'
);
```

## Откат (если нужно)

```sql
DROP TRIGGER IF EXISTS set_initial_tokens_on_user_creation ON users;
DROP TRIGGER IF EXISTS log_initial_tokens_on_user_creation ON users;
DROP FUNCTION IF EXISTS grant_initial_tokens();
DROP FUNCTION IF EXISTS log_initial_tokens_transaction();
```

## Что дальше?

После применения миграции все новые пользователи автоматически получат 20 000 токенов при регистрации. Никаких дополнительных действий не требуется! 🎉
