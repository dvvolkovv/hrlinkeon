-- Функция для списания токенов пользователя
-- Входные параметры: user_id (UUID), tokens_to_consume (INTEGER)
-- Возвращает количество фактически списанных токенов

CREATE OR REPLACE FUNCTION consume_user_tokens(
    p_user_id UUID,
    p_tokens_to_consume INTEGER
)
RETURNS TABLE (
    consumed_tokens INTEGER,
    remaining_balance INTEGER,
    transaction_id UUID
) AS $$
DECLARE
    v_current_balance INTEGER;
    v_consumed_tokens INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Проверяем входные параметры
    IF p_tokens_to_consume <= 0 THEN
        RAISE EXCEPTION 'Количество токенов для списания должно быть больше нуля';
    END IF;

    -- Блокируем строку пользователя для обновления (защита от race condition)
    SELECT tokens INTO v_current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- Проверяем, найден ли пользователь
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Пользователь не найден';
    END IF;

    -- Если баланс уже ноль - возвращаем ошибку
    IF v_current_balance = 0 THEN
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

    -- Создаем запись в таблице транзакций
    INSERT INTO token_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        metadata
    ) VALUES (
        p_user_id::VARCHAR,
        -v_consumed_tokens,  -- Отрицательное значение для списания
        'usage',
        'Списание токенов за использование AI',
        jsonb_build_object(
            'requested_tokens', p_tokens_to_consume,
            'consumed_tokens', v_consumed_tokens,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance
        )
    )
    RETURNING id INTO v_transaction_id;

    -- Возвращаем результат
    RETURN QUERY SELECT 
        v_consumed_tokens,
        v_new_balance,
        v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к функции
COMMENT ON FUNCTION consume_user_tokens(UUID, INTEGER) IS 
'Списывает токены с баланса пользователя. Если баланса недостаточно - списывает остаток до нуля. Если баланс = 0, возвращает ошибку.';

-- Пример использования:
-- SELECT * FROM consume_user_tokens('user-uuid-here'::UUID, 1000);
-- Результат: consumed_tokens | remaining_balance | transaction_id
