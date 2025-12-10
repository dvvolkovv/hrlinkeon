import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DocumentContent } from '../components/DocumentContent';
import { Phone, ArrowRight, Loader } from 'lucide-react';

export function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [openModal, setOpenModal] = useState<'privacy' | 'terms' | 'services' | null>(null);
  const navigate = useNavigate();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';

    let numbers = cleaned;
    if (cleaned[0] === '8') {
      numbers = '7' + cleaned.slice(1);
    } else if (cleaned[0] !== '7') {
      numbers = '7' + cleaned;
    }

    numbers = numbers.slice(0, 11);

    let formatted = '+7';
    if (numbers.length > 1) {
      formatted += ' (' + numbers.slice(1, 4);
      if (numbers.length > 4) {
        formatted += ') ' + numbers.slice(4, 7);
        if (numbers.length > 7) {
          formatted += '-' + numbers.slice(7, 9);
          if (numbers.length > 9) {
            formatted += '-' + numbers.slice(9, 11);
          }
        }
      }
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned[0] === '7';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      setError('Введите корректный номер телефона');
      return;
    }

    if (!agreed) {
      setError('Необходимо принять условия соглашений');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanPhone = '+' + phone.replace(/\D/g, '');
      const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;

      if (!hrLinkeonUrl) {
        throw new Error('HR Linkeon URL не настроен');
      }

      const sendCodeUrl = `${hrLinkeonUrl}/webhook/api/auth/send-code`;

      const response = await fetch(sendCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      console.log(`[SUCCESS] SMS код отправлен на ${cleanPhone}`);

      navigate('/verify-code', { state: { phone: cleanPhone } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl mb-4 shadow-lg">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h1>
          <p className="text-gray-600">Введите номер телефона для входа</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Номер телефона
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      setError('');
                    }}
                    className="mt-1 w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-500 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    Мне больше 18 лет, принимаю{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenModal('terms');
                      }}
                      className="text-forest-600 hover:text-forest-700 underline font-medium"
                    >
                      Пользовательское соглашение
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenModal('privacy');
                      }}
                      className="text-forest-600 hover:text-forest-700 underline font-medium"
                    >
                      Политику конфиденциальности
                    </button>{' '}
                    и даю согласие на обработку персональных данных
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setOpenModal('services')}
                  className="text-sm text-forest-600 hover:text-forest-700 underline font-medium"
                >
                  Описание услуг и порядок оплаты
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !phone || !agreed}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Отправка кода...
                  </>
                ) : (
                  <>
                    Получить код
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Мы отправим вам SMS с кодом подтверждения для входа в систему
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            HR Linkeon - современная система подбора персонала
          </p>
        </div>
      </div>

      <Modal
        isOpen={openModal === 'privacy'}
        onClose={() => setOpenModal(null)}
        title="Политика конфиденциальности"
      >
        <DocumentContent type="privacy" />
      </Modal>

      <Modal
        isOpen={openModal === 'terms'}
        onClose={() => setOpenModal(null)}
        title="Пользовательское соглашение"
      >
        <DocumentContent type="terms" />
      </Modal>

      <Modal
        isOpen={openModal === 'services'}
        onClose={() => setOpenModal(null)}
        title="Описание услуг и порядок оплаты"
      >
        <DocumentContent type="services" />
      </Modal>
    </div>
  );
}
