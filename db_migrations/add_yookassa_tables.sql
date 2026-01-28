-- Миграция для добавления YooKassa функционала
-- Дата: 2026-01-28

-- 1. Создаем таблицу пакетов токенов
CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tokens INTEGER NOT NULL,
  price_rub DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индекс для быстрого поиска активных пакетов
CREATE INDEX IF NOT EXISTS idx_token_packages_code_active ON token_packages(code, is_active);

-- 2. Создаем таблицу платежей
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  payment_id VARCHAR(255) UNIQUE NOT NULL, -- ID платежа от YooKassa
  package_id VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  tokens INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, canceled
  payment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_package FOREIGN KEY (package_id) REFERENCES token_packages(code) ON DELETE SET NULL
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 3. Создаем таблицу транзакций токенов
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- Количество токенов (может быть отрицательным для списания)
  transaction_type VARCHAR(50) NOT NULL, -- purchase, usage, refund, bonus
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- 4. Добавляем поле tokens в таблицу ai_profiles_consolidated (если еще не добавлено)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_profiles_consolidated' 
    AND column_name = 'tokens'
  ) THEN
    ALTER TABLE ai_profiles_consolidated ADD COLUMN tokens INTEGER DEFAULT 0;
  END IF;
END $$;

-- Создаем индекс для токенов
CREATE INDEX IF NOT EXISTS idx_ai_profiles_tokens ON ai_profiles_consolidated(tokens);

-- 5. Создаем функцию для добавления токенов пользователю
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
BEGIN
  -- Создаем запись транзакции
  INSERT INTO token_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Обновляем баланс токенов пользователя
  UPDATE ai_profiles_consolidated
  SET 
    tokens = COALESCE(tokens, 0) + p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
  RETURNING tokens INTO v_new_balance;

  -- Если пользователь не найден, создаем запись
  IF NOT FOUND THEN
    INSERT INTO ai_profiles_consolidated (user_id, tokens)
    VALUES (p_user_id, p_amount)
    RETURNING tokens INTO v_new_balance;
  END IF;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Создаем функцию для списания токенов
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
BEGIN
  -- Получаем текущий баланс
  SELECT COALESCE(tokens, 0) INTO v_current_balance
  FROM ai_profiles_consolidated
  WHERE user_id = p_user_id;

  -- Проверяем, достаточно ли токенов
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens: current balance %, required %', v_current_balance, p_amount;
  END IF;

  -- Создаем запись транзакции (отрицательное значение)
  INSERT INTO token_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (p_user_id, -p_amount, 'usage', p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Списываем токены
  UPDATE ai_profiles_consolidated
  SET 
    tokens = tokens - p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
  RETURNING tokens INTO v_new_balance;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Вставляем базовые пакеты токенов
INSERT INTO token_packages (code, name, tokens, price_rub, description, is_active)
VALUES 
  ('starter', 'Стартовый', 1000, 500.00, 'Базовый пакет для начала работы', TRUE),
  ('professional', 'Профессиональный', 5000, 2000.00, 'Оптимальный пакет для активного использования', TRUE),
  ('business', 'Бизнес', 15000, 5000.00, 'Расширенный пакет для компаний', TRUE),
  ('enterprise', 'Корпоративный', 50000, 15000.00, 'Максимальный пакет для крупного бизнеса', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 8. Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблицам
DO $$ 
BEGIN
  -- Для token_packages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_token_packages_updated_at') THEN
    CREATE TRIGGER update_token_packages_updated_at
      BEFORE UPDATE ON token_packages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Для payments
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 9. Создаем представление для истории транзакций с деталями
CREATE OR REPLACE VIEW v_user_token_history AS
SELECT 
  tt.id,
  tt.user_id,
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
LEFT JOIN payments p ON (tt.metadata->>'payment_id')::TEXT = p.payment_id
LEFT JOIN token_packages tp ON p.package_id = tp.code
ORDER BY tt.created_at DESC;

-- 10. Создаем функцию для получения баланса пользователя
CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(tokens, 0) INTO v_balance
  FROM ai_profiles_consolidated
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE token_packages IS 'Пакеты токенов для покупки через YooKassa';
COMMENT ON TABLE payments IS 'История платежей через YooKassa';
COMMENT ON TABLE token_transactions IS 'История всех транзакций с токенами (покупка, использование, возврат)';
COMMENT ON COLUMN payments.status IS 'Статус платежа: pending, succeeded, failed, canceled';
COMMENT ON COLUMN token_transactions.amount IS 'Количество токенов (положительное - начисление, отрицательное - списание)';
