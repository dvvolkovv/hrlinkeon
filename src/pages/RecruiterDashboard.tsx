import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Eye,
  Plus,
  BarChart3,
  Share2,
  Check,
  Coins,
  LogOut,
} from 'lucide-react';
import { mockStorage } from '../lib/mockData';
import { Vacancy } from '../types/database';
import { supabase } from '../lib/supabase';

interface VacancyStats {
  vacancy: Vacancy;
  totalCandidates: number;
  newCandidates: number;
  screeningCandidates: number;
  interviewedCandidates: number;
  offeredCandidates: number;
  rejectedCandidates: number;
  avgMatchScore: number;
}

export function RecruiterDashboard() {
  const [vacanciesStats, setVacanciesStats] = useState<VacancyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedVacancyId, setCopiedVacancyId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const storedBalance = localStorage.getItem('token_balance');
      const currentBalance = storedBalance ? parseInt(storedBalance) : 0;
      setTokenBalance(currentBalance);

      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.error('No user_id found in localStorage');
        setLoading(false);
        return;
      }

      const response = await fetch('https://nomira-ai-test.up.railway.app/webhook/api/vacancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vacancies');
      }

      const result = await response.json();
      const apiVacancies = result.data || [];

      const vacancies: Vacancy[] = apiVacancies.map((apiVacancy: any) => ({
        id: apiVacancy.id,
        hr_user_id: apiVacancy.user_id,
        title: apiVacancy.title,
        department: apiVacancy.department,
        level: apiVacancy.level,
        experience_years: 0,
        salary_min: apiVacancy.salary_from || null,
        salary_max: apiVacancy.salary_to || null,
        work_format: apiVacancy.format,
        work_schedule: apiVacancy.vacancy_data?.workload || 'full',
        requirements: apiVacancy.vacancy_data?.requirements || '',
        responsibilities: apiVacancy.vacancy_data?.responsibilities || '',
        status: apiVacancy.status,
        slug: apiVacancy.public_link || apiVacancy.id,
        created_at: apiVacancy.created_at,
        updated_at: apiVacancy.updated_at,
      }));

      const stats: VacancyStats[] = vacancies.map(vacancy => {
        const candidates = mockStorage.getCandidatesByVacancyId(vacancy.id);

        const newCount = candidates.filter(c => c.status === 'new').length;
        const screeningCount = candidates.filter(c => c.status === 'screening').length;
        const interviewedCount = candidates.filter(c => c.status === 'interviewed').length;
        const offeredCount = candidates.filter(c => c.status === 'offered').length;
        const rejectedCount = candidates.filter(c => c.status === 'rejected').length;

        const matchScores = candidates
          .map(c => mockStorage.getMatchByCandidate(c.id)?.overall_score)
          .filter((score): score is number => score !== undefined && score !== null);

        const avgMatchScore = matchScores.length > 0
          ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
          : 0;

        return {
          vacancy,
          totalCandidates: candidates.length,
          newCandidates: newCount,
          screeningCandidates: screeningCount,
          interviewedCandidates: interviewedCount,
          offeredCandidates: offeredCount,
          rejectedCandidates: rejectedCount,
          avgMatchScore,
        };
      });

      setVacanciesStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Не указана';
    if (!min) return `до ${max?.toLocaleString('ru-RU')} ₽`;
    if (!max) return `от ${min.toLocaleString('ru-RU')} ₽`;
    return `${min.toLocaleString('ru-RU')} - ${max.toLocaleString('ru-RU')} ₽`;
  };

  const levelLabels: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
  };

  const workFormatLabels: Record<string, string> = {
    remote: 'Удаленно',
    hybrid: 'Гибрид',
    office: 'Офис',
  };

  const handleShareVacancy = async (vacancy: Vacancy) => {
    const url = `${window.location.origin}/vacancy/${vacancy.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedVacancyId(vacancy.id);
      setTimeout(() => {
        setCopiedVacancyId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка вакансий...</p>
        </div>
      </div>
    );
  }

  const totalStats = {
    totalVacancies: vacanciesStats.length,
    totalCandidates: vacanciesStats.reduce((sum, v) => sum + v.totalCandidates, 0),
    activeVacancies: vacanciesStats.filter(v => v.vacancy.status === 'published').length,
    avgMatchScore: vacanciesStats.length > 0
      ? Math.round(vacanciesStats.reduce((sum, v) => sum + v.avgMatchScore, 0) / vacanciesStats.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Кабинет рекрутера</h1>
              <div className="flex flex-wrap gap-3">
                <Link to="/create-vacancy">
                  <Button className="gap-2">
                    <Plus className="w-5 h-5" />
                    Создать вакансию
                  </Button>
                </Link>
                <Link to="/buy-tokens">
                  <Button variant="outline" className="gap-2">
                    <Coins className="w-5 h-5" />
                    Пополнить токены
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="bg-gradient-to-br from-forest-500 to-forest-600">
              <CardContent className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-xs text-forest-100">Баланс токенов</p>
                    <p className="text-2xl font-bold text-white">
                      {new Intl.NumberFormat('ru-RU').format(tokenBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-gray-600">Управление вакансиями и аналитика по кандидатам</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Всего вакансий</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalVacancies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Всего кандидатов</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Активных вакансий</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.activeVacancies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Средний скор</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.avgMatchScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {vacanciesStats.map(({ vacancy, totalCandidates, newCandidates, screeningCandidates, interviewedCandidates, offeredCandidates, rejectedCandidates, avgMatchScore }) => (
            <Card key={vacancy.id} hover>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{vacancy.title}</h3>
                      <Badge variant={vacancy.status === 'published' ? 'success' : 'warning'}>
                        {vacancy.status === 'published' ? 'Опубликована' : 'Черновик'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {vacancy.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {levelLabels[vacancy.level]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workFormatLabels[vacancy.work_format]}
                      </span>
                      <span>{formatSalary(vacancy.salary_min, vacancy.salary_max)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleShareVacancy(vacancy)}
                    >
                      {copiedVacancyId === vacancy.id ? (
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
                    <Link to={`/vacancy/${vacancy.id}/dashboard`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Просмотр</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600">Всего</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-600">Новые</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{newCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-600">Скрининг</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{screeningCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-purple-600">Интервью</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{interviewedCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-green-600">Офферы</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{offeredCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-xs text-red-600">Отказы</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{rejectedCandidates}</p>
                  </div>

                  <div className="text-center p-3 bg-forest-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-forest-600" />
                      <p className="text-xs text-forest-600">Ср. скор</p>
                    </div>
                    <p className="text-2xl font-bold text-forest-900">{avgMatchScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {vacanciesStats.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет вакансий</h3>
              <p className="text-gray-600 mb-6">Создайте первую вакансию для начала работы</p>
              <Link to="/create-vacancy">
                <Button className="gap-2">
                  <Plus className="w-5 h-5" />
                  Создать вакансию
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
