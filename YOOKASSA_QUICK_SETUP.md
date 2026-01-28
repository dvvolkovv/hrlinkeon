# YooKassa - Быстрая настройка для HR Linkeon

## 🔑 Credentials

### Production (Live):
```
Secret Key: live_SsGIMIi9bRnW021fpc0Ruc5DV_7VxIEBnIzYuXZrE60
Shop ID: [нужно получить из личного кабинета YooKassa]
```

## 📝 Чек-лист настройки

### 1. ✅ База данных
- [x] Таблицы созданы (`token_packages`, `payments`, `token_transactions`)
- [x] Поле `tokens` добавлено в таблицу `users`
- [x] Функции созданы (`add_user_tokens`, `deduct_user_tokens`, `get_user_token_balance`)
- [x] Базовые пакеты токенов добавлены

### 2. ⏳ n8n Workflows (нужно импортировать)
- [ ] HR YooKassa Create Payment
- [ ] HR YooKassa Notification Webhook
- [ ] HR YooKassa Verify Payment
- [ ] HR Get Token Packages
- [ ] HR Get User Balance

**Файлы для импорта находятся в:** `/Users/dmitry/Downloads/`

### 3. ⏳ n8n Credentials (нужно настроить)

#### Шаг 1: Получить Shop ID
1. Открыть: https://yookassa.ru/my
2. Перейти: **Интеграция** → **API ключи**
3. Скопировать **shopId** (числовой ID)

#### Шаг 2: Создать credential в n8n
1. n8n → **Credentials** → **Create New**
2. Выбрать: **HTTP Basic Auth**
3. Заполнить:
   ```
   Name: YOOKASSA
   User: [ваш shopId]
   Password: live_SsGIMIi9bRnW021fpc0Ruc5DV_7VxIEBnIzYuXZrE60
   ```
4. Сохранить

### 4. ⏳ Настройка webhook в YooKassa
1. Открыть: https://yookassa.ru/my
2. Перейти: **Настройки** → **Уведомления**
3. Добавить URL:
   ```
   https://nomira-ai-test.up.railway.app/webhook/api/v2/yookassa/notification
   ```
4. Выбрать события:
   - ✅ payment.succeeded
   - ✅ payment.canceled
   - ✅ refund.succeeded
5. Сохранить

### 5. ⏳ Активация workflows
После импорта workflows в n8n, активировать их:
- [ ] HR YooKassa Create Payment → **Active: ON**
- [ ] HR YooKassa Notification Webhook → **Active: ON**
- [ ] HR YooKassa Verify Payment → **Active: ON**
- [ ] HR Get Token Packages → **Active: ON**
- [ ] HR Get User Balance → **Active: ON**

## 🧪 Тестирование

### Быстрый тест:

#### 1. Проверить список пакетов:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://nomira-ai-test.up.railway.app/webhook/api/v2/token-packages
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": [
    {
      "code": "starter",
      "name": "Стартовый",
      "tokens": 50000,
      "price_rub": 199.00
    },
    {
      "code": "professional",
      "name": "Профессиональный",
      "tokens": 200000,
      "price_rub": 499.00
    },
    {
      "code": "business",
      "name": "Бизнес",
      "tokens": 1000000,
      "price_rub": 1999.00
    }
  ]
}
```

#### 2. Создать тестовый платеж:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package_id":"starter","email":"test@example.com"}' \
  https://nomira-ai-test.up.railway.app/webhook/api/v2/yookassa/create-payment
```

**Ожидаемый ответ:**
```json
{
  "payment_id": "2d84xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "confirmation_url": "https://yoomoney.ru/checkout/payments/v2/...",
  "status": "pending"
}
```

#### 3. Проверить баланс пользователя:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://nomira-ai-test.up.railway.app/webhook/api/v2/user/balance
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "tokens": 0,
    "usage_stats": {
      "usage_count_30d": 0,
      "tokens_used_30d": 0
    }
  }
}
```

## 🎯 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/webhook/api/v2/token-packages` | Список пакетов токенов |
| GET | `/webhook/api/v2/user/balance` | Баланс токенов пользователя |
| POST | `/webhook/api/v2/yookassa/create-payment` | Создать платеж |
| POST | `/webhook/api/v2/yookassa/verify-payment` | Проверить статус платежа |
| POST | `/webhook/api/v2/yookassa/notification` | Webhook от YooKassa (не вызывать вручную) |

**Полные URL:**
- `https://nomira-ai-test.up.railway.app/webhook/api/v2/token-packages`
- `https://nomira-ai-test.up.railway.app/webhook/api/v2/user/balance`
- `https://nomira-ai-test.up.railway.app/webhook/api/v2/yookassa/create-payment`
- `https://nomira-ai-test.up.railway.app/webhook/api/v2/yookassa/verify-payment`
- `https://nomira-ai-test.up.railway.app/webhook/api/v2/yookassa/notification`

## 🚨 Частые проблемы

### Ошибка: "PACKAGE_NOT_FOUND"
**Решение:** Проверить, что пакеты токенов добавлены в БД:
```sql
SELECT * FROM token_packages WHERE is_active = TRUE;
```

### Ошибка: "User not found"
**Решение:** Убедиться, что JWT токен содержит корректный `user_internal_id`

### Ошибка: "Unauthorized" (401)
**Решение:** 
1. Проверить формат токена: `Bearer YOUR_JWT_TOKEN`
2. Убедиться, что workflow "common Check JWT" активен

### Webhook не срабатывает
**Решение:**
1. Проверить, что workflow "HR YooKassa Notification Webhook" активен
2. Проверить URL в настройках YooKassa
3. Проверить логи n8n

## 📦 Пакеты токенов

В БД доступны следующие тарифы:

| Название | Токены | Цена | Код |
|----------|--------|------|-----|
| 🟢 Стартовый | 50,000 | 199₽ | `starter` |
| 🔵 Профессиональный | 200,000 | 499₽ | `professional` |
| 🟣 Бизнес | 1,000,000 | 1,999₽ | `business` |

**Примерный расход токенов:**
- 1 диалог с кандидатом ≈ 500-1000 токенов
- Составление вакансии ≈ 300-500 токенов

---

## 📞 Следующие шаги

После успешной настройки бэкенда:
1. ~~Создать фронтенд страницу с каталогом пакетов~~ ✅ (уже существует: `/buy-tokens`)
2. Интегрировать реальный API вместо моковых данных в `BuyTokens.tsx`
3. Добавить отображение баланса токенов в шапке
4. Реализовать списание токенов при использовании AI
5. Настроить уведомления о низком балансе

---

**Подробная документация:** `YOOKASSA_INTEGRATION.md`
