# Функция consume_user_tokens - Документация v2

## Описание

Функция для обработки задач списания токенов из таблицы `token_consumption_tasks`. Функция работает с асинхронной моделью:
1. Внешний процесс создает записи в `token_consumption_tasks` со статусом `pending`
2. Асинхронный воркер вызывает `consume_user_tokens` для обработки задачи
3. Функция списывает токены с баланса пользователя и меняет статус задачи на `completed`

## Важно

- ⚠️ **`token_transactions`** - используется ТОЛЬКО для пополнения баланса
- ✅ **`token_consumption_tasks`** - используется для списания баланса

## Сигнатура

```sql
consume_user_tokens(
    p_task_id UUID
)
RETURNS TABLE (
    task_id UUID,
    user_id TEXT,
    consumed_tokens INTEGER,
    remaining_balance INTEGER,
    status TEXT
)
```

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `p_task_id` | UUID | ID записи в таблице `token_consumption_tasks` со статусом `pending` |

## Возвращаемые значения

| Поле | Тип | Описание |
|------|-----|----------|
| `task_id` | UUID | ID обработанной задачи |
| `user_id` | TEXT | ID пользователя |
| `consumed_tokens` | INTEGER | Количество фактически списанных токенов |
| `remaining_balance` | INTEGER | Остаток токенов на балансе после операции |
| `status` | TEXT | Финальный статус задачи ('completed') |

## Логика работы

### 1. Баланс = 0
**Поведение:** 
- Возвращает ошибку
- Меняет статус задачи на `failed`
- Записывает сообщение об ошибке в `error_message`

**Ошибка:** `Недостаточно токенов. Текущий баланс: 0`

```sql
-- Пример: баланс пользователя = 0, задача требует 100 токенов
SELECT * FROM consume_user_tokens('task-uuid'::UUID);
-- ERROR: Недостаточно токенов. Текущий баланс: 0
-- Статус задачи: failed
```

### 2. Баланс >= запрошенных токенов
**Поведение:** 
- Списывает полностью запрошенное количество
- Меняет статус задачи на `completed`
- Заполняет `completed_at`
- Добавляет метаданные в `metadata`

```sql
-- Пример: баланс = 1000, задача требует 500 токенов
SELECT * FROM consume_user_tokens('task-uuid'::UUID);
-- Результат:
-- task_id = task-uuid
-- consumed_tokens = 500
-- remaining_balance = 500
-- status = completed
```

### 3. Баланс < запрошенных токенов
**Поведение:** 
- Списывает остаток до нуля
- Меняет статус задачи на `completed`
- В metadata записывает, что запрошено больше, чем списано

```sql
-- Пример: баланс = 300, задача требует 500 токенов
SELECT * FROM consume_user_tokens('task-uuid'::UUID);
-- Результат:
-- task_id = task-uuid
-- consumed_tokens = 300 (не 500!)
-- remaining_balance = 0
-- status = completed
-- metadata содержит: {"requested_tokens": 500, "consumed_tokens": 300}
```

## Workflow использования

### Шаг 1: Создание задачи (внешний процесс)

```sql
-- При AI-запросе создается запись в token_consumption_tasks
INSERT INTO token_consumption_tasks (
    execution_id,
    user_id,
    tokens_to_consume,
    model,
    input_tokens,
    output_tokens,
    total_tokens
)
VALUES (
    12345,                                      -- ID выполнения
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',   -- UUID пользователя
    1500,                                       -- Токенов для списания
    'gpt-4',                                    -- Модель
    1000,                                       -- Входных токенов
    500,                                        -- Выходных токенов
    1500                                        -- Всего токенов
)
RETURNING id;
-- Результат: task_id
-- Статус автоматически: pending
```

### Шаг 2: Обработка задачи (асинхронный воркер)

```sql
-- Воркер находит задачи со статусом pending
SELECT id FROM token_consumption_tasks 
WHERE status = 'pending' 
ORDER BY created_at ASC 
LIMIT 100;

-- Для каждой задачи вызывает функцию
SELECT * FROM consume_user_tokens('task-uuid'::UUID);
```

### Шаг 3: Проверка результата

```sql
-- Проверить статус задачи
SELECT 
    id,
    status,
    completed_at,
    error_message,
    metadata
FROM token_consumption_tasks 
WHERE id = 'task-uuid';

-- Если status = 'completed': успешно
-- Если status = 'failed': ошибка (смотреть error_message)
```

## Примеры использования

### Пример 1: Успешное списание
```sql
-- 1. Создаем задачу
INSERT INTO token_consumption_tasks (
    execution_id, user_id, tokens_to_consume, model
) VALUES (
    1, 'user-uuid', 1000, 'gpt-4'
) RETURNING id;
-- Результат: task_id = 'abc-123'

-- 2. Обрабатываем задачу
SELECT * FROM consume_user_tokens('abc-123'::UUID);
-- Результат: consumed_tokens=1000, remaining_balance=новый баланс, status=completed

-- 3. Проверяем задачу
SELECT status, completed_at FROM token_consumption_tasks WHERE id = 'abc-123';
-- status = 'completed', completed_at заполнено
```

### Пример 2: Недостаточно баланса
```sql
-- Баланс пользователя: 500 токенов
-- Задача требует: 1000 токенов

INSERT INTO token_consumption_tasks (
    execution_id, user_id, tokens_to_consume, model
) VALUES (
    2, 'user-uuid', 1000, 'gpt-4'
) RETURNING id;
-- Результат: task_id = 'def-456'

SELECT * FROM consume_user_tokens('def-456'::UUID);
-- Результат: consumed_tokens=500, remaining_balance=0, status=completed

-- Проверяем metadata
SELECT metadata FROM token_consumption_tasks WHERE id = 'def-456';
-- {"requested_tokens": 1000, "consumed_tokens": 500, "previous_balance": 500, "new_balance": 0}
```

### Пример 3: Баланс = 0 (ошибка)
```sql
-- Баланс пользователя: 0 токенов

INSERT INTO token_consumption_tasks (
    execution_id, user_id, tokens_to_consume, model
) VALUES (
    3, 'user-uuid', 1000, 'gpt-4'
) RETURNING id;
-- Результат: task_id = 'ghi-789'

SELECT * FROM consume_user_tokens('ghi-789'::UUID);
-- ERROR: Недостаточно токенов. Текущий баланс: 0

-- Проверяем задачу
SELECT status, error_message FROM token_consumption_tasks WHERE id = 'ghi-789';
-- status = 'failed', error_message = 'Недостаточно токенов. Текущий баланс: 0'
```

## Обработка ошибок

Функция автоматически обновляет статус задачи на `failed` и записывает сообщение об ошибке в следующих случаях:

| Ошибка | Причина | error_message |
|--------|---------|---------------|
| `Задача ... не найдена` | task_id не существует | N/A (исключение) |
| `Задача ... имеет статус ...` | Задача не в статусе pending | N/A (исключение) |
| `Некорректный формат user_id` | user_id не является UUID | `Некорректный формат user_id` |
| `Пользователь не найден` | user_id не существует в users | `Пользователь не найден` |
| `Недостаточно токенов` | Баланс = 0 | `Недостаточно токенов. Текущий баланс: 0` |

## Метаданные задачи

После успешной обработки в `metadata` записывается:

```json
{
  "consumed_tokens": 1500,        // Фактически списано
  "previous_balance": 10000,      // Баланс до операции
  "new_balance": 8500,            // Баланс после операции
  "requested_tokens": 1500        // Было запрошено к списанию
}
```

## Защита от race conditions

Функция использует:
- `SELECT ... FOR UPDATE` для блокировки задачи
- `SELECT ... FOR UPDATE` для блокировки строки пользователя

Это гарантирует корректность при одновременной обработке нескольких задач.

## Мониторинг

### Найти необработанные задачи
```sql
SELECT 
    id,
    user_id,
    tokens_to_consume,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds
FROM token_consumption_tasks
WHERE status = 'pending'
ORDER BY created_at ASC;
```

### Найти проваленные задачи
```sql
SELECT 
    id,
    user_id,
    tokens_to_consume,
    error_message,
    created_at
FROM token_consumption_tasks
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 100;
```

### Статистика обработки
```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(tokens_to_consume) as total_tokens
FROM token_consumption_tasks
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Интеграция с n8n / асинхронным воркером

```javascript
// Псевдокод для воркера
async function processTokenConsumptionTasks() {
  // 1. Получить pending задачи
  const tasks = await db.query(`
    SELECT id FROM token_consumption_tasks 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 100
  `);

  // 2. Обработать каждую задачу
  for (const task of tasks) {
    try {
      const result = await db.query(`
        SELECT * FROM consume_user_tokens($1::UUID)
      `, [task.id]);
      
      console.log(`Task ${task.id} completed:`, result[0]);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error.message);
      // Статус уже обновлен функцией на 'failed'
    }
  }
}

// Запускать периодически (например, каждые 10 секунд)
setInterval(processTokenConsumptionTasks, 10000);
```

## См. также

- Таблица `token_consumption_tasks` - очередь задач на списание
- Таблица `token_transactions` - история пополнения баланса (НЕ списания!)
- `add_user_tokens()` - функция начисления токенов
- `get_user_token_balance()` - функция получения баланса
