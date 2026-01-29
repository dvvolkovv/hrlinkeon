# 📋 Шпаргалка: Автоначисление токенов

## 🚀 Применить миграцию (копируй-вставляй)

```bash
# PostgreSQL командная строка
psql -h localhost -U postgres -d hrlinkeon \
  -f hrlinkeon/db_migrations/auto_grant_tokens_on_user_creation.sql

# Или для Railway/внешнего хоста:
psql -h your-host.railway.app -U postgres -d railway \
  -f hrlinkeon/db_migrations/auto_grant_tokens_on_user_creation.sql
```

## ✅ Быстрая проверка

```sql
-- Тест 1: Создать пользователя
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('test@test.com', crypt('pass123', gen_salt('bf')), 'Test', 'TestCo', 'hr')
RETURNING id, email, tokens;
-- Ожидается: tokens = 20000

-- Тест 2: Проверить транзакцию
SELECT * FROM token_transactions 
WHERE description = 'Welcome bonus: initial tokens grant'
ORDER BY created_at DESC LIMIT 1;
-- Ожидается: запись с amount = 20000

-- Тест 3: Удалить тестовые данные
DELETE FROM users WHERE email = 'test@test.com';
```

## 📊 Полезные запросы

```sql
-- Сколько пользователей получили welcome-бонус
SELECT COUNT(*) FROM token_transactions 
WHERE transaction_type = 'bonus' 
AND description = 'Welcome bonus: initial tokens grant';

-- Список пользователей с их балансом
SELECT email, name, tokens, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Общая статистика токенов
SELECT 
    COUNT(*) as users,
    AVG(tokens) as avg_tokens,
    SUM(tokens) as total_tokens
FROM users;

-- Проверить триггеры
SELECT trigger_name, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

## 🔄 Обновить существующих пользователей

```sql
UPDATE users 
SET tokens = 20000 
WHERE tokens = 0 OR tokens IS NULL;
```

## ❌ Откат (если нужно)

```sql
DROP TRIGGER IF EXISTS set_initial_tokens_on_user_creation ON users;
DROP TRIGGER IF EXISTS log_initial_tokens_on_user_creation ON users;
DROP FUNCTION IF EXISTS grant_initial_tokens();
DROP FUNCTION IF EXISTS log_initial_tokens_transaction();
```

## 📖 Документация

- `AUTO_GRANT_TOKENS_README.md` - полная документация
- `QUICK_START_AUTO_TOKENS.md` - быстрый старт
- `AUTO_TOKENS_FLOW.md` - визуальные схемы
- `test_auto_tokens.sql` - автоматические тесты
- `CHEATSHEET.md` - этот файл

## 💡 Подсказки

**Что делает миграция?**
- При создании пользователя автоматически устанавливается tokens = 20000
- Создается запись в token_transactions с типом 'bonus'

**Нужно что-то менять в коде?**
- Нет! Всё работает автоматически на уровне БД

**Как это повлияет на существующих пользователей?**
- Никак. Только новые пользователи получат автоматически токены
- Существующих можно обновить отдельным запросом (см. выше)

**Безопасно ли это?**
- Да. Операции атомарные, откат возможен
- Сначала протестируйте на тестовой БД
