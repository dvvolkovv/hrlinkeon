-- Удаляем старую версию функции
DROP FUNCTION IF EXISTS consume_user_tokens(UUID, INTEGER);

-- Создаем правильную версию функции consume_user_tokens
-- Эта функция работает с таблицей token_consumption_tasks
-- Входной параметр: task_id (UUID) - ID записи в token_consumption_tasks со статусом pending
-- Функция списывает токены у пользователя и меняет статус задачи на completed

CREATE OR REPLACE FUNCTION consume_user_tokens(
    p_task_id UUID
)
RETURNS TABLE (
    task_id UUID,
    user_id TEXT,
    consumed_tokens INTEGER,
    remaining_balance INTEGER,
    status TEXT
) AS $$
DECLARE
    v_user_id TEXT;
    v_user_uuid UUID;
    v_tokens_to_consume BIGINT;
    v_current_balance INTEGER;
    v_consumed_tokens INTEGER;
    v_new_balance INTEGER;
    v_task_status task_status_enum;
BEGIN
    -- Получаем данные задачи и блокируем её для обновления
    SELECT 
        tct.user_id,
        tct.tokens_to_consume,
        tct.status
    INTO 
        v_user_id,
        v_tokens_to_consume,
        v_task_status
    FROM token_consumption_tasks tct
    WHERE tct.id = p_task_id
    FOR UPDATE;

    -- Проверяем, найдена ли задача
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Задача с ID % не найдена', p_task_id;
    END IF;

    -- Проверяем статус задачи
    IF v_task_status != 'pending' THEN
        RAISE EXCEPTION 'Задача % имеет статус %, ожидается pending', p_task_id, v_task_status;
    END IF;

    -- Проверяем количество токенов
    IF v_tokens_to_consume <= 0 THEN
        RAISE EXCEPTION 'Количество токенов для списания должно быть больше нуля';
    END IF;

    -- Пытаемся преобразовать user_id в UUID
    BEGIN
        v_user_uuid := v_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- Если user_id не UUID, обновляем статус задачи на failed
        UPDATE token_consumption_tasks
        SET 
            status = 'failed',
            error_message = 'Некорректный формат user_id',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_task_id;
        
        RAISE EXCEPTION 'Некорректный формат user_id: %', v_user_id;
    END;

    -- Блокируем строку пользователя для обновления (защита от race condition)
    SELECT tokens INTO v_current_balance
    FROM users
    WHERE id = v_user_uuid
    FOR UPDATE;

    -- Проверяем, найден ли пользователь
    IF NOT FOUND THEN
        -- Обновляем статус задачи на failed
        UPDATE token_consumption_tasks
        SET 
            status = 'failed',
            error_message = 'Пользователь не найден',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_task_id;
        
        RAISE EXCEPTION 'Пользователь с ID % не найден', v_user_uuid;
    END IF;

    -- Если баланс уже ноль - возвращаем ошибку
    IF v_current_balance = 0 THEN
        -- Обновляем статус задачи на failed
        UPDATE token_consumption_tasks
        SET 
            status = 'failed',
            error_message = 'Недостаточно токенов. Текущий баланс: 0',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_task_id;
        
        RAISE EXCEPTION 'Недостаточно токенов. Текущий баланс: 0';
    END IF;

    -- Вычисляем, сколько токенов можем списать
    IF v_current_balance >= v_tokens_to_consume THEN
        -- Баланса достаточно - списываем полностью
        v_consumed_tokens := v_tokens_to_consume::INTEGER;
        v_new_balance := v_current_balance - v_tokens_to_consume::INTEGER;
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
    WHERE id = v_user_uuid;

    -- Обновляем статус задачи на completed
    UPDATE token_consumption_tasks
    SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'consumed_tokens', v_consumed_tokens,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance,
            'requested_tokens', v_tokens_to_consume
        )
    WHERE id = p_task_id;

    -- Возвращаем результат
    RETURN QUERY SELECT 
        p_task_id,
        v_user_id,
        v_consumed_tokens,
        v_new_balance,
        'completed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к функции
COMMENT ON FUNCTION consume_user_tokens(UUID) IS 
'Обрабатывает задачу из token_consumption_tasks: списывает токены с баланса пользователя и меняет статус задачи с pending на completed. Если баланса недостаточно - списывает остаток до нуля. Если баланс = 0, возвращает ошибку и ставит статус failed.';

-- Примеры использования:
-- 1. Создать задачу
-- INSERT INTO token_consumption_tasks (execution_id, user_id, tokens_to_consume, model)
-- VALUES (1, 'user-uuid-here', 1000, 'gpt-4')
-- RETURNING id;

-- 2. Обработать задачу
-- SELECT * FROM consume_user_tokens('task-uuid-here'::UUID);
