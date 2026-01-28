-- Миграция для интеграции YooKassa с таблицей users
-- Дата: 2026-01-28

-- 1. Добавляем поле tokens в таблицу users (если еще не добавлено)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'tokens'
  ) THEN
    ALTER TABLE users ADD COLUMN tokens INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Создаем индекс для токенов
CREATE INDEX IF NOT EXISTS idx_users_tokens ON users(tokens);

-- 2. Обновляем функцию для добавления токенов пользователю
CREATE OR REPLACE FUNCTION add_user_tokens(
  p_user_id VARCHAR(255),
  p_amount INTEGER,
  p_transaction_type VARCHAR(50) DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_user_uuid UUID;
BEGIN
  -- Преобразуем user_id в UUID если нужно
  BEGIN
    v_user_uuid := p_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid user_id format: %', p_user_id;
  END;

  -- Создаем запись транзакции
  INSERT INTO token_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Обновляем баланс токенов пользователя
  UPDATE users
  SET 
    tokens = COALESCE(tokens, 0) + p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_uuid
  RETURNING tokens INTO v_new_balance;

  -- Если пользователь не найден
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Обновляем функцию для списания токенов
CREATE OR REPLACE FUNCTION deduct_user_tokens(
  p_user_id VARCHAR(255),
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_user_uuid UUID;
BEGIN
  -- Преобразуем user_id в UUID если нужно
  BEGIN
    v_user_uuid := p_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid user_id format: %', p_user_id;
  END;

  -- Получаем текущий баланс
  SELECT COALESCE(tokens, 0) INTO v_current_balance
  FROM users
  WHERE id = v_user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Проверяем, достаточно ли токенов
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens: current balance %, required %', v_current_balance, p_amount;
  END IF;

  -- Создаем запись транзакции (отрицательное значение)
  INSERT INTO token_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (p_user_id, -p_amount, 'usage', p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Списываем токены
  UPDATE users
  SET 
    tokens = tokens - p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_uuid
  RETURNING tokens INTO v_new_balance;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Обновляем функцию для получения баланса пользователя
CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
  v_user_uuid UUID;
BEGIN
  -- Преобразуем user_id в UUID если нужно
  BEGIN
    v_user_uuid := p_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;
  END;

  SELECT COALESCE(tokens, 0) INTO v_balance
  FROM users
  WHERE id = v_user_uuid;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. Обновляем представление для истории транзакций (если существует)
DROP VIEW IF EXISTS v_user_token_history;

CREATE OR REPLACE VIEW v_user_token_history AS
SELECT 
  tt.id,
  tt.user_id,
  u.email,
  u.name as user_name,
  tt.amount,
  tt.transaction_type,
  tt.description,
  tt.metadata,
  tt.created_at,
  CASE 
    WHEN tt.transaction_type = 'purchase' THEN tp.name
    ELSE NULL
  END as package_name,
  p.payment_id,
  p.status as payment_status
FROM token_transactions tt
LEFT JOIN users u ON u.id::TEXT = tt.user_id
LEFT JOIN payments p ON (tt.metadata->>'payment_id')::TEXT = p.payment_id
LEFT JOIN token_packages tp ON p.package_id = tp.code
ORDER BY tt.created_at DESC;

-- Комментарии
COMMENT ON COLUMN users.tokens IS 'Баланс токенов пользователя для использования AI функционала';
