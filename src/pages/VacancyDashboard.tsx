import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { mockStorage } from '../lib/mockData';
import { Candidate, CandidateMatch, Vacancy } from '../types/database';

interface CandidateWithMatch extends Candidate {
  match?: CandidateMatch;
}

export function VacancyDashboard() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [candidates, setCandidates] = useState<CandidateWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [vacancyId]);

  const loadData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const vacancyData = mockStorage.getVacancyById(vacancyId || '');
      if (vacancyData) setVacancy(vacancyData);

      const candidatesData = mockStorage.getCandidatesByVacancyId(vacancyId || '');

      const candidatesWithMatches = candidatesData.map((candidate) => {
        const matchData = mockStorage.getMatchByCandidate(candidate.id);
        return {
          ...candidate,
          match: matchData || undefined,
        };
      });

      setCandidates(candidatesWithMatches);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      mockStorage.updateCandidate(candidateId, { status });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    screening: 'Скрининг',
    interviewed: 'Интервью',
    accepted: 'Принят',
    rejected: 'Отклонен',
    reserved: 'В резерве',
  };

  const statusColors: Record<string, 'primary' | 'warning' | 'success' | 'error' | 'info'> = {
    new: 'info',
    screening: 'warning',
    interviewed: 'primary',
    accepted: 'success',
    rejected: 'error',
    reserved: 'warning',
  };

  const filteredCandidates = filterStatus === 'all'
    ? candidates
    : candidates.filter(c => c.status === filterStatus);

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    screening: candidates.filter(c => c.status === 'screening').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
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
          <Button
            variant="outline"
            onClick={() => navigate('/recruiter')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к вакансиям
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vacancy?.title || 'Управление кандидатами'}
          </h1>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Кандидаты</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                >
                  Все
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'new' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('new')}
                >
                  Новые
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'screening' ? 'primary' : 'outline'}
                  onClick={() => setFilterStatus('screening')}
                >
                  Скрининг
                </Button>
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
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-forest-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Badge variant={statusColors[candidate.status]}>
                          {statusLabels[candidate.status]}
                        </Badge>
                        {candidate.match && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              Совпадение: {candidate.match.overall_score}%
                            </div>
                            <div className="w-16 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                                style={{ width: `${candidate.match.overall_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

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
                        {candidate.portfolio_url && (
                          <a
                            href={candidate.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-forest-600 hover:text-forest-700"
                          >
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            Портфолио
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
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
                            variant="outline"
                            onClick={() => updateCandidateStatus(candidate.id, 'rejected')}
                            className="whitespace-nowrap"
                          >
                            Отклонить
                          </Button>
                        </>
                      )}
                      <Link to={`/candidate/${candidate.id}/details`}>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
