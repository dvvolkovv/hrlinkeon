import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Coins, Check, Zap, TrendingUp, Award } from 'lucide-react';

interface Tariff {
  id: string;
  name: string;
  tokens: number;
  price: number;
  sort_order: number;
}

interface TokenBalance {
  balance: number;
  total_purchased: number;
  total_consumed: number;
}

export function BuyTokens() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      const mockTariffs: Tariff[] = [
        { id: '1', name: 'Стартовый', tokens: 50000, price: 199, sort_order: 1 },
        { id: '2', name: 'Профессиональный', tokens: 200000, price: 499, sort_order: 2 },
        { id: '3', name: 'Бизнес', tokens: 1000000, price: 1999, sort_order: 3 },
      ];
      setTariffs(mockTariffs);

      const storedBalance = localStorage.getItem('token_balance');
      const currentBalance = storedBalance ? parseInt(storedBalance) : 0;

      setBalance({
        balance: currentBalance,
        total_purchased: currentBalance,
        total_consumed: 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tariff: Tariff) => {
    setPurchasing(tariff.id);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBalance = (balance?.balance || 0) + tariff.tokens;

      localStorage.setItem('token_balance', newBalance.toString());

      console.log(`[DEMO MODE] Куплено ${formatNumber(tariff.tokens)} токенов. Новый баланс: ${formatNumber(newBalance)}`);

      await loadData();
      alert(`Успешно! Вы приобрели ${formatNumber(tariff.tokens)} токенов`);
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      alert('Произошла ошибка при покупке токенов');
    } finally {
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
            <Card className="max-w-md mx-auto">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Текущий баланс</p>
                  <p className="text-4xl font-bold text-forest-600">{formatNumber(balance.balance)}</p>
                  <p className="text-sm text-gray-500 mt-2">токенов</p>
                </div>
              </CardContent>
            </Card>
          )}
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
                    <span className="text-4xl font-bold text-gray-900">{tariff.price}</span>
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
                    disabled={purchasing !== null}
                    onClick={() => handlePurchase(tariff)}
                  >
                    {purchasing === tariff.id ? 'Обработка...' : 'Купить'}
                  </Button>
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
              <div className="mt-6 p-4 bg-white rounded-lg border border-forest-200">
                <p className="text-sm text-gray-700 text-center">
                  <strong>Примерный расход:</strong> 1 диалог с кандидатом ≈ 500-1000 токенов,
                  составление вакансии ≈ 300-500 токенов
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
