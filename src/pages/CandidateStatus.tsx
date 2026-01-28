import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { apiGet } from '../lib/api';

interface HardSkillsMatch {
  match_score: number;
  strengths: string[];
  missing_skills: string[];
}

interface CandidateStatusResponse {
  success: boolean;
  candidate_id: string;
  vacancy_id: string;
  email: string;
  name: string;
  status: string;
  analysis_status: string;
  analysis_complete: boolean;
  resume_file_path: string;
  hard_skills_match: number | HardSkillsMatch | null;
  next_step: string | null;
  message: string;
  created_at: string;
  updated_at: string;
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
      const data = await apiGet<CandidateStatusResponse>(
        `/hrlinkeon-candidate-status/public/vacancies/${publicLink}/candidates/${candidateId}/status`,
        { skipAuth: true }
      );
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (status?.next_step && status.next_step !== 'finish') {
      if (publicLink && candidateId) {
        navigate(`/public/vacancies/${publicLink}/candidates/${candidateId}/interview`);
      }
    }
  };

  const getMatchScore = (): number | null => {
    if (!status?.hard_skills_match) return null;
    if (typeof status.hard_skills_match === 'number') return status.hard_skills_match;
    return status.hard_skills_match.match_score;
  };

  const getSkillsDetails = (): HardSkillsMatch | null => {
    if (!status?.hard_skills_match) return null;
    if (typeof status.hard_skills_match === 'object' && 'match_score' in status.hard_skills_match) {
      return status.hard_skills_match;
    }
    return null;
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

    if (status.status === 'new' && !status.analysis_complete) {
      return (
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Идет проверка резюме
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            {status.message}
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 rounded-lg mb-6">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Обычно занимает не более 5 минут
            </span>
          </div>
          <p className="text-sm text-gray-500">
            После проверки вы будете направлены на интервью с AI-ассистентом или получите уведомление
          </p>
        </div>
      );
    }

    if (status.status === 'rejected' || (status.analysis_complete && status.next_step === 'finish')) {
      const matchScore = getMatchScore();
      const skillsDetails = getSkillsDetails();

      return (
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Спасибо за ваш интерес!
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {status.message}
          </p>

          {matchScore !== null && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-600 mb-2">Соответствие требованиям вакансии</div>
                <div className="text-4xl font-bold text-gray-900">{matchScore}%</div>
              </div>

              {skillsDetails && (
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  {skillsDetails.strengths.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Ваши сильные стороны:</h3>
                      <ul className="space-y-2">
                        {skillsDetails.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {skillsDetails.missing_skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Области для развития:</h3>
                      <ul className="space-y-2">
                        {skillsDetails.missing_skills.map((skill, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <AlertCircle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
          >
            Вернуться
          </Button>
        </div>
      );
    }

    if (status.analysis_complete && status.next_step && status.next_step !== 'finish') {
      const matchScore = getMatchScore();

      return (
        <div className="text-center">
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-forest-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Резюме проверено!
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            {status.message}
          </p>
          {matchScore !== null && (
            <div className="bg-forest-50 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <div className="text-sm text-gray-600 mb-1">Соответствие требованиям</div>
              <div className="text-2xl font-bold text-forest-700">{matchScore}%</div>
            </div>
          )}
          <Button size="lg" onClick={handleStartInterview}>
            Перейти к интервью с AI-ассистентом
          </Button>
        </div>
      );
    }

    if (status.analysis_complete && !status.next_step) {
      const matchScore = getMatchScore();

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
          {matchScore !== null && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-1">Соответствие требованиям</p>
              <p className="text-lg font-semibold text-gray-900">{matchScore}%</p>
            </div>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
          >
            Вернуться
          </Button>
        </div>
      );
    }

    if (status.status === 'completed' || status.status === 'interview_completed') {
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
    }

    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Обработка заявки
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          {status.message}
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
          <span className="text-sm font-medium text-gray-700">
            Проверка статуса...
          </span>
        </div>
      </div>
    );
  };

  const isRejected = status?.status === 'rejected' || (status?.analysis_complete && status?.next_step === 'finish');
  const containerClass = isRejected ? "max-w-4xl mx-auto" : "max-w-2xl mx-auto";

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className={containerClass}>
        <Card>
          <CardContent className="py-16">
            {renderStatusContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
