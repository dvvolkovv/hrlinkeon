import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, ArrowLeft, Loader } from 'lucide-react';
import { saveTokens, saveRecruiterPhone } from '../lib/auth';
import { apiPost } from '../lib/api';

export function VerifyCode() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate('/login');
      return;
    }

    inputRefs.current[0]?.focus();

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phone, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });

    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (codeString: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiPost<any>(
        '/api/v2/auth/verify-code',
        { phone, code: codeString },
        { skipAuth: true }
      );

      console.log('Verify response:', { data });

      if (data.error) {
        throw new Error(data.error || data.message || 'Неверный код');
      }

      // Обработка успешного ответа с токенами
      // Формат 1: { success: true, data: { access_token, refresh_token, user_id } }
      if (data.success && data.data) {
        const tokenData = data.data;
        
        // Сохраняем токены и данные пользователя
        saveTokens({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          user_id: tokenData.user_id,
        });
        
        // Сохраняем номер телефона
        saveRecruiterPhone(phone);
        
        console.log(`[SUCCESS] Код ${codeString} подтвержден для ${phone}`);
        
        navigate('/recruiter');
        return;
      }

      // Формат 2: { "access-token": "...", "refresh-token": "..." } (с дефисами)
      if (data['access-token'] && data['refresh-token']) {
        const accessToken = data['access-token'];
        const refreshToken = data['refresh-token'];
        
        // Извлекаем user_id из access token
        let userId: string | undefined;
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
          userId = tokenPayload.user_id;
        } catch (e) {
          console.warn('Не удалось извлечь user_id из токена:', e);
        }
        
        // Сохраняем токены и данные пользователя
        saveTokens({
          access_token: accessToken,
          refresh_token: refreshToken,
          user_id: userId,
        });
        
        // Сохраняем номер телефона
        saveRecruiterPhone(phone);
        
        console.log(`[SUCCESS] Код ${codeString} подтвержден для ${phone}`);
        
        navigate('/recruiter');
        return;
      }

      // Формат 3: { access_token: "...", refresh_token: "..." } (с подчеркиваниями)
      if (data.access_token && data.refresh_token) {
        // Извлекаем user_id из access token если не пришел в ответе
        let userId = data.user_id;
        if (!userId) {
          try {
            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
            userId = tokenPayload.user_id;
          } catch (e) {
            console.warn('Не удалось извлечь user_id из токена:', e);
          }
        }
        
        saveTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user_id: userId,
        });
        
        saveRecruiterPhone(phone);
        
        console.log(`[SUCCESS] Код ${codeString} подтвержден для ${phone}`);
        
        navigate('/recruiter');
        return;
      }

      // Обратная совместимость - если структура ответа старая
      if (data.user_id) {
        console.log(`[SUCCESS] Код ${codeString} подтвержден для ${phone} (legacy format)`);
        saveTokens({
          user_id: data.user_id,
        });
        saveRecruiterPhone(phone);
        navigate('/recruiter');
        return;
      }

      throw new Error('Токены не получены от сервера');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при проверке кода');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');

    try {
      await apiPost<{ success: boolean; error?: string }>(
        '/api/v2/auth/send-code',
        { phone },
        { skipAuth: true }
      );

      console.log(`[SUCCESS] Повторная отправка SMS кода для ${phone}`);

      setResendTimer(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Введите код</h1>
          <p className="text-gray-600">
            Мы отправили SMS с кодом на номер<br />
            <span className="font-medium text-gray-900">{phone}</span>
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex gap-3 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={loading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-forest-500 focus:ring-2 focus:ring-forest-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
                {error && (
                  <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-forest-600">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Проверка кода...</span>
                </div>
              )}

              <div className="pt-6 border-t border-gray-200">
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Отправить код повторно через {resendTimer} сек
                    </p>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-forest-600 hover:text-forest-700"
                    >
                      Отправить код повторно
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Код действителен в течение 5 минут
          </p>
        </div>
      </div>
    </div>
  );
}
