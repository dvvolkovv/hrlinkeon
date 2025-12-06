import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface CandidateStatusResponse {
  success: boolean;
  status: 'pending' | 'screening' | 'approved' | 'rejected' | 'completed';
  message?: string;
  details?: {
    screening_url?: string;
    interview_completed?: boolean;
    rejection_reason?: string;
  };
}

export function CandidateStatus() {
  const { publicLink, candidateId } = useParams<{ publicLink: string; candidateId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CandidateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [publicLink, candidateId]);

  const loadStatus = async () => {
    try {
      const response = await fetch(
        `https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-candidate-status/public/vacancies/${publicLink}/candidates/${candidateId}/status`
      );

      if (!response.ok) {
        throw new Error('Не удалось загрузить статус');
      }

      const data: CandidateStatusResponse = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (status?.details?.screening_url) {
      window.location.href = status.details.screening_url;
    }
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка статуса...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadStatus}>Попробовать снова</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStatusContent = () => {
    if (!status) return null;

    switch (status.status) {
      case 'pending':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Ваша заявка обрабатывается
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {status.message || 'Пожалуйста, подождите. Мы анализируем ваше резюме и скоро предоставим дальнейшие инструкции.'}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-700">
                Обновление каждые 5 секунд...
              </span>
            </div>
          </div>
        );

      case 'screening':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-forest-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Готово к интервью!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {status.message || 'Ваше резюме прошло первичную проверку. Нажмите кнопку ниже, чтобы начать AI-интервью.'}
            </p>
            {status.details?.screening_url && (
              <Button size="lg" onClick={handleStartInterview}>
                Начать интервью
              </Button>
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Интервью завершено!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {status.message || 'Спасибо за прохождение интервью. HR-специалист рассмотрит ваши ответы и свяжется с вами в ближайшее время.'}
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </div>
        );

      case 'approved':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Поздравляем!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {status.message || 'Ваша кандидатура одобрена. HR-специалист свяжется с вами для обсуждения следующих шагов.'}
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </div>
        );

      case 'rejected':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              К сожалению...
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {status.message || 'К сожалению, ваша кандидатура не соответствует требованиям данной вакансии.'}
            </p>
            {status.details?.rejection_reason && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-700">{status.details.rejection_reason}</p>
              </div>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Посмотреть другие вакансии
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p className="text-gray-600">Неизвестный статус</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16">
            {renderStatusContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
