-- ============================================
-- Автоматическое начисление 20000 токенов при создании пользователя
-- Дата: 2026-01-29
-- ============================================

-- 1. Обновляем дефолтное значение токенов в таблице users
ALTER TABLE users 
ALTER COLUMN tokens SET DEFAULT 20000;

-- 2. Создаем функцию триггера для автоматического начисления токенов
CREATE OR REPLACE FUNCTION grant_initial_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Устанавливаем начальный баланс 20000 токенов, если не указано другое значение
    IF NEW.tokens IS NULL OR NEW.tokens = 0 THEN
        NEW.tokens := 20000;
    END IF;
    
    -- Создаем запись транзакции о начислении welcome-бонуса
    -- Используем PERFORM вместо INSERT, чтобы не блокировать триггер
    PERFORM gen_random_uuid(); -- убеждаемся что функция доступна
    
    -- Вставляем транзакцию после создания пользователя (в AFTER триггере это безопаснее)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Создаем триггер BEFORE INSERT для установки начального баланса
DROP TRIGGER IF EXISTS set_initial_tokens_on_user_creation ON users;
CREATE TRIGGER set_initial_tokens_on_user_creation
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION grant_initial_tokens();

-- 4. Создаем функцию для AFTER INSERT триггера (запись транзакции)
-- Адаптированная под существующую структуру token_transactions (без balance_after)
CREATE OR REPLACE FUNCTION log_initial_tokens_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Записываем транзакцию о начислении welcome-бонуса
    -- Используем существующую структуру таблицы (без balance_after)
    INSERT INTO token_transactions (
        user_id,
        transaction_type,
        amount,
        description,
        metadata
    )
    VALUES (
        NEW.id::TEXT,
        'bonus',
        20000,
        'Welcome bonus: initial tokens grant',
        jsonb_build_object(
            'user_email', NEW.email,
            'user_name', COALESCE(NEW.name, 'Unknown'),
            'company', COALESCE(NEW.company, 'Unknown'),
            'current_balance', NEW.tokens,
            'granted_at', NOW()
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггер AFTER INSERT для логирования транзакции
DROP TRIGGER IF EXISTS log_initial_tokens_on_user_creation ON users;
CREATE TRIGGER log_initial_tokens_on_user_creation
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_initial_tokens_transaction();

-- 6. Опционально: обновляем существующих пользователей с нулевым балансом
-- (Раскомментируйте, если нужно обновить существующих пользователей)
/*
UPDATE users 
SET tokens = 20000 
WHERE tokens = 0 OR tokens IS NULL;

-- Создаем транзакции для всех обновленных пользователей
INSERT INTO token_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    metadata
)
SELECT 
    id::TEXT,
    'bonus',
    20000,
    tokens,
    'Retroactive welcome bonus',
    jsonb_build_object(
        'user_email', email,
        'user_name', COALESCE(name, 'Unknown'),
        'company', COALESCE(company, 'Unknown'),
        'granted_at', NOW(),
        'retroactive', true
    )
FROM users
WHERE tokens = 20000;
*/

-- ============================================
-- Комментарии
-- ============================================

COMMENT ON FUNCTION grant_initial_tokens() IS 'Автоматически устанавливает 20000 токенов при создании нового пользователя';
COMMENT ON FUNCTION log_initial_tokens_transaction() IS 'Логирует транзакцию о начислении welcome-бонуса при создании пользователя';

-- ============================================
-- Проверка работы триггера
-- ============================================

-- Для тестирования можно выполнить:
-- INSERT INTO users (email, password_hash, name, company, role)
-- VALUES ('test@example.com', 'hash_here', 'Test User', 'Test Company', 'hr')
-- RETURNING id, email, tokens;

-- Проверить транзакцию:
-- SELECT * FROM token_transactions 
-- WHERE user_id = (SELECT id::TEXT FROM users WHERE email = 'test@example.com')
-- ORDER BY created_at DESC LIMIT 1;
