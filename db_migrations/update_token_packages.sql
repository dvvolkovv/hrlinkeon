-- Обновление пакетов токенов в соответствии с фронтендом
-- Дата: 2026-01-28

-- Удаляем старые пакеты
DELETE FROM token_packages;

-- Добавляем правильные пакеты в соответствии с https://hr.linkeon.io/buy-tokens
INSERT INTO token_packages (code, name, tokens, price_rub, description, is_active)
VALUES 
  ('starter', 'Стартовый', 50000, 199.00, 'Базовый пакет для начала работы с AI-ассистентами', TRUE),
  ('professional', 'Профессиональный', 200000, 499.00, 'Оптимальный пакет для активного использования AI', TRUE),
  ('business', 'Бизнес', 1000000, 1999.00, 'Расширенный пакет для компаний с высокой нагрузкой', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tokens = EXCLUDED.tokens,
  price_rub = EXCLUDED.price_rub,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- Проверяем результат
SELECT 
  code,
  name,
  tokens,
  price_rub,
  is_active
FROM token_packages
ORDER BY price_rub ASC;
