# Функция consume_user_tokens - Документация

## Описание

Функция для умного списания токенов с баланса пользователя. Автоматически обрабатывает случаи недостаточного баланса.

## Сигнатура

```sql
consume_user_tokens(
    p_user_id UUID,
    p_tokens_to_consume INTEGER
)
RETURNS TABLE (
    consumed_tokens INTEGER,
    remaining_balance INTEGER,
    transaction_id UUID
)
```

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `p_user_id` | UUID | ID пользователя из таблицы `users` |
| `p_tokens_to_consume` | INTEGER | Количество токенов для списания (должно быть > 0) |

## Возвращаемые значения

| Поле | Тип | Описание |
|------|-----|----------|
| `consumed_tokens` | INTEGER | Количество фактически списанных токенов |
| `remaining_balance` | INTEGER | Остаток токенов на балансе после операции |
| `transaction_id` | UUID | ID созданной записи в таблице `token_transactions` |

## Логика работы

### 1. Баланс = 0
**Поведение:** Возвращает ошибку  
**Ошибка:** `Недостаточно токенов. Текущий баланс: 0`

```sql
-- Пример: баланс пользователя = 0
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 100);
-- ERROR: Недостаточно токенов. Текущий баланс: 0
```

### 2. Баланс >= запрошенных токенов
**Поведение:** Списывает полностью запрошенное количество

```sql
-- Пример: баланс = 1000, запрос = 500
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 500);
-- Результат:
-- consumed_tokens = 500
-- remaining_balance = 500
-- transaction_id = новый UUID
```

### 3. Баланс < запрошенных токенов
**Поведение:** Списывает остаток до нуля

```sql
-- Пример: баланс = 300, запрос = 500
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 500);
-- Результат:
-- consumed_tokens = 300
-- remaining_balance = 0
-- transaction_id = новый UUID
```

## Примеры использования

### Пример 1: Списание токенов для AI-запроса
```sql
DO $$
DECLARE
    v_user_id UUID := 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    v_result RECORD;
BEGIN
    -- Списать 1000 токенов
    SELECT * INTO v_result
    FROM consume_user_tokens(v_user_id, 1000);
    
    RAISE NOTICE 'Списано токенов: %', v_result.consumed_tokens;
    RAISE NOTICE 'Остаток: %', v_result.remaining_balance;
    RAISE NOTICE 'ID транзакции: %', v_result.transaction_id;
END $$;
```

### Пример 2: Обработка недостаточного баланса в приложении
```sql
-- В n8n или приложении
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 5000);

-- Если consumed_tokens < 5000, значит баланса было недостаточно
-- Можно предупредить пользователя о необходимости пополнения
```

### Пример 3: Проверка баланса перед списанием
```sql
-- Сначала проверяем баланс
SELECT tokens FROM users WHERE id = 'user-uuid'::UUID;

-- Если баланс > 0, списываем токены
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 1000);
```

## Обработка ошибок

Функция может вернуть следующие ошибки:

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `Количество токенов для списания должно быть больше нуля` | Передано значение <= 0 | Передайте положительное число |
| `Пользователь не найден` | user_id не существует в таблице users | Проверьте корректность user_id |
| `Недостаточно токенов. Текущий баланс: 0` | Баланс пользователя = 0 | Предложите пополнить токены |

## Автоматическое логирование

Каждый вызов функции создает запись в таблице `token_transactions` с:

- **amount:** `-consumed_tokens` (отрицательное значение)
- **transaction_type:** `'usage'`
- **description:** `'Списание токенов за использование AI'`
- **metadata (JSONB):**
  ```json
  {
    "requested_tokens": 1000,
    "consumed_tokens": 300,
    "previous_balance": 300,
    "new_balance": 0
  }
  ```

## Просмотр истории списаний

```sql
-- Все списания для пользователя
SELECT 
    id,
    amount,
    description,
    metadata,
    created_at
FROM token_transactions
WHERE user_id = 'user-uuid'
  AND transaction_type = 'usage'
ORDER BY created_at DESC;
```

## Защита от race conditions

Функция использует `SELECT ... FOR UPDATE` для блокировки строки пользователя на время транзакции, что гарантирует корректность баланса при одновременных запросах.

## Интеграция с n8n

Для использования в n8n workflows:

```javascript
// В Code node или Postgres node
const result = await query(`
  SELECT * FROM consume_user_tokens($1::UUID, $2)
`, [userId, tokensToConsume]);

const consumedTokens = result[0].consumed_tokens;
const remainingBalance = result[0].remaining_balance;

if (consumedTokens < tokensToConsume) {
  // Баланса было недостаточно
  return {
    warning: 'Недостаточно токенов',
    consumed: consumedTokens,
    remaining: remainingBalance
  };
}
```

## См. также

- `add_user_tokens()` - начисление токенов
- `get_user_token_balance()` - получение баланса
- Таблица `token_transactions` - история всех операций
