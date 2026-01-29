import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Loader2, Coins, ArrowLeft } from 'lucide-react';
import { apiPost } from '../lib/api';

type PaymentStatus = 'checking' | 'success' | 'failed' | 'not_found';

interface VerifyResponse {
  status: string;
  tokens_added?: number;
  new_balance?: number;
  transaction_id?: string;
  message?: string;
}

export function TokensSuccess() {
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [paymentData, setPaymentData] = useState<VerifyResponse | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Заменяем текущую запись в истории, чтобы при нажатии "Назад" 
    // пользователь не возвращался на эту страницу
    window.history.replaceState(null, '', '/tokens/success');
    
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Получаем payment_id из URL параметров (приоритет) или localStorage
      let paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
      
      if (!paymentId) {
        // Если в URL нет, пробуем localStorage
        paymentId = localStorage.getItem('pending_payment_id');
      }

      if (!paymentId) {
        console.log('[TokensSuccess] No payment_id found in URL or localStorage');
        setStatus('not_found');
        return;
      }

      console.log(`[TokensSuccess] Verifying payment: ${paymentId}`);

      // Проверяем статус платежа
      const response = await apiPost<VerifyResponse>('/api/v2/yookassa/verify-payment', {
        payment_id: paymentId,
      });

      setPaymentData(response);

      if (response.status === 'succeeded') {
        setStatus('success');
        // Очищаем сохраненный payment_id
        localStorage.removeItem('pending_payment_id');
        console.log(`[TokensSuccess] Payment ${paymentId} succeeded, tokens added: ${response.tokens_added}`);
      } else if (response.status === 'pending' || response.status === 'waiting_for_capture') {
        // Платеж еще обрабатывается, повторяем через 2 секунды
        console.log(`[TokensSuccess] Payment ${paymentId} still ${response.status}, retrying...`);
        setTimeout(() => verifyPayment(), 2000);
      } else {
        setStatus('failed');
        console.log(`[TokensSuccess] Payment ${paymentId} failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('failed');
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-100 rounded-full mb-6">
              <Loader2 className="w-10 h-10 text-forest-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Проверяем статус платежа...
            </h2>
            <p className="text-gray-600">
              Это займет всего несколько секунд
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Оплата прошла успешно!
            </h2>
            <p className="text-gray-600 mb-6">
              Токены начислены на ваш аккаунт
            </p>

            {paymentData && (
              <div className="max-w-md mx-auto space-y-4">
                {paymentData.tokens_added && (
                  <div className="flex items-center justify-between p-4 bg-forest-50 rounded-lg">
                    <span className="text-gray-700">Начислено токенов:</span>
                    <span className="text-xl font-bold text-forest-600">
                      +{formatNumber(paymentData.tokens_added)}
                    </span>
                  </div>
                )}

                {paymentData.new_balance !== undefined && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Новый баланс:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatNumber(paymentData.new_balance)}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/buy-tokens', { replace: true })}
                    className="flex-1"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Купить еще
                  </Button>
                  <Button
                    onClick={() => navigate('/recruiter', { replace: true })}
                    className="flex-1"
                  >
                    К вакансиям
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Платеж не завершен
            </h2>
            <p className="text-gray-600 mb-6">
              {paymentData?.message || 'Платеж был отменен или произошла ошибка'}
            </p>

            <div className="flex gap-3 max-w-md mx-auto">
              <Button
                variant="outline"
                onClick={() => navigate('/recruiter', { replace: true })}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                К вакансиям
              </Button>
              <Button
                onClick={() => verifyPayment()}
                className="flex-1"
              >
                Проверить еще раз
              </Button>
            </div>
          </div>
        );

      case 'not_found':
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <XCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Платеж не найден
            </h2>
            <p className="text-gray-600 mb-6">
              Информация о платеже не найдена
            </p>

            <Button
              onClick={() => navigate('/recruiter', { replace: true })}
              className="mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К вакансиям
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>

        {status !== 'checking' && (
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/recruiter', { replace: true })}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К вакансиям
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
