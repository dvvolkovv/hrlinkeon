import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { apiPost, apiFetch } from '../lib/api';
import { getUserId } from '../lib/auth';
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
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  X,
  Calendar,
  Bookmark,
  Download,
  Sparkles,
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
  comments_hr: string | null;
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
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [hrComments, setHrComments] = useState('');
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [isSavingComments, setIsSavingComments] = useState(false);

  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  // Инициализация комментариев рекрутера
  useEffect(() => {
    if (data?.candidate?.comments_hr) {
      setHrComments(data.candidate.comments_hr);
    }
  }, [data]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getUserId();
      if (!userId) {
        setError('Не удалось получить данные пользователя');
        return;
      }

      const vacancyIdFromState = (location.state as { vacancyId?: string })?.vacancyId;

      if (vacancyIdFromState) {
        const result = await apiPost<CandidateDetailsResponse>(
          `/api/v2/vacancies/candidate_detail`,
          { 
            candidate_id: candidateId,
            vacancy_id: vacancyIdFromState
          }
        );

        if (result.success) {
          setData(result);
          return;
        }
      }

      const vacanciesResult = await apiPost<{ success: boolean; data: any[] }>('/api/v2/vacancies', {});

      const allVacancies = vacanciesResult.data || [];

      let candidateData: CandidateDetailsResponse | null = null;

      for (const vacancy of allVacancies) {
        try {
          const result = await apiPost<CandidateDetailsResponse>(
            `/api/v2/vacancies/candidate_detail`,
            { 
              vacancy_id: vacancy.id,
              candidate_id: candidateId
             }
          );

          if (result.success) {
            candidateData = result;
            break;
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
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке данных кандидата');
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (newStatus: string) => {
    if (!data || statusUpdating) return;

    try {
      setStatusUpdating(true);

      const userId = getUserId();
      if (!userId) {
        alert('Не удалось получить данные пользователя');
        return;
      }

      await apiPost<{ success: boolean; message?: string }>(
        `/api/v2/vacancies/candidates/update_status`,
        {
          vacancy_id: vacancy.id,
          candidate_id: candidateId,
          status: newStatus,
        }
      );

      await loadCandidateData();
    } catch (error) {
      console.error('Error updating candidate status:', error);
      alert(error instanceof Error ? error.message : 'Не удалось обновить статус кандидата. Попробуйте еще раз.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const openRejectModal = () => {
    setRejectComment('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectComment('');
  };

  const handleRejectCandidate = async () => {
    if (!data || !candidateId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    if (!rejectComment.trim()) {
      alert('Пожалуйста, укажите причину отклонения');
      return;
    }

    try {
      setIsRejecting(true);

      await apiPost<{ success: boolean; message?: string }>(
        `/api/v2/vacancies/candidates/reject`,
        {
          vacancy_id: vacancy.id,
          candidate_id: candidateId,
          comment: rejectComment.trim(),
        }
      );

      closeRejectModal();
      await loadCandidateData();
    } catch (error) {
      console.error('Failed to reject candidate:', error);
      alert(error instanceof Error ? error.message : 'Не удалось отклонить кандидата. Попробуйте еще раз.');
    } finally {
      setIsRejecting(false);
    }
  };

  const saveHrComments = async () => {
    if (!data || !candidateId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setIsSavingComments(true);

      await apiPost<{ success: boolean; message?: string }>(
        `/api/v2/vacancies/candidates/update_hr_comments`,
        {
          vacancy_id: vacancy.id,
          candidate_id: candidateId,
          comments_hr: hrComments.trim(),
        }
      );

      setIsEditingComments(false);
      await loadCandidateData();
    } catch (error) {
      console.error('Failed to save HR comments:', error);
      alert(error instanceof Error ? error.message : 'Не удалось сохранить комментарии. Попробуйте еще раз.');
    } finally {
      setIsSavingComments(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!data || !candidateId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setDownloadingCV(true);

      const response = await apiFetch(
        `/api/v2/getcv/candidates`,
        {
          method: 'POST',
          body: JSON.stringify({
            vacancy_id: vacancy.id,
            candidate_id: candidateId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${data.candidate.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download CV:', error);
      alert(error instanceof Error ? error.message : 'Не удалось скачать CV');
    } finally {
      setDownloadingCV(false);
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
                <div className="flex items-start justify-between gap-4">
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
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadCV}
                      disabled={downloadingCV}
                      className="gap-2 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingCV ? 'Загрузка...' : 'Скачать CV'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = `/candidate/${candidateId}/ai-chat?vacancyId=${vacancy.id}&candidateName=${encodeURIComponent(candidate.name)}`;
                        window.open(url, '_blank');
                      }}
                      className="gap-2 whitespace-nowrap bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 text-primary-700 hover:from-primary-100 hover:to-primary-200"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI-советник
                    </Button>
                    {candidate.status !== 'rejected' && candidate.status !== 'accepted' && (
                      <>
                        {candidate.status !== 'interviewed' && (
                          <Button
                            onClick={() => updateCandidateStatus('interviewed')}
                            disabled={statusUpdating}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Calendar className="w-4 h-4" />
                            На интервью
                          </Button>
                        )}
                        <Button
                          onClick={() => updateCandidateStatus('accepted')}
                          disabled={statusUpdating}
                          className="gap-2 whitespace-nowrap bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Предложение
                        </Button>
                        <Button
                          onClick={() => updateCandidateStatus('reserve')}
                          disabled={statusUpdating}
                          className="gap-2 whitespace-nowrap bg-amber-600 hover:bg-amber-700"
                        >
                          <Bookmark className="w-4 h-4" />
                          Резерв
                        </Button>
                        <Button
                          variant="outline"
                          onClick={openRejectModal}
                          disabled={statusUpdating}
                          className="gap-2 whitespace-nowrap border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <X className="w-4 h-4" />
                          Отклонить
                        </Button>
                      </>
                    )}
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

            {candidate.resume_analysis && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setResumeExpanded(!resumeExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-forest-600" />
                      <h2 className="text-xl font-bold text-gray-900">Анализ резюме</h2>
                    </div>
                    {resumeExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
                {resumeExpanded && (
                  <CardContent>
                    <div className="space-y-6">
                      {candidate.resume_analysis.personal_info && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-600" />
                            Личная информация
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {candidate.resume_analysis.personal_info.name && (
                              <div>
                                <span className="text-gray-600">ФИО:</span>
                                <span className="ml-2 text-gray-900 font-medium">{candidate.resume_analysis.personal_info.name}</span>
                              </div>
                            )}
                            {(candidate.resume_analysis.personal_info.birth_date || candidate.resume_analysis.personal_info.dob) && (
                              <div>
                                <span className="text-gray-600">Дата рождения:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.birth_date || candidate.resume_analysis.personal_info.dob}</span>
                              </div>
                            )}
                            {candidate.resume_analysis.personal_info.gender && (
                              <div>
                                <span className="text-gray-600">Пол:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.gender}</span>
                              </div>
                            )}
                            {candidate.resume_analysis.personal_info.location && (
                              <div>
                                <span className="text-gray-600">Локация:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.location}</span>
                              </div>
                            )}
                            {candidate.resume_analysis.personal_info.citizenship && (
                              <div>
                                <span className="text-gray-600">Гражданство:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.citizenship}</span>
                              </div>
                            )}
                            {(candidate.resume_analysis.personal_info.contact_phone || candidate.resume_analysis.personal_info.contact?.phone) && (
                              <div>
                                <span className="text-gray-600">Телефон:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.contact_phone || candidate.resume_analysis.personal_info.contact?.phone}</span>
                              </div>
                            )}
                            {(candidate.resume_analysis.personal_info.contact_email || candidate.resume_analysis.personal_info.contact?.email) && (
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.contact_email || candidate.resume_analysis.personal_info.contact?.email}</span>
                              </div>
                            )}
                            {candidate.resume_analysis.personal_info.relocation_ready !== undefined && (
                              <div>
                                <span className="text-gray-600">Готов к переезду:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.relocation_ready ? 'Да' : 'Нет'}</span>
                              </div>
                            )}
                            {candidate.resume_analysis.personal_info.business_trips_ready !== undefined && (
                              <div>
                                <span className="text-gray-600">Готов к командировкам:</span>
                                <span className="ml-2 text-gray-900">{candidate.resume_analysis.personal_info.business_trips_ready ? 'Да' : 'Нет'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {candidate.resume_analysis.summary && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Резюме</h3>
                          <p className="text-gray-700 leading-relaxed">{candidate.resume_analysis.summary}</p>
                        </div>
                      )}

                      {candidate.resume_analysis.skills && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-blue-600" />
                            Навыки
                          </h3>
                          <div className="space-y-4">
                            {candidate.resume_analysis.skills.languages && candidate.resume_analysis.skills.languages.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Languages className="w-4 h-4 text-gray-500" />
                                  Языки
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.resume_analysis.skills.languages.map((lang: any, idx: number) => (
                                    <Badge key={idx} variant="info">
                                      {typeof lang === 'string' ? lang : `${lang.language} (${lang.level})`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {candidate.resume_analysis.skills.hard_skills && candidate.resume_analysis.skills.hard_skills.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Hard Skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.resume_analysis.skills.hard_skills.map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="primary">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {candidate.resume_analysis.skills.soft_skills && candidate.resume_analysis.skills.soft_skills.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Soft Skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.resume_analysis.skills.soft_skills.map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="success">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {candidate.resume_analysis.experience && candidate.resume_analysis.experience.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Опыт работы
                          </h3>
                          <div className="space-y-4">
                            {candidate.resume_analysis.experience.map((exp: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-forest-300 pl-4 pb-4">
                                <h4 className="font-medium text-gray-900">{exp.position}</h4>
                                <p className="text-sm text-gray-600">{exp.company}</p>
                                {exp.period && <p className="text-sm text-gray-500 mb-2">{exp.period}</p>}
                                {exp.team_size && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Размер команды:</span> {exp.team_size}
                                  </p>
                                )}
                                {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                                {exp.stack && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Стек технологий:</p>
                                    {Array.isArray(exp.stack) ? (
                                      <div className="flex flex-wrap gap-1">
                                        {exp.stack.map((tech: string, tidx: number) => (
                                          <Badge key={tidx} variant="primary">{tech}</Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600">{exp.stack}</p>
                                    )}
                                  </div>
                                )}
                                {exp.achievements && exp.achievements.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Достижения:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {exp.achievements.map((achievement: string, aidx: number) => (
                                        <li key={aidx} className="text-sm text-gray-600">{achievement}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.resume_analysis.education && candidate.resume_analysis.education.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Образование
                          </h3>
                          <div className="space-y-3">
                            {candidate.resume_analysis.education.map((edu: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-blue-300 pl-4">
                                <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                {edu.period && <p className="text-sm text-gray-500">{edu.period}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.resume_analysis.key_achievements && candidate.resume_analysis.key_achievements.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-600" />
                            Ключевые достижения
                          </h3>
                          <ul className="space-y-2">
                            {candidate.resume_analysis.key_achievements.map((achievement: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-700">
                                <CheckCircle className="w-4 h-4 text-forest-600 mt-1 flex-shrink-0" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {candidate.resume_analysis.hobbies_interests && candidate.resume_analysis.hobbies_interests.length > 0 && (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-600" />
                            Хобби и интересы
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {candidate.resume_analysis.hobbies_interests.map((hobby: string, idx: number) => (
                              <Badge key={idx} variant="info">{hobby}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.resume_analysis.relevance_to_vacancy && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <h3 className="font-semibold text-amber-900 mb-3">Соответствие вакансии</h3>
                          <div className="space-y-3">
                            {candidate.resume_analysis.relevance_to_vacancy.match_score && (
                              <div>
                                <p className="text-sm text-amber-700 mb-1">Оценка соответствия</p>
                                <p className="text-2xl font-bold text-amber-900">{candidate.resume_analysis.relevance_to_vacancy.match_score}%</p>
                              </div>
                            )}

                            {candidate.resume_analysis.relevance_to_vacancy.strengths && candidate.resume_analysis.relevance_to_vacancy.strengths.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-900 mb-2">Сильные стороны</p>
                                <ul className="space-y-1">
                                  {candidate.resume_analysis.relevance_to_vacancy.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {candidate.resume_analysis.relevance_to_vacancy.missing_skills && candidate.resume_analysis.relevance_to_vacancy.missing_skills.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-900 mb-2">Недостающие навыки</p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.resume_analysis.relevance_to_vacancy.missing_skills.map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="warning">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {candidate.resume_analysis.relevance_to_vacancy.recommendations && (
                              <div>
                                <p className="text-sm font-medium text-amber-900 mb-1">Рекомендации</p>
                                <p className="text-sm text-amber-800">{candidate.resume_analysis.relevance_to_vacancy.recommendations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {chat_history && chat_history.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setChatExpanded(!chatExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-forest-600" />
                      <h2 className="text-xl font-bold text-gray-900">Диалог с AI-ассистентом</h2>
                    </div>
                    {chatExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
                {chatExpanded && (
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
                                : message.role === 'human'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
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
                                  : message.role === 'human'
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                  : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              {message.timestamp && (
                                <span
                                  className={`text-xs mt-2 block ${
                                    message.role === 'assistant' ? 'text-gray-500' : 'text-white/70'
                                  }`}
                                >
                                  {new Date(message.timestamp).toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
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
                )}
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

            {/* Комментарии рекрутера */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                    Комментарии рекрутера
                  </h2>
                  {!isEditingComments && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingComments(true)}
                    >
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingComments ? (
                  <div className="space-y-3">
                    <Textarea
                      value={hrComments}
                      onChange={(e) => setHrComments(e.target.value)}
                      placeholder="Добавьте свои комментарии о кандидате..."
                      rows={6}
                      disabled={isSavingComments}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveHrComments}
                        disabled={isSavingComments}
                      >
                        {isSavingComments ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingComments(false);
                          setHrComments(candidate.comments_hr || '');
                        }}
                        disabled={isSavingComments}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {hrComments ? (
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{hrComments}</p>
                    ) : (
                      <p className="text-gray-500 italic">Комментарии отсутствуют. Нажмите "Редактировать" чтобы добавить.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showRejectModal && data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Отклонить кандидата</h3>
                    <p className="text-sm text-gray-600">{data.candidate.name}</p>
                  </div>
                </div>
                <button
                  onClick={closeRejectModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isRejecting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Пожалуйста, укажите причину отклонения. Это поможет кандидату понять решение и улучшить свои навыки.
              </p>
              <Textarea
                label="Комментарий"
                placeholder="Например: Благодарим за обращение! Мы выбрали другого кандидата. Желаем вам успехов в поиске работы мечты!"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                disabled={isRejecting}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeRejectModal}
                  disabled={isRejecting}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleRejectCandidate}
                  disabled={isRejecting || !rejectComment.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isRejecting ? 'Отклонение...' : 'Отклонить кандидата'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
