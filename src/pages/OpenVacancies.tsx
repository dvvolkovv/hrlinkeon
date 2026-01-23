import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { HTMLContent } from '../components/ui/HTMLContent';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Building2 } from 'lucide-react';
import { apiGet } from '../lib/api';

interface Vacancy {
  id: string;
  public_link: string;
  title: string;
  department: string;
  level: string;
  experience: string;
  salary_from: number;
  salary_to: number;
  format: string;
  workload: string;
  description_preview: string;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Vacancy[];
  pagination: {
    page: number;
    limit: number;
    total: string;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

const formatMap: Record<string, string> = {
  remote: 'Удаленно',
  office: 'Офис',
  hybrid: 'Гибрид',
  flexible: 'Гибкий',
};

const workloadMap: Record<string, string> = {
  full: 'Полная занятость',
  'full-time': 'Полная занятость',
  part: 'Частичная занятость',
  'part-time': 'Частичная занятость',
};

const levelMap: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  mid: 'Middle',
  'mid-level': 'Middle',
  senior: 'Senior',
  lead: 'Lead',
};

export function OpenVacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const data = await apiGet<ApiResponse>('/public/vacancies/all', { skipAuth: true });

        if (data.success) {
          setVacancies(data.data);
        } else {
          setError('Не удалось загрузить вакансии');
        }
      } catch (err) {
        setError('Ошибка при загрузке вакансий');
        console.error('Error fetching vacancies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  const formatSalary = (from: number, to: number) => {
    if (from && to) {
      return `${from.toLocaleString('ru-RU')} - ${to.toLocaleString('ru-RU')} ₽`;
    } else if (from) {
      return `от ${from.toLocaleString('ru-RU')} ₽`;
    } else if (to) {
      return `до ${to.toLocaleString('ru-RU')} ₽`;
    }
    return 'По договоренности';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Открытые вакансии
            </h1>
          </div>

          <p className="text-lg text-gray-600">
            Найдите подходящую вакансию и откликнитесь прямо сейчас
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-forest-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Загрузка вакансий...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && vacancies.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Нет открытых вакансий</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && vacancies.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {vacancies.map((vacancy) => (
              <Card key={vacancy.id} hover className="transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="primary">
                          {levelMap[vacancy.level.toLowerCase()] || vacancy.level}
                        </Badge>
                        <Badge variant="secondary">{vacancy.department}</Badge>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {vacancy.title}
                      </h2>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatSalary(vacancy.salary_from, vacancy.salary_to)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{formatMap[vacancy.format.toLowerCase()] || vacancy.format}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{workloadMap[vacancy.workload.toLowerCase()] || vacancy.workload}</span>
                        </div>
                        {vacancy.experience && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            <span>{vacancy.experience}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-gray-700 line-clamp-3 mb-4">
                        <HTMLContent content={vacancy.description_preview} />
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <a
                        href={`https://hr.linkeon.io/vacancy/${vacancy.public_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 lg:flex-initial"
                      >
                        <Button className="w-full whitespace-nowrap">
                          Откликнуться
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
