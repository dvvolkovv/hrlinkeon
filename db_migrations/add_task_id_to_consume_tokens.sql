-- Обновляем функцию consume_user_tokens: добавляем task_id как обязательный параметр
DROP FUNCTION IF EXISTS consume_user_tokens(UUID, INTEGER, VARCHAR);

CREATE OR REPLACE FUNCTION consume_user_tokens(
    p_task_id UUID,
    p_user_id UUID,
    p_tokens_to_consume INTEGER,
    p_model VARCHAR DEFAULT 'unknown'
)
RETURNS TABLE (
    task_id UUID,
    consumed_tokens INTEGER,
    remaining_balance INTEGER,
    status TEXT
) AS $$
DECLARE
    v_task_status task_status_enum;
    v_task_user_id TEXT;
    v_current_balance INTEGER;
    v_consumed_tokens INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Проверяем входные параметры
    IF p_tokens_to_consume <= 0 THEN
        RAISE EXCEPTION 'Количество токенов для списания должно быть больше нуля';
    END IF;

    -- Получаем задачу по ID и блокируем её
    SELECT tct.status, tct.user_id INTO v_task_status, v_task_user_id
    FROM token_consumption_tasks tct
    WHERE tct.id = p_task_id
    FOR UPDATE;

    -- Проверяем, найдена ли задача
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Задача с ID % не найдена', p_task_id;
    END IF;

    -- Проверяем, что user_id совпадает
    IF v_task_user_id != p_user_id::TEXT THEN
        RAISE EXCEPTION 'Задача % принадлежит другому пользователю', p_task_id;
    END IF;

    -- Проверяем статус задачи
    IF v_task_status = 'completed' THEN
        RAISE EXCEPTION 'Задача % уже обработана (status: completed). Токены не будут списаны повторно.', p_task_id;
    END IF;

    IF v_task_status = 'failed' THEN
        RAISE EXCEPTION 'Задача % имеет статус failed. Невозможно обработать.', p_task_id;
    END IF;

    IF v_task_status != 'pending' THEN
        RAISE EXCEPTION 'Задача % имеет некорректный статус: %. Ожидается pending.', p_task_id, v_task_status;
    END IF;

    -- Блокируем строку пользователя для обновления (защита от race condition)
    SELECT tokens INTO v_current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- Проверяем, найден ли пользователь
    IF NOT FOUND THEN
        -- Обновляем статус задачи на failed
        UPDATE token_consumption_tasks
        SET 
            status = 'failed',
            model = p_model,
            error_message = 'Пользователь не найден',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_task_id;
        
        RAISE EXCEPTION 'Пользователь с ID % не найден', p_user_id;
    END IF;

    -- Если баланс уже ноль - возвращаем ошибку
    IF v_current_balance = 0 THEN
        -- Обновляем статус задачи на failed
        UPDATE token_consumption_tasks
        SET 
            status = 'failed',
            model = p_model,
            error_message = 'Недостаточно токенов. Текущий баланс: 0',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_task_id;
        
        RAISE EXCEPTION 'Недостаточно токенов. Текущий баланс: 0';
    END IF;

    -- Вычисляем, сколько токенов можем списать
    IF v_current_balance >= p_tokens_to_consume THEN
        -- Баланса достаточно - списываем полностью
        v_consumed_tokens := p_tokens_to_consume;
        v_new_balance := v_current_balance - p_tokens_to_consume;
    ELSE
        -- Баланса недостаточно - списываем остаток до нуля
        v_consumed_tokens := v_current_balance;
        v_new_balance := 0;
    END IF;

    -- Обновляем баланс пользователя
    UPDATE users
    SET 
        tokens = v_new_balance,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;

    -- Обновляем задачу: меняем статус на completed и сохраняем метаданные
    UPDATE token_consumption_tasks
    SET 
        status = 'completed',
        model = p_model,
        tokens_to_consume = p_tokens_to_consume,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'consumed_tokens', v_consumed_tokens,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance,
            'requested_tokens', p_tokens_to_consume,
            'model', p_model
        )
    WHERE id = p_task_id;

    -- Возвращаем результат
    RETURN QUERY SELECT 
        p_task_id,
        v_consumed_tokens,
        v_new_balance,
        'completed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к функции
COMMENT ON FUNCTION consume_user_tokens(UUID, UUID, INTEGER, VARCHAR) IS 
'Списывает токены с баланса пользователя для конкретной задачи. Параметры: task_id, user_id, tokens_to_consume, model. Напрямую работает с указанной задачей по ID. Проверяет что задача в статусе pending и принадлежит указанному пользователю. Если баланса недостаточно - списывает остаток до нуля. Если баланс = 0, возвращает ошибку и ставит статус failed.';

-- Примеры использования:
/*
-- Workflow:
-- 1. Создается задача
INSERT INTO token_consumption_tasks (execution_id, user_id, status, model)
VALUES (12345, 'user-uuid', 'pending', 'gpt-4')
RETURNING id;
-- Результат: task_id = 'abc-123-...'

-- 2. Асинхронный процесс узнает потребление токенов по execution_id
-- 3. Вызывает функцию с конкретным task_id
SELECT * FROM consume_user_tokens(
  'abc-123-...'::UUID,  -- task_id - ЯВНО указываем какую задачу обновлять
  'user-uuid'::UUID,     -- user_id
  3835,                  -- tokens_to_consume
  'gpt-4'                -- model
);

-- Защита:
-- - Проверяет что задача существует
-- - Проверяет что user_id совпадает
-- - Проверяет что статус = pending (не completed/failed)
-- - Обновляет ТОЛЬКО указанную задачу, без путаницы
*/
