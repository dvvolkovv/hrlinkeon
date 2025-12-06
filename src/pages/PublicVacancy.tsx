import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CandidateApplicationForm } from '../components/CandidateApplicationForm';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, Send, Award } from 'lucide-react';
import { mockStorage } from '../lib/mockData';
import { Vacancy } from '../types/database';

interface PublicVacancyResponse {
  success: boolean;
  id: string;
  public_link: string;
  title: string;
  department: string;
  level: 'junior' | 'middle' | 'senior' | 'lead';
  experience?: string;
  salary_from?: number | null;
  salary_to?: number | null;
  format: 'remote' | 'hybrid' | 'office';
  workload: 'full' | 'part';
  description?: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  pitch?: string;
  created_at: string;
}

export function PublicVacancy() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<{ description?: string; benefits?: string; pitch?: string }>({});
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const handleApplicationSuccess = (candidateId: string) => {
    navigate(`/candidate/${candidateId}/screening`);
  };

  useEffect(() => {
    loadVacancy();
  }, [slug]);

  const extractYearsFromExperience = (experience?: string): number => {
    if (!experience) return 0;
    const match = experience.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const loadVacancy = async () => {
    try {
      const publicLink = slug || '';

      if (publicLink.startsWith('demo-')) {
        const demoVacancy = mockStorage.getVacancyBySlug(publicLink);
        setVacancy(demoVacancy);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-public-vacancy/public/vacancies/${publicLink}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setVacancy(null);
        } else {
          throw new Error('Failed to load vacancy');
        }
        setLoading(false);
        return;
      }

      const data: PublicVacancyResponse = await response.json();

      if (!data.success) {
        setVacancy(null);
        setLoading(false);
        return;
      }

      const transformedVacancy: Vacancy = {
        id: data.id,
        hr_user_id: '',
        title: data.title,
        department: data.department,
        level: data.level,
        experience_years: extractYearsFromExperience(data.experience),
        salary_min: data.salary_from || null,
        salary_max: data.salary_to || null,
        work_format: data.format,
        work_schedule: data.workload,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        status: 'published',
        slug: data.public_link,
        created_at: data.created_at,
        updated_at: data.created_at,
      };

      setVacancy(transformedVacancy);
      setAdditionalInfo({
        description: data.description,
        benefits: data.benefits,
        pitch: data.pitch,
      });
    } catch (error) {
      console.error('Error loading vacancy:', error);
      setVacancy(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка вакансии...</p>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Вакансия не найдена</h2>
            <p className="text-gray-600">
              К сожалению, запрашиваемая вакансия не найдена или была закрыта.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatSalary = () => {
    if (vacancy.salary_min && vacancy.salary_max) {
      return `${vacancy.salary_min.toLocaleString()} - ${vacancy.salary_max.toLocaleString()} ₽`;
    }
    if (vacancy.salary_min) {
      return `от ${vacancy.salary_min.toLocaleString()} ₽`;
    }
    if (vacancy.salary_max) {
      return `до ${vacancy.salary_max.toLocaleString()} ₽`;
    }
    return 'По договоренности';
  };

  const workFormatLabels = {
    remote: 'Удаленно',
    hybrid: 'Гибрид',
    office: 'Офис',
  };

  const workScheduleLabels = {
    full: 'Полный день',
    part: 'Частичная занятость',
  };

  const levelLabels = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vacancy.title}</h1>
                <p className="text-lg text-gray-600">{vacancy.department}</p>
              </div>
              <Badge variant="info">{levelLabels[vacancy.level]}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {additionalInfo.pitch && (
              <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{additionalInfo.pitch}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700">
                <DollarSign className="w-5 h-5 text-forest-600" />
                <span>{formatSalary()}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-forest-600" />
                <span>{workFormatLabels[vacancy.work_format]}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-forest-600" />
                <span>{workScheduleLabels[vacancy.work_schedule]}</span>
              </div>

              {vacancy.experience_years > 0 && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-forest-600" />
                  <span>Опыт: {vacancy.experience_years} {vacancy.experience_years === 1 ? 'год' : 'лет'}</span>
                </div>
              )}
            </div>

            {additionalInfo.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">О вакансии</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {additionalInfo.description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Обязанности</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {vacancy.responsibilities}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Требования</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {vacancy.requirements}
              </p>
            </div>

            {additionalInfo.benefits && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-forest-600" />
                  Условия и бонусы
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {additionalInfo.benefits}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full md:w-auto gap-2"
                onClick={() => setShowApplicationForm(true)}
              >
                <Send className="w-5 h-5" />
                Откликнуться на вакансию
              </Button>
            </div>
          </CardContent>
        </Card>

        {showApplicationForm && vacancy && (
          <CandidateApplicationForm
            vacancyId={vacancy.id}
            onSuccess={handleApplicationSuccess}
            onCancel={() => setShowApplicationForm(false)}
          />
        )}
      </div>
    </div>
  );
}
