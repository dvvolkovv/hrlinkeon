# Исправление SQL запроса для статистики использования токенов

## 🔴 Проблема

На странице "Купить токены" (`https://hr.linkeon.io/buy-tokens`) отображается неверная статистика:
```
Использовано за 30 дней: 12 505 токенов
```

**Причина:** SQL запрос в n8n workflow `HR Get User Balance` читает данные из **неправильной таблицы**.

## ❌ Неверный SQL запрос (старый)

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  COALESCE(u.tokens, 0) as tokens,
  (
    SELECT COUNT(*)
    FROM token_transactions tt          -- ❌ Неправильная таблица!
    WHERE tt.user_id = u.id::text
    AND tt.transaction_type = 'usage'   -- ❌ В этой таблице нет 'usage'
    AND tt.created_at >= NOW() - INTERVAL '30 days'
  ) as usage_count_30d,
  (
    SELECT COALESCE(SUM(ABS(tt.amount)), 0)
    FROM token_transactions tt          -- ❌ Неправильная таблица!
    WHERE tt.user_id = u.id::text
    AND tt.transaction_type = 'usage'   -- ❌ В этой таблице нет 'usage'
    AND tt.created_at >= NOW() - INTERVAL '30 days'
  ) as tokens_used_30d
FROM users u
WHERE u.id = '{{ $('Call Check JWT').item.json.user_id }}'::uuid;
```

### Почему это неверно?

Согласно нашей архитектуре:
- ✅ **`token_transactions`** - используется **ТОЛЬКО для пополнений** (top-ups)
  - `transaction_type = 'purchase'` или `'topup'`
- ✅ **`token_consumption_tasks`** - используется **для списания/использования** токенов
  - `status = 'completed'` для успешно списанных токенов
  - `consumed_tokens` - фактически списанное количество

## ✅ Правильный SQL запрос (новый)

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  COALESCE(u.tokens, 0) as tokens,
  (
    SELECT COUNT(*)
    FROM token_consumption_tasks tct    -- ✅ Правильная таблица
    WHERE tct.user_id = u.id::text
    AND tct.status = 'completed'        -- ✅ Только завершенные задачи
    AND tct.created_at >= NOW() - INTERVAL '30 days'
  ) as usage_count_30d,
  (
    SELECT COALESCE(SUM((tct.metadata->>'consumed_tokens')::INTEGER), 0)  -- ✅ Фактически списанные токены из JSON
    FROM token_consumption_tasks tct    -- ✅ Правильная таблица
    WHERE tct.user_id = u.id::text
    AND tct.status = 'completed'        -- ✅ Только завершенные задачи
    AND tct.completed_at >= NOW() - INTERVAL '30 days'  -- ✅ По дате завершения
    AND tct.metadata ? 'consumed_tokens'  -- ✅ Проверка наличия ключа в JSON
  ) as tokens_used_30d
FROM users u
WHERE u.id = '{{ $('Call Check JWT').item.json.user_id }}'::uuid;
```

## 📋 Что изменилось

| Параметр | Было (❌) | Стало (✅) |
|----------|----------|-----------|
| **Таблица** | `token_transactions` | `token_consumption_tasks` |
| **Фильтр типа** | `transaction_type = 'usage'` | `status = 'completed'` |
| **Подсчет токенов** | `SUM(ABS(tt.amount))` | `SUM((tct.metadata->>'consumed_tokens')::INTEGER)` |
| **Дата для tokens_used_30d** | `created_at` | `completed_at` |
| **Проверка JSON** | - | `tct.metadata ? 'consumed_tokens'` |

## 🔧 Как применить исправление

### Вариант 1: Обновить существующий workflow

1. Откройте n8n: `https://nomira-ai-test.up.railway.app/`
2. Найдите workflow **"HR Get User Balance"**
3. Откройте ноду **"Get Balance"** (Postgres)
4. Замените SQL запрос на новый (см. выше)
5. Сохраните workflow
6. Активируйте workflow

### Вариант 2: Импортировать обновленный JSON

1. Откройте n8n
2. Удалите старый workflow **"HR Get User Balance"**
3. Импортируйте обновленный файл: `HR Get User Balance (1).json`
4. Проверьте credentials для Postgres
5. Активируйте workflow

## ✅ Результат

После применения исправления на странице `https://hr.linkeon.io/buy-tokens` будет отображаться **корректная статистика**:
- **usage_count_30d** - реальное количество завершенных задач списания за 30 дней
- **tokens_used_30d** - реальная сумма списанных токенов за 30 дней

## 📋 Структура таблицы `token_consumption_tasks`

```sql
CREATE TABLE token_consumption_tasks (
  id UUID PRIMARY KEY,
  execution_id TEXT,              -- ID выполнения в AI системе
  user_id TEXT,                   -- ID пользователя
  tokens_to_consume INTEGER,      -- Запрошенное количество токенов
  status task_status_enum,        -- 'pending', 'completed', 'failed'
  model VARCHAR(255),             -- Модель AI (gpt-4, claude-3, etc.)
  metadata JSONB,                 -- JSON с дополнительными данными
  created_at TIMESTAMP,           -- Дата создания задачи
  completed_at TIMESTAMP,         -- Дата завершения задачи
  error_message TEXT              -- Сообщение об ошибке (если есть)
);
```

### Важно о колонке `metadata`

Фактически списанное количество токенов хранится в **JSON поле `metadata`**, а не в отдельной колонке:

```json
{
  "consumed_tokens": 3835,        // ✅ Фактически списано
  "requested_tokens": 3835,       // Запрошено
  "previous_balance": 10000,      // Баланс до списания
  "new_balance": 6165,            // Баланс после списания
  "model": "gpt-4"
}
```

**Почему так?**
- `tokens_to_consume` может отличаться от фактически списанного, если баланса было недостаточно
- Например: запрошено 1000, но баланс был 500 → списано 500

## 📊 Архитектура использования токенов

```
┌─────────────────────────────────────────────────────────────┐
│ ИСПОЛЬЗОВАНИЕ ТОКЕНОВ (Token Consumption Flow)              │
└─────────────────────────────────────────────────────────────┘

1. Пользователь отправляет сообщение в AI чат
   ↓
2. Создается запись в token_consumption_tasks
   status: 'pending'
   ↓
3. AI обрабатывает запрос (использует токены)
   ↓
4. Асинхронный процесс вызывает consume_user_tokens()
   - Списывает токены из users.tokens
   - Обновляет task: status = 'completed', consumed_tokens = N
   ↓
5. Статистика отображается на /buy-tokens
   Читает из: token_consumption_tasks WHERE status = 'completed'

┌─────────────────────────────────────────────────────────────┐
│ ПОПОЛНЕНИЕ ТОКЕНОВ (Token Purchase Flow)                    │
└─────────────────────────────────────────────────────────────┘

1. Пользователь покупает токены через YooKassa
   ↓
2. Создается запись в token_transactions
   transaction_type: 'purchase', amount: +N
   ↓
3. Вызывается add_user_tokens()
   - Добавляет токены в users.tokens
```

## 🔗 Связанные файлы

- **Frontend:** `hrlinkeon/src/pages/BuyTokens.tsx` (строка 182)
- **API Endpoint:** `/api/v2/user/balance`
- **n8n Workflow:** `HR Get User Balance (1).json`
- **DB Function:** `consume_user_tokens()` в `add_task_id_to_consume_tokens.sql`
- **DB Tables:**
  - `token_consumption_tasks` - использование токенов
  - `token_transactions` - пополнение токенов
  - `users` (колонка `tokens`) - текущий баланс

---

**Дата исправления:** 28.01.2026  
**Статус:** ✅ Исправлено в `HR Get User Balance (1).json`
