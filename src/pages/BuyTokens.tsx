import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Coins, Check, Zap, TrendingUp, Award } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

interface Tariff {
  id: string;
  code: string;
  name: string;
  tokens: number;
  price_rub: number;
  description?: string;
  is_active: boolean;
}

interface TokenBalance {
  user_id: string;
  email: string;
  name: string;
  tokens: number;
  usage_stats: {
    usage_count_30d: number;
    tokens_used_30d: number;
  };
}

export function BuyTokens() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [balanceUpdating, setBalanceUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Автоматическое обновление баланса токенов каждые 10 секунд
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setBalanceUpdating(true);
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const balanceResponse = await apiGet<{ success: boolean; data: TokenBalance }>('/api/v2/user/balance');
        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } catch (error) {
        console.error('Error loading token balance:', error);
      } finally {
        // Задержка для видимости анимации
        setTimeout(() => setBalanceUpdating(false), 300);
      }
    };

    // Загружаем баланс сразу
    loadBalance();

    // Устанавливаем интервал для обновления каждые 10 секунд
    const intervalId = setInterval(loadBalance, 10000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const loadData = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Загружаем пакеты токенов
      const packagesResponse = await apiGet<{ success: boolean; data: Tariff[] }>('/api/v2/token-packages');
      if (packagesResponse.success && packagesResponse.data) {
        setTariffs(packagesResponse.data);
      }

      // Загружаем баланс пользователя
      const balanceResponse = await apiGet<{ success: boolean; data: TokenBalance }>('/api/v2/user/balance');
      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
        // Автоматически подставляем email пользователя только если он валидный
        if (balanceResponse.data.email && !email && validateEmail(balanceResponse.data.email)) {
          setEmail(balanceResponse.data.email);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Ошибка при загрузке данных. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tariff: Tariff) => {
    // Валидация email перед покупкой
    if (!email || !validateEmail(email)) {
      setEmailError('Пожалуйста, введите корректный email для получения чека');
      return;
    }

    setEmailError('');
    setPurchasing(tariff.id);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Создаем платеж через YooKassa с указанным email
      const paymentResponse = await apiPost<{
        payment_id: string;
        confirmation_url: string;
        status: string;
      }>('/api/v2/yookassa/create-payment', {
        package_id: tariff.code,
        email: email.trim(),
      });

      if (paymentResponse.confirmation_url) {
        // Сохраняем payment_id в localStorage для проверки на странице успеха
        localStorage.setItem('pending_payment_id', paymentResponse.payment_id);
        
        // Перенаправляем пользователя на страницу оплаты YooKassa
        window.location.href = paymentResponse.confirmation_url;
      } else {
        throw new Error('Не удалось получить URL для оплаты');
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      alert('Произошла ошибка при создании платежа. Попробуйте еще раз.');
      setPurchasing(null);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getTariffIcon = (index: number) => {
    const icons = [Zap, TrendingUp, Award];
    const Icon = icons[index] || Coins;
    return Icon;
  };

  const getTariffColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-amber-500 to-amber-600',
    ];
    return colors[index] || 'from-forest-500 to-forest-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl mb-4 shadow-lg">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Покупка токенов</h1>
          <p className="text-lg text-gray-600 mb-6">
            Токены используются для работы AI-ассистентов по подбору персонала
          </p>

          {balance && (
            <Card className="max-w-md mx-auto mb-6">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Текущий баланс
                    {balanceUpdating && <span className="ml-1 inline-block w-1 h-1 bg-forest-500 rounded-full animate-pulse"></span>}
                  </p>
                  <p className={`text-4xl font-bold text-forest-600 transition-all duration-300 ${balanceUpdating ? 'scale-105' : 'scale-100'}`}>
                    {formatNumber(balance.tokens)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">токенов</p>
                  {balance.usage_stats && balance.usage_stats.tokens_used_30d > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Использовано за 30 дней: {formatNumber(balance.usage_stats.tokens_used_30d)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="max-w-md mx-auto">
            <CardContent className="py-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email для получения чека <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-forest-500'
                }`}
                required
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                На этот email будет отправлен чек после успешной оплаты
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tariffs.map((tariff, index) => {
            const Icon = getTariffIcon(index);
            const colorClass = getTariffColor(index);
            const isPopular = index === 1;

            return (
              <Card
                key={tariff.id}
                className={`relative ${isPopular ? 'ring-2 ring-forest-500 shadow-xl' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="success" className="shadow-lg">
                      Популярный
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tariff.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{tariff.price_rub}</span>
                    <span className="text-gray-600 ml-2">₽</span>
                  </div>
                  <div className="py-3 px-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-forest-600">{formatNumber(tariff.tokens)}</p>
                    <p className="text-sm text-gray-600">токенов</p>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        AI скрининг кандидатов
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        Генерация вакансий
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        Анализ совпадений
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        Безлимитное хранение
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full"
                    disabled={purchasing !== null || !email || !validateEmail(email)}
                    onClick={() => handlePurchase(tariff)}
                  >
                    {purchasing === tariff.id ? 'Обработка...' : 'Купить'}
                  </Button>
                  {!email && (
                    <p className="text-xs text-amber-600 mt-2 text-center">
                      Укажите email выше для покупки
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-forest-50 to-warm-50 border-forest-200">
          <CardContent className="py-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Как используются токены?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-forest-500 text-white rounded-lg flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Скрининг кандидатов</h4>
                    <p className="text-sm text-gray-600">
                      AI-ассистент общается с кандидатами и оценивает их соответствие вакансии
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-forest-500 text-white rounded-lg flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Составление вакансий</h4>
                    <p className="text-sm text-gray-600">
                      Автоматическая генерация описаний вакансий на основе ваших требований
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
