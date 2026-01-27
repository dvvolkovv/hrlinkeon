import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { apiPost, apiDelete, apiPatch, apiFetch } from '../lib/api';
import { getUserId } from '../lib/auth';
import {
  Users,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  Code,
  Heart,
  Users2,
  AlertTriangle,
  X,
  Bookmark,
  Edit,
  Share2,
  Check,
  Trash2,
  Lock,
  Unlock,
  ArrowUpDown,
  Sparkles,
  Download
} from 'lucide-react';
import { Vacancy } from '../types/database';

interface ApiCandidate {
  id: string;
  vacancy_id: string;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  status_label: string;
  resume_file_path: string | null;
  resume_analysis: any;
  profile_data: any;
  profile_is_ready: boolean;
  scoring: any;
  github_link: string | null;
  portfolio_link: string | null;
  created_at: string;
  updated_at: string;
}

type SortType = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';

export function VacancyDashboard() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Восстанавливаем фильтры из localStorage
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    const saved = localStorage.getItem(`vacancy_${vacancyId}_filterStatus`);
    return saved || 'all';
  });
  const [filterProfileReady, setFilterProfileReady] = useState<boolean | null>(() => {
    const saved = localStorage.getItem(`vacancy_${vacancyId}_filterProfileReady`);
    if (saved === null || saved === 'null') return null;
    return JSON.parse(saved);
  });
  const [sortBy, setSortBy] = useState<SortType>(() => {
    const saved = localStorage.getItem(`vacancy_${vacancyId}_sortBy`);
    return (saved as SortType) || 'date_desc';
  });
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState<ApiCandidate | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [copiedVacancy, setCopiedVacancy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVacancy, setDeletingVacancy] = useState(false);
  const [updatingVacancyStatus, setUpdatingVacancyStatus] = useState(false);
  const [publishingVacancy, setPublishingVacancy] = useState(false);
  const [downloadingCVId, setDownloadingCVId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [vacancyId]);

  // Сохраняем фильтры в localStorage при их изменении
  useEffect(() => {
    if (vacancyId) {
      localStorage.setItem(`vacancy_${vacancyId}_filterStatus`, filterStatus);
    }
  }, [filterStatus, vacancyId]);

  useEffect(() => {
    if (vacancyId) {
      localStorage.setItem(`vacancy_${vacancyId}_filterProfileReady`, JSON.stringify(filterProfileReady));
    }
  }, [filterProfileReady, vacancyId]);

  useEffect(() => {
    if (vacancyId) {
      localStorage.setItem(`vacancy_${vacancyId}_sortBy`, sortBy);
    }
  }, [sortBy, vacancyId]);

  const loadData = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        navigate('/login');
        return;
      }

      if (!vacancyId) {
        console.error('No vacancyId found');
        setLoading(false);
        return;
      }

      const result = await apiPost<any>(`/api/v2/vacancies/candidates`, {
        vacancy_id: vacancyId,
      });

      let candidatesData: ApiCandidate[] = [];
      if (Array.isArray(result)) {
        candidatesData = result[0]?.data || [];
      } else if (result.data) {
        candidatesData = result.data;
      } else if (result.success && result.data) {
        candidatesData = Array.isArray(result.data) ? result.data : [];
      }

      const validCandidates = candidatesData.filter(c => c.id && c.email);
      setCandidates(validCandidates);

      const vacancyResult = await apiPost<{ success: boolean; data: any[] }>('/api/v2/vacancies', {});

      const apiVacancies = vacancyResult.data || [];
      const currentVacancy = apiVacancies.find((v: any) => v.id === vacancyId);

      if (currentVacancy) {
        setVacancy({
          id: currentVacancy.id,
          hr_user_id: currentVacancy.user_id,
          title: currentVacancy.title,
          department: currentVacancy.department,
          level: currentVacancy.level,
          experience_years: 0,
          salary_min: currentVacancy.salary_from || null,
          salary_max: currentVacancy.salary_to || null,
          work_format: currentVacancy.format,
          work_schedule: currentVacancy.vacancy_data?.workload || 'full',
          requirements: currentVacancy.vacancy_data?.requirements || '',
          responsibilities: currentVacancy.vacancy_data?.responsibilities || '',
          status: currentVacancy.status,
          slug: currentVacancy.public_link || currentVacancy.id,
          created_at: currentVacancy.created_at,
          updated_at: currentVacancy.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const userId = getUserId();
      if (!userId) {
        navigate('/login');
        return;
      }

      await apiPost<{ success: boolean; message?: string }>(
        `/api/v2/vacancies/candidates/update_status`,
        { vacancy_id: vacancyId, 
          candidate_id: candidateId, 
          status: status }
      );

      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Не удалось обновить статус кандидата. Попробуйте еще раз.');
    }
  };

  const openRejectModal = (candidate: ApiCandidate) => {
    setRejectingCandidate(candidate);
    setRejectComment('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingCandidate(null);
    setRejectComment('');
  };

  const handleRejectCandidate = async () => {
    if (!rejectingCandidate || !vacancyId) return;

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
          vacancy_id: vacancyId,
          candidate_id: rejectingCandidate.id,
          comment: rejectComment.trim(),
        }
      );

      closeRejectModal();
      await loadData();
    } catch (error) {
      console.error('Failed to reject candidate:', error);
      alert(error instanceof Error ? error.message : 'Не удалось отклонить кандидата. Попробуйте еще раз.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleShareVacancy = async () => {
    if (!vacancy) return;

    const url = `${window.location.origin}/vacancy/${vacancy.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedVacancy(true);
      setTimeout(() => {
        setCopiedVacancy(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleOpenChat = () => {
    if (!vacancyId) return;

    const userId = getUserId();
    if (!userId) {
      navigate('/login');
      return;
    }

    navigate(`/vacancy/${vacancyId}/chat`);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteVacancy = async () => {
    if (!vacancy || !vacancyId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setDeletingVacancy(true);

      await apiDelete<{ success: boolean; message?: string }>(`/api/v2/vacancies`, {
        vacancy_id: vacancyId,
      });

      navigate('/recruiter');
    } catch (error) {
      console.error('Failed to delete vacancy:', error);
      alert(error instanceof Error ? error.message : 'Не удалось удалить вакансию. Попробуйте еще раз.');
    } finally {
      setDeletingVacancy(false);
    }
  };

  const handleUpdateVacancyStatus = async (newStatus: 'published' | 'closed') => {
    if (!vacancyId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setUpdatingVacancyStatus(true);

      await apiPatch<{ success: boolean; message?: string }>(`/api/v2/vacancies`, {
        vacancy_id: vacancyId,
        status: newStatus,
        vacancy_data: {},
        extended_data: {
          type: 'manual',
          is_ready: true,
        },
      });

      await loadData();
    } catch (error) {
      console.error('Failed to update vacancy status:', error);
      alert(error instanceof Error ? error.message : 'Не удалось изменить статус вакансии');
    } finally {
      setUpdatingVacancyStatus(false);
    }
  };

  const handleDownloadCV = async (candidateId: string, candidateName: string) => {
    if (!vacancyId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setDownloadingCVId(candidateId);

      const response = await apiFetch(`/api/v2/getcv/candidates`, {
        method: 'POST',
        body: JSON.stringify({
          vacancy_id: vacancyId,
          candidate_id: candidateId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${candidateName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download CV:', error);
      alert(error instanceof Error ? error.message : 'Не удалось скачать CV');
    } finally {
      setDownloadingCVId(null);
    }
  };

  const handlePublishVacancy = async () => {
    if (!vacancyId) return;

    const userId = getUserId();
    if (!userId) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    try {
      setPublishingVacancy(true);

      await apiPost<{ success: boolean; message?: string }>(`/api/v2/vacancies/publish`, {
        vacancy_id: vacancyId,
      });

      await loadData();
    } catch (error) {
      console.error('Failed to publish vacancy:', error);
      alert(error instanceof Error ? error.message : 'Не удалось опубликовать вакансию');
    } finally {
      setPublishingVacancy(false);
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

  const sortCandidates = (candidateList: ApiCandidate[], sortType: SortType): ApiCandidate[] => {
    const sorted = [...candidateList];

    switch (sortType) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'score_desc':
        return sorted.sort((a, b) => {
          const scoreA = a.scoring?.overall_score || 0;
          const scoreB = b.scoring?.overall_score || 0;
          return scoreB - scoreA;
        });
      case 'score_asc':
        return sorted.sort((a, b) => {
          const scoreA = a.scoring?.overall_score || 0;
          const scoreB = b.scoring?.overall_score || 0;
          return scoreA - scoreB;
        });
      default:
        return sorted;
    }
  };

  const filteredCandidates = sortCandidates(
    candidates.filter(c => {
      // Фильтр по статусу
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      // Фильтр по готовности профиля
      const profileReadyMatch = filterProfileReady === null || c.profile_is_ready === filterProfileReady;
      return statusMatch && profileReadyMatch;
    }),
    sortBy
  );

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    screening: candidates.filter(c => c.status === 'screening').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
    accepted: candidates.filter(c => c.status === 'accepted').length,
    reserve: candidates.filter(c => c.status === 'reserve').length,
    profileReady: candidates.filter(c => c.profile_is_ready).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/recruiter')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к вакансиям
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/vacancy/${vacancyId}/edit`)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Редактировать</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenChat}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Чат с AI</span>
            </Button>
            {vacancy && vacancy.status === 'closed' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateVacancyStatus('published')}
                disabled={updatingVacancyStatus}
                className="gap-2 text-green-600 hover:bg-green-50 hover:border-green-300"
              >
                <Unlock className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {updatingVacancyStatus ? 'Открытие...' : 'Открыть вакансию'}
                </span>
              </Button>
            )}
            {vacancy && vacancy.status === 'published' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleShareVacancy}
                  className="gap-2"
                >
                  {copiedVacancy ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Поделиться</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateVacancyStatus('closed')}
                  disabled={updatingVacancyStatus}
                  className="gap-2 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {updatingVacancyStatus ? 'Закрытие...' : 'Закрыть вакансию'}
                  </span>
                </Button>
              </>
            )}
            {vacancy && vacancy.status !== 'published' && vacancy.status !== 'closed' && (
              <Button
                onClick={handlePublishVacancy}
                disabled={publishingVacancy}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {publishingVacancy ? 'Публикация...' : 'Опубликовать'}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={openDeleteModal}
              className="gap-2 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Удалить</span>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {vacancy?.title || 'Управление кандидатами'}
            </h1>
            {vacancy?.status && (
              <Badge variant={
                vacancy.status === 'published' ? 'success' :
                vacancy.status === 'closed' ? 'error' :
                'warning'
              }>
                {vacancy.status === 'published' ? 'Опубликована' :
                 vacancy.status === 'closed' ? 'Закрыта' :
                 `Черновик (${vacancy.status})`}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">{vacancy?.department}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Всего откликов</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-forest-600" />
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Новые</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.new}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">На скрининге</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.screening}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-warm-600" />
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">На интервью</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.interviewed}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                  Кандидаты 
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredCandidates.length} из {stats.total})
                  </span>
                </h2>
                
                {/* Мобильная версия - выпадающие списки */}
                <div className="flex sm:hidden items-center gap-2">
                  {/* Сортировка */}
                  <div className="flex-1">
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortType)}
                      options={[
                        { value: 'date_desc', label: '🕒 Дата: новые' },
                        { value: 'date_asc', label: '🕒 Дата: старые' },
                        { value: 'score_desc', label: '⭐ Скоринг: высокий' },
                        { value: 'score_asc', label: '⭐ Скоринг: низкий' },
                      ]}
                      className="text-sm py-2"
                    />
                  </div>
                  
                  {/* Фильтр по статусу */}
                  <div className="flex-1">
                    <Select
                      value={filterProfileReady === true ? 'ready' : filterStatus}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'ready') {
                          setFilterProfileReady(true);
                          setFilterStatus('all');
                        } else {
                          setFilterProfileReady(null);
                          setFilterStatus(value);
                        }
                      }}
                      options={[
                        { value: 'all', label: `📋 Все (${stats.total})` },
                        { value: 'new', label: `🆕 Новые${stats.new > 0 ? ` (${stats.new})` : ''}` },
                        { value: 'screening', label: `🔍 Скрининг${stats.screening > 0 ? ` (${stats.screening})` : ''}` },
                        { value: 'interviewed', label: `💼 Интервью${stats.interviewed > 0 ? ` (${stats.interviewed})` : ''}` },
                        { value: 'accepted', label: `✅ Предложение${stats.accepted > 0 ? ` (${stats.accepted})` : ''}` },
                        { value: 'reserve', label: `📌 Резерв${stats.reserve > 0 ? ` (${stats.reserve})` : ''}` },
                        { value: 'ready', label: `✓ Готов${stats.profileReady > 0 ? ` (${stats.profileReady})` : ''}` },
                      ]}
                      className="text-sm py-2"
                    />
                  </div>
                </div>
                
                {/* Десктопная версия - кнопки */}
                <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
                  {/* Сортировка */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortType)}
                      options={[
                        { value: 'date_desc', label: 'Дата ↓' },
                        { value: 'date_asc', label: 'Дата ↑' },
                        { value: 'score_desc', label: 'Скоринг ↓' },
                        { value: 'score_asc', label: 'Скоринг ↑' },
                      ]}
                      className="text-sm py-1 w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-gray-300 pl-2">
                    {/* Фильтры по статусу */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={filterStatus === 'all' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('all')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Все</span>
                        <Badge variant="info" className="text-xs px-1 py-0.5">
                          {stats.total}
                        </Badge>
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'new' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('new')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Новые</span>
                        {stats.new > 0 && (
                          <Badge variant="info" className="text-xs px-1 py-0.5">
                            {stats.new}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'screening' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('screening')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Скрининг</span>
                        {stats.screening > 0 && (
                          <Badge variant="warning" className="text-xs px-1 py-0.5">
                            {stats.screening}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'interviewed' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('interviewed')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Интервью</span>
                        {stats.interviewed > 0 && (
                          <Badge variant="primary" className="text-xs px-1 py-0.5">
                            {stats.interviewed}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'accepted' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('accepted')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Предложение</span>
                        {stats.accepted > 0 && (
                          <Badge variant="success" className="text-xs px-1 py-0.5">
                            {stats.accepted}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={filterStatus === 'reserve' ? 'primary' : 'outline'}
                        onClick={() => setFilterStatus('reserve')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Резерв</span>
                        {stats.reserve > 0 && (
                          <Badge variant="warning" className="text-xs px-1 py-0.5">
                            {stats.reserve}
                          </Badge>
                        )}
                      </Button>
                    </div>
                    
                    {/* Фильтр "Профиль готов" */}
                    <Button
                      size="sm"
                      variant={filterProfileReady === true ? 'primary' : 'outline'}
                      onClick={() => setFilterProfileReady(filterProfileReady === true ? null : true)}
                      className={`flex items-center gap-1 whitespace-nowrap ${filterProfileReady === true ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Профиль готов</span>
                      {stats.profileReady > 0 && (
                        <Badge variant="success" className="text-xs px-1 py-0.5">
                          {stats.profileReady}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Пока нет кандидатов</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-forest-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/candidate/${candidate.id}/details`, { state: { vacancyId } })}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        <Badge variant={statusColors[candidate.status] || 'info'}>
                          {candidate.status_label || candidate.status}
                        </Badge>
                        {candidate.profile_is_ready && (
                          <Badge variant="success">Профиль готов</Badge>
                        )}
                        {candidate.scoring?.overall_score && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              Совпадение: {Math.round(candidate.scoring.overall_score)}%
                            </div>
                            <div className="w-16 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                                style={{ width: `${candidate.scoring.overall_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {candidate.scoring && (
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {candidate.scoring.hard_skills_match !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Code className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-gray-600">Hard Skills:</span>
                              <span className="font-semibold text-gray-900">{Math.round(candidate.scoring.hard_skills_match)}%</span>
                            </div>
                          )}
                          {candidate.scoring.soft_skills_match !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="w-3.5 h-3.5 text-pink-600" />
                              <span className="text-gray-600">Soft Skills:</span>
                              <span className="font-semibold text-gray-900">{Math.round(candidate.scoring.soft_skills_match)}%</span>
                            </div>
                          )}
                          {candidate.scoring.cultural_match !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Users2 className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-gray-600">Культура:</span>
                              <span className="font-semibold text-gray-900">{Math.round(candidate.scoring.cultural_match)}%</span>
                            </div>
                          )}
                          {candidate.scoring.commander_match !== undefined && candidate.scoring.commander_match !== null && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Users2 className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-gray-600">Команда:</span>
                              <span className="font-semibold text-gray-900">{Math.round(candidate.scoring.commander_match)}%</span>
                            </div>
                          )}
                          {candidate.scoring.risk_score !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                              <span className="text-gray-600">Риск:</span>
                              <span className="font-semibold text-gray-900">{Math.round(candidate.scoring.risk_score)}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                        {candidate.portfolio_link && (
                          <a
                            href={candidate.portfolio_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-forest-600 hover:text-forest-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            Портфолио
                          </a>
                        )}
                        {candidate.github_link && (
                          <a
                            href={candidate.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-forest-600 hover:text-forest-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCV(candidate.id, candidate.name)}
                        disabled={downloadingCVId === candidate.id}
                        className="whitespace-nowrap gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingCVId === candidate.id ? 'Загрузка...' : 'Скачать CV'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = `/candidate/${candidate.id}/ai-chat?vacancyId=${vacancyId}&candidateName=${encodeURIComponent(candidate.name)}`;
                          window.open(url, '_blank');
                        }}
                        className="whitespace-nowrap gap-1.5 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 text-primary-700 hover:from-primary-100 hover:to-primary-200"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI-советник
                      </Button>
                      {candidate.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateCandidateStatus(candidate.id, 'screening')}
                          className="whitespace-nowrap"
                        >
                          Начать скрининг
                        </Button>
                      )}
                      {candidate.status === 'screening' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCandidateStatus(candidate.id, 'interviewed')}
                            className="whitespace-nowrap"
                          >
                            На интервью
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateCandidateStatus(candidate.id, 'accepted')}
                            className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                          >
                            Предложение
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateCandidateStatus(candidate.id, 'reserve')}
                            className="whitespace-nowrap bg-amber-600 hover:bg-amber-700"
                          >
                            <Bookmark className="w-4 h-4" />
                            Резерв
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(candidate)}
                            className="whitespace-nowrap text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            Отклонить
                          </Button>
                        </>
                      )}
                      {candidate.status === 'interviewed' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateCandidateStatus(candidate.id, 'accepted')}
                            className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                          >
                            Предложение
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateCandidateStatus(candidate.id, 'reserve')}
                            className="whitespace-nowrap bg-amber-600 hover:bg-amber-700"
                          >
                            <Bookmark className="w-4 h-4" />
                            Резерв
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(candidate)}
                            className="whitespace-nowrap text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            Отклонить
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showRejectModal && rejectingCandidate && (
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
                    <p className="text-sm text-gray-600">{rejectingCandidate.name}</p>
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

      {showDeleteModal && vacancy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Удалить вакансию?</h3>
                  </div>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={deletingVacancy}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Вы уверены, что хотите удалить вакансию <span className="font-semibold">{vacancy.title}</span>?
              </p>
              <p className="text-sm text-gray-500">
                Это действие нельзя отменить. Все данные, связанные с этой вакансией, будут удалены.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeDeleteModal}
                  disabled={deletingVacancy}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleDeleteVacancy}
                  disabled={deletingVacancy}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deletingVacancy ? 'Удаление...' : 'Удалить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
