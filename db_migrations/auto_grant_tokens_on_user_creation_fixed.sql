-- ============================================
-- Автоматическое начисление 20000 токенов при создании пользователя
-- ИСПРАВЛЕННАЯ ВЕРСИЯ под существующую схему БД
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
-- Адаптированная под существующую структуру token_transactions
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

-- ============================================
-- Комментарии
-- ============================================

COMMENT ON FUNCTION grant_initial_tokens() IS 'Автоматически устанавливает 20000 токенов при создании нового пользователя';
COMMENT ON FUNCTION log_initial_tokens_transaction() IS 'Логирует транзакцию о начислении welcome-бонуса при создании пользователя';

-- ============================================
-- Проверка работы триггера
-- ============================================

-- Для тестирования можно выполнить:
-- BEGIN;
-- INSERT INTO users (email, password_hash, name, company, role)
-- VALUES ('test@example.com', crypt('password', gen_salt('bf')), 'Test User', 'Test Company', 'hr')
-- RETURNING id, email, tokens;
-- ROLLBACK;

-- Проверить транзакцию:
-- SELECT * FROM token_transactions 
-- WHERE description = 'Welcome bonus: initial tokens grant'
-- ORDER BY created_at DESC LIMIT 1;
