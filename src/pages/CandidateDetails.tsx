import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { mockStorage } from '../lib/mockData';
import { Candidate, CandidateMatch, Vacancy } from '../types/database';
import type { CandidateConversation } from '../lib/mockData';

export function CandidateDetails() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [match, setMatch] = useState<CandidateMatch | null>(null);
  const [conversation, setConversation] = useState<CandidateConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  const loadCandidateData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const candidateData = mockStorage.getCandidateById(candidateId || '');
      if (candidateData) {
        setCandidate(candidateData);

        const vacancyData = mockStorage.getVacancyById(candidateData.vacancy_id);
        setVacancy(vacancyData);

        const matchData = mockStorage.getMatchByCandidate(candidateId || '');
        setMatch(matchData);

        const conversationData = mockStorage.getConversationByCandidate(candidateId || '');
        setConversation(conversationData);
      }
    } catch (error) {
      console.error('Error loading candidate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    screening: 'Скрининг',
    interviewed: 'Интервью',
    offered: 'Оффер',
    rejected: 'Отклонен',
    hired: 'Нанят',
  };

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    new: 'primary',
    screening: 'warning',
    interviewed: 'default',
    offered: 'success',
    rejected: 'danger',
    hired: 'success',
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

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Кандидат не найден</h3>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Вернуться назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      <h1 className="text-2xl font-bold text-gray-900">{candidate.email}</h1>
                      <Badge variant={statusColors[candidate.status]}>
                        {statusLabels[candidate.status]}
                      </Badge>
                    </div>
                    {vacancy && (
                      <p className="text-gray-600 mb-4">
                        Вакансия: <span className="font-medium text-gray-900">{vacancy.title}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {candidate.phone}
                        </div>
                      )}
                      {candidate.portfolio_url && (
                        <a
                          href={candidate.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-forest-600 hover:text-forest-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Портфолио
                        </a>
                      )}
                      {candidate.resume_url && (
                        <a
                          href={candidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-forest-600 hover:text-forest-700"
                        >
                          <FileText className="w-4 h-4" />
                          Резюме
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {match && (
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
                      <p className="text-3xl font-bold text-forest-900">{match.overall_score}%</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">Hard Skills</p>
                      <p className="text-3xl font-bold text-blue-900">{match.hard_skills_score}%</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 mb-1">Soft Skills</p>
                      <p className="text-3xl font-bold text-purple-900">{match.soft_skills_score}%</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700 mb-1">Ценности</p>
                      <p className="text-3xl font-bold text-amber-900">{match.values_match_score}%</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 mb-1">Мотивация</p>
                      <p className="text-3xl font-bold text-green-900">{match.motivation_score}%</p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <p className="text-sm text-pink-700 mb-1">Культура</p>
                      <p className="text-3xl font-bold text-pink-900">{match.cultural_fit_score}%</p>
                    </div>
                  </div>

                  {match.analysis && (
                    <div className="space-y-4">
                      {match.analysis.strengths && match.analysis.strengths.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Сильные стороны
                          </h3>
                          <ul className="space-y-1">
                            {match.analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-gray-700 pl-7">
                                • {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.analysis.concerns && match.analysis.concerns.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            Замечания
                          </h3>
                          <ul className="space-y-1">
                            {match.analysis.concerns.map((concern, index) => (
                              <li key={index} className="text-gray-700 pl-7">
                                • {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.analysis.recommendations && (
                        <div className="p-4 bg-forest-50 rounded-lg border border-forest-200">
                          <h3 className="font-semibold text-forest-900 mb-2">Рекомендация</h3>
                          <p className="text-forest-800">{match.analysis.recommendations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {conversation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-forest-600" />
                    <h2 className="text-xl font-bold text-gray-900">Диалог с AI-ассистентом</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversation.messages.map((message, index) => (
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

                  {conversation.aiConclusion && (
                    <div className="mt-6 p-4 bg-gradient-to-br from-forest-50 to-warm-50 rounded-lg border border-forest-200">
                      <h3 className="font-semibold text-forest-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Вывод AI-ассистента
                      </h3>
                      <p className="text-gray-800 leading-relaxed">{conversation.aiConclusion}</p>
                    </div>
                  )}

                  {conversation.rejectionReason && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Причина отклонения
                      </h3>
                      <p className="text-red-800 leading-relaxed">{conversation.rejectionReason}</p>
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
                    {statusLabels[candidate.status]}
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

            {candidate.portfolio_url && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-gray-900">Ссылки</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={candidate.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-forest-600 hover:text-forest-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Портфолио
                  </a>
                  {candidate.resume_url && (
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-forest-600 hover:text-forest-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Резюме
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
