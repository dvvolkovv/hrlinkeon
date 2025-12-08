import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  TrendingUp,
  Target,
  Code,
  Heart,
  Users2,
  AlertTriangle,
} from 'lucide-react';

interface ApiCandidate {
  id: string;
  vacancy_id: string;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  status_label: string;
  comments: string | null;
  resume_file_path: string | null;
  github_link: string | null;
  portfolio_link: string | null;
  resume_analysis: any;
  profile_data: any;
  profile_is_ready: boolean;
  scoring: {
    overall_score: number;
    hard_skills_match: number;
    soft_skills_match: number;
    cultural_match: number;
    commander_match: number | null;
    risk_score: number;
    hard_skills_analysis: any;
    soft_skills_analysis: any;
    cultural_analysis: any;
    risk_analysis: any;
    growth_report: string;
    recommendations: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ApiVacancy {
  id: string;
  status: string;
  public_link: string;
  title: string;
  department: string;
  level: string;
  salary_from: number | null;
  salary_to: number | null;
  format: string;
  description: string;
  requirements: string;
  extended_data: any;
}

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface CandidateDetailsResponse {
  success: boolean;
  candidate: ApiCandidate;
  vacancy: ApiVacancy;
  chat_history: ChatMessage[];
  chat_messages_count: number;
}

export function CandidateDetails() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<CandidateDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Не удалось получить данные пользователя');
        return;
      }

      const vacancyIdFromState = (location.state as { vacancyId?: string })?.vacancyId;

      if (vacancyIdFromState) {
        const response = await fetch(
          `https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-get-candidate-details/api/vacancies/${vacancyIdFromState}/candidates/${candidateId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setData(result);
            return;
          }
        }
      }

      const vacanciesResponse = await fetch('https://nomira-ai-test.up.railway.app/webhook/api/vacancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!vacanciesResponse.ok) {
        throw new Error('Failed to fetch vacancies');
      }

      const vacanciesResult = await vacanciesResponse.json();
      const allVacancies = vacanciesResult.data || [];

      let candidateData: CandidateDetailsResponse | null = null;

      for (const vacancy of allVacancies) {
        try {
          const response = await fetch(
            `https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-get-candidate-details/api/vacancies/${vacancy.id}/candidates/${candidateId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user_id: userId }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              candidateData = result;
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (!candidateData) {
        setError('Кандидат не найден');
        return;
      }

      setData(candidateData);
    } catch (error) {
      console.error('Error loading candidate data:', error);
      setError('Ошибка при загрузке данных кандидата');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, 'primary' | 'warning' | 'success' | 'error' | 'info'> = {
    new: 'info',
    screening: 'warning',
    interviewed: 'primary',
    accepted: 'success',
    rejected: 'error',
    reserved: 'warning',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных кандидата...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Кандидат не найден'}</h3>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Вернуться назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { candidate, vacancy, chat_history } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                      <Badge variant={statusColors[candidate.status]}>
                        {candidate.status_label}
                      </Badge>
                    </div>
                    {vacancy && (
                      <p className="text-gray-600 mb-4">
                        Вакансия: <span className="font-medium text-gray-900">{vacancy.title}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {candidate.phone}
                        </div>
                      )}
                      {candidate.portfolio_link && (
                        <a
                          href={candidate.portfolio_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-forest-600 hover:text-forest-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Портфолио
                        </a>
                      )}
                      {candidate.github_link && (
                        <a
                          href={candidate.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-forest-600 hover:text-forest-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {candidate.scoring && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-forest-600" />
                    <h2 className="text-xl font-bold text-gray-900">Оценка соответствия</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-forest-50 to-forest-100 rounded-lg">
                      <p className="text-sm text-forest-700 mb-1">Общий скор</p>
                      <p className="text-3xl font-bold text-forest-900">{Math.round(candidate.scoring.overall_score)}%</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">Hard Skills</p>
                      <p className="text-3xl font-bold text-blue-900">{Math.round(candidate.scoring.hard_skills_match)}%</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 mb-1">Soft Skills</p>
                      <p className="text-3xl font-bold text-purple-900">{Math.round(candidate.scoring.soft_skills_match)}%</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700 mb-1">Культура</p>
                      <p className="text-3xl font-bold text-amber-900">{Math.round(candidate.scoring.cultural_match)}%</p>
                    </div>
                    {candidate.scoring.commander_match !== null && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 mb-1">Команда</p>
                        <p className="text-3xl font-bold text-green-900">{Math.round(candidate.scoring.commander_match)}%</p>
                      </div>
                    )}
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700 mb-1">Риски</p>
                      <p className="text-3xl font-bold text-orange-900">{Math.round(candidate.scoring.risk_score)}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {candidate.scoring.hard_skills_analysis?.strengths && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Code className="w-5 h-5 text-blue-600" />
                          Hard Skills
                        </h3>
                        <p className="text-gray-700 pl-7">{candidate.scoring.hard_skills_analysis.explanation}</p>
                      </div>
                    )}

                    {candidate.scoring.soft_skills_analysis?.explanation && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-pink-600" />
                          Soft Skills
                        </h3>
                        <p className="text-gray-700 pl-7">{candidate.scoring.soft_skills_analysis.explanation}</p>
                      </div>
                    )}

                    {candidate.scoring.cultural_analysis?.explanation && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Users2 className="w-5 h-5 text-purple-600" />
                          Культурное соответствие
                        </h3>
                        <p className="text-gray-700 pl-7">{candidate.scoring.cultural_analysis.explanation}</p>
                      </div>
                    )}

                    {candidate.scoring.risk_analysis?.explanation && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          Анализ рисков
                        </h3>
                        <p className="text-gray-700 pl-7">{candidate.scoring.risk_analysis.explanation}</p>
                      </div>
                    )}

                    {candidate.scoring.growth_report && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Потенциал роста
                        </h3>
                        <p className="text-blue-800">{candidate.scoring.growth_report}</p>
                      </div>
                    )}

                    {candidate.scoring.recommendations && (
                      <div className="p-4 bg-forest-50 rounded-lg border border-forest-200">
                        <h3 className="font-semibold text-forest-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Рекомендации
                        </h3>
                        <p className="text-forest-800">{candidate.scoring.recommendations}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {chat_history && chat_history.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-forest-600" />
                    <h2 className="text-xl font-bold text-gray-900">Диалог с AI-ассистентом</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chat_history.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            message.role === 'assistant'
                              ? 'bg-gradient-to-br from-forest-500 to-forest-600'
                              : 'bg-gradient-to-br from-primary-500 to-primary-600'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <Bot className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div
                          className={`flex-1 ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}
                        >
                          <div
                            className={`inline-block max-w-[85%] p-4 rounded-lg ${
                              message.role === 'assistant'
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {formatDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {candidate.comments && candidate.status === 'rejected' && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Причина отклонения
                      </h3>
                      <p className="text-red-800 leading-relaxed">{candidate.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-900">Информация</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Имя</p>
                  <p className="text-gray-900 font-medium">{candidate.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{candidate.email}</p>
                  </div>
                </div>

                {candidate.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Телефон</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{candidate.phone}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Статус</p>
                  <Badge variant={statusColors[candidate.status]}>
                    {candidate.status_label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Дата отклика</p>
                  <p className="text-gray-900">{formatDate(candidate.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Последнее обновление</p>
                  <p className="text-gray-900">{formatDate(candidate.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {(candidate.portfolio_link || candidate.github_link) && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-gray-900">Ссылки</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.portfolio_link && (
                    <a
                      href={candidate.portfolio_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-forest-600 hover:text-forest-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Портфолио
                    </a>
                  )}
                  {candidate.github_link && (
                    <a
                      href={candidate.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-forest-600 hover:text-forest-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
