-- Обновляем функцию consume_user_tokens: добавляем проверку на completed статус
DROP FUNCTION IF EXISTS consume_user_tokens(UUID, INTEGER, VARCHAR);

CREATE OR REPLACE FUNCTION consume_user_tokens(
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
    v_task_id UUID;
    v_task_status task_status_enum;
    v_current_balance INTEGER;
    v_consumed_tokens INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Проверяем входные параметры
    IF p_tokens_to_consume <= 0 THEN
        RAISE EXCEPTION 'Количество токенов для списания должно быть больше нуля';
    END IF;

    -- Находим pending задачу для этого пользователя (блокируем для обновления)
    -- Берем самую старую pending задачу если их несколько
    SELECT tct.id, tct.status INTO v_task_id, v_task_status
    FROM token_consumption_tasks tct
    WHERE tct.user_id = p_user_id::TEXT
      AND tct.status = 'pending'  -- ВАЖНО: ищем только pending
    ORDER BY tct.created_at ASC
    LIMIT 1
    FOR UPDATE;

    -- Если pending задача не найдена - создаем новую
    IF v_task_id IS NULL THEN
        INSERT INTO token_consumption_tasks (
            execution_id,
            user_id,
            tokens_to_consume,
            model,
            status
        ) VALUES (
            0,  -- execution_id будет заполнен позже
            p_user_id::TEXT,
            p_tokens_to_consume,
            p_model,
            'pending'
        ) RETURNING id, status INTO v_task_id, v_task_status;
        
        -- Блокируем созданную задачу
        PERFORM 1 FROM token_consumption_tasks 
        WHERE id = v_task_id 
        FOR UPDATE;
    END IF;

    -- Дополнительная проверка: если задача уже completed (защита от race condition)
    IF v_task_status = 'completed' THEN
        RAISE EXCEPTION 'Задача % уже обработана (status: completed). Токены не будут списаны повторно.', v_task_id;
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
        WHERE id = v_task_id;
        
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
        WHERE id = v_task_id;
        
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
        model = p_model,  -- ВАЖНО: записываем модель в колонку model
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
    WHERE id = v_task_id;

    -- Возвращаем результат
    RETURN QUERY SELECT 
        v_task_id,
        v_consumed_tokens,
        v_new_balance,
        'completed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к функции
COMMENT ON FUNCTION consume_user_tokens(UUID, INTEGER, VARCHAR) IS 
'Списывает токены с баланса пользователя. Параметры: user_id, tokens_to_consume, model. Ищет только PENDING задачи. Если задача уже completed - не обрабатывает повторно. Записывает модель в колонку model таблицы token_consumption_tasks. Если баланса недостаточно - списывает остаток до нуля. Если баланс = 0, возвращает ошибку и ставит статус failed.';

-- Примеры использования:
/*
-- Обычное использование
SELECT * FROM consume_user_tokens('user-uuid'::UUID, 3835, 'gpt-4');

-- Если задача уже completed, функция вернет ошибку:
-- ERROR: Задача ... уже обработана (status: completed). Токены не будут списаны повторно.

-- Функция всегда ищет только pending задачи, поэтому completed задачи игнорируются
*/
