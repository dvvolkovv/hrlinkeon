import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, ArrowLeft, Loader } from 'lucide-react';

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
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockRecruiterId = 'demo-recruiter-' + Date.now();

      console.log(`[DEMO MODE] Код ${codeString} принят для ${phone}`);

      localStorage.setItem('recruiter_id', mockRecruiterId);
      localStorage.setItem('recruiter_phone', phone);
      navigate('/recruiter');
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
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log(`[DEMO MODE] Повторная отправка SMS кода для ${phone}: 123456`);

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
