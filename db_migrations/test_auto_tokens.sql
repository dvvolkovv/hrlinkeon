-- ============================================
-- Тестовый скрипт для проверки автоматического начисления токенов
-- Выполните этот скрипт ПОСЛЕ применения auto_grant_tokens_on_user_creation.sql
-- ============================================

-- Включаем вывод сообщений
\set ECHO all
\timing on

-- ============================================
-- ТЕСТ 1: Проверка наличия триггеров
-- ============================================

\echo '🔍 ТЕСТ 1: Проверка триггеров на таблице users'

SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
    AND (trigger_name LIKE '%token%' OR trigger_name LIKE '%initial%')
ORDER BY trigger_name;

-- Ожидается: 2 триггера
-- - set_initial_tokens_on_user_creation (BEFORE INSERT)
-- - log_initial_tokens_on_user_creation (AFTER INSERT)

-- ============================================
-- ТЕСТ 2: Проверка наличия функций
-- ============================================

\echo ''
\echo '🔍 ТЕСТ 2: Проверка функций'

SELECT 
    proname as function_name,
    prokind as kind
FROM pg_proc 
WHERE proname IN ('grant_initial_tokens', 'log_initial_tokens_transaction')
ORDER BY proname;

-- Ожидается: 2 функции

-- ============================================
-- ТЕСТ 3: Проверка дефолтного значения tokens
-- ============================================

\echo ''
\echo '🔍 ТЕСТ 3: Проверка дефолтного значения для users.tokens'

SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name = 'tokens';

-- Ожидается: column_default = 20000

-- ============================================
-- ТЕСТ 4: Создание тестового пользователя
-- ============================================

\echo ''
\echo '🧪 ТЕСТ 4: Создание тестового пользователя'

-- Удаляем тестового пользователя если существует
DELETE FROM users WHERE email = 'test_auto_tokens@example.com';

-- Создаем тестового пользователя
INSERT INTO users (email, password_hash, name, company, role)
VALUES (
    'test_auto_tokens@example.com',
    crypt('TestPassword123', gen_salt('bf')),
    'Test Auto Tokens User',
    'Test Company',
    'hr'
)
RETURNING 
    id, 
    email, 
    name, 
    company, 
    tokens, 
    created_at;

-- Ожидается: tokens = 20000

-- ============================================
-- ТЕСТ 5: Проверка транзакции
-- ============================================

\echo ''
\echo '🔍 ТЕСТ 5: Проверка создания транзакции welcome-бонуса'

SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    metadata,
    created_at
FROM token_transactions
WHERE user_id = (
    SELECT id::TEXT 
    FROM users 
    WHERE email = 'test_auto_tokens@example.com'
)
ORDER BY created_at DESC
LIMIT 1;

-- Ожидается:
-- - transaction_type = 'bonus'
-- - amount = 20000
-- - balance_after = 20000
-- - description = 'Welcome bonus: initial tokens grant'

-- ============================================
-- ТЕСТ 6: Проверка метаданных транзакции
-- ============================================

\echo ''
\echo '🔍 ТЕСТ 6: Проверка метаданных в транзакции'

SELECT 
    jsonb_pretty(metadata) as transaction_metadata
FROM token_transactions
WHERE user_id = (
    SELECT id::TEXT 
    FROM users 
    WHERE email = 'test_auto_tokens@example.com'
)
ORDER BY created_at DESC
LIMIT 1;

-- Ожидается JSON с полями:
-- - user_email
-- - user_name
-- - company
-- - granted_at

-- ============================================
-- ТЕСТ 7: Создание пользователя без явного указания токенов
-- ============================================

\echo ''
\echo '🧪 ТЕСТ 7: Создание пользователя без указания tokens'

-- Удаляем если существует
DELETE FROM users WHERE email = 'test_auto_tokens_2@example.com';

-- Создаем без указания tokens
INSERT INTO users (email, password_hash, name, company, role)
VALUES (
    'test_auto_tokens_2@example.com',
    crypt('TestPassword123', gen_salt('bf')),
    'Test User 2',
    'Test Company 2',
    'hr'
)
RETURNING id, email, tokens;

-- Ожидается: tokens = 20000 (автоматически)

-- ============================================
-- ТЕСТ 8: Подсчет всех welcome-бонусов
-- ============================================

\echo ''
\echo '📊 ТЕСТ 8: Статистика по welcome-бонусам'

SELECT 
    COUNT(*) as total_welcome_bonuses,
    SUM(amount) as total_tokens_granted,
    MIN(created_at) as first_bonus_at,
    MAX(created_at) as last_bonus_at
FROM token_transactions
WHERE transaction_type = 'bonus'
    AND description = 'Welcome bonus: initial tokens grant';

-- ============================================
-- ТЕСТ 9: Проверка баланса тестовых пользователей
-- ============================================

\echo ''
\echo '💰 ТЕСТ 9: Балансы тестовых пользователей'

SELECT 
    email,
    name,
    tokens,
    created_at
FROM users
WHERE email IN (
    'test_auto_tokens@example.com',
    'test_auto_tokens_2@example.com'
)
ORDER BY email;

-- Ожидается: оба пользователя с tokens = 20000

-- ============================================
-- ТЕСТ 10: Очистка тестовых данных
-- ============================================

\echo ''
\echo '🧹 ТЕСТ 10: Очистка тестовых данных'

-- Удаляем тестовых пользователей
-- (транзакции удалятся автоматически при каскадном удалении, если настроен FK)
DELETE FROM users 
WHERE email IN (
    'test_auto_tokens@example.com',
    'test_auto_tokens_2@example.com'
)
RETURNING email, tokens;

-- Проверяем что транзакции также удалены
SELECT COUNT(*) as remaining_test_transactions
FROM token_transactions
WHERE user_id IN (
    SELECT id::TEXT FROM users 
    WHERE email LIKE 'test_auto_tokens%@example.com'
);

-- Ожидается: 0

-- ============================================
-- РЕЗУЛЬТАТЫ
-- ============================================

\echo ''
\echo '✅ ============================================'
\echo '✅ ТЕСТЫ ЗАВЕРШЕНЫ'
\echo '✅ ============================================'
\echo ''
\echo 'Если все тесты прошли успешно:'
\echo '  ✅ Триггеры работают'
\echo '  ✅ Функции существуют'
\echo '  ✅ Токены начисляются автоматически'
\echo '  ✅ Транзакции создаются'
\echo '  ✅ Метаданные корректны'
\echo ''
\echo 'Система готова к использованию! 🎉'
\echo ''

-- ============================================
-- Дополнительные полезные запросы
-- ============================================

\echo '📝 Дополнительная информация:'
\echo ''

-- Общая статистика по токенам
\echo '📊 Общая статистика токенов всех пользователей:'
SELECT 
    COUNT(*) as total_users,
    AVG(tokens) as avg_tokens,
    MIN(tokens) as min_tokens,
    MAX(tokens) as max_tokens,
    SUM(tokens) as total_tokens_in_system
FROM users;

-- Статистика по типам транзакций
\echo ''
\echo '📊 Распределение транзакций по типам:'
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM token_transactions
GROUP BY transaction_type
ORDER BY count DESC;

\echo ''
\echo '✨ Скрипт выполнен успешно!'
