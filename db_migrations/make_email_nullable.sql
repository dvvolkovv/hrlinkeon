-- ============================================
-- Сделать поле email необязательным в таблице users
-- Дата: 2026-01-29
-- ============================================

-- Описание:
-- Email становится необязательным полем, что позволяет:
-- 1. Регистрацию только по телефону
-- 2. Несколько пользователей с NULL email
-- 3. Уникальность только для НЕ-NULL email

-- ============================================
-- 1. Убираем NOT NULL constraint с email
-- ============================================
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- ============================================
-- 2. Пересоздаем уникальный индекс как частичный
-- ============================================
-- Удаляем старый constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Создаем частичный уникальный индекс (только для НЕ-NULL значений)
CREATE UNIQUE INDEX users_email_key ON users (email) WHERE email IS NOT NULL;

-- ============================================
-- Комментарии
-- ============================================
COMMENT ON COLUMN users.email IS 'Email пользователя (необязательное поле, может быть NULL)';

-- ============================================
-- Проверка
-- ============================================
-- Проверить структуру:
-- \d users

-- Проверить индексы:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'users' AND indexname LIKE '%email%';

-- ============================================
-- Примеры использования
-- ============================================

-- Пример 1: Регистрация только по телефону (email = NULL)
-- INSERT INTO users (email, password_hash, phone, role)
-- VALUES (NULL, crypt('+79001234567', gen_salt('bf')), '+79001234567', 'hr')
-- RETURNING id, email, phone, tokens;

-- Пример 2: Регистрация с email
-- INSERT INTO users (email, password_hash, phone, role)
-- VALUES ('user@example.com', crypt('password', gen_salt('bf')), '+79001234567', 'hr')
-- ON CONFLICT (email) WHERE email IS NOT NULL DO UPDATE
-- SET phone = EXCLUDED.phone
-- RETURNING id, email, phone, tokens;

-- Пример 3: Регистрация по телефону с конфликтом
-- INSERT INTO users (email, password_hash, phone, role)
-- VALUES (NULL, crypt('+79001234567', gen_salt('bf')), '+79001234567', 'hr')
-- ON CONFLICT (phone) WHERE phone IS NOT NULL DO UPDATE
-- SET password_hash = EXCLUDED.password_hash
-- RETURNING id, email, phone, tokens;
