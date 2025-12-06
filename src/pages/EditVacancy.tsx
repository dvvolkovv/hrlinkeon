import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Edit3, ArrowLeft } from 'lucide-react';

interface VacancyForm {
  title: string;
  department: string;
  level: 'junior' | 'middle' | 'senior' | 'lead';
  salary_from: string;
  salary_to: string;
  format: 'remote' | 'hybrid' | 'office';
  workload: 'full' | 'part';
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  experience: string;
}

export function EditVacancy() {
  const navigate = useNavigate();
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const [form, setForm] = useState<VacancyForm>({
    title: '',
    department: '',
    level: 'middle',
    salary_from: '',
    salary_to: '',
    format: 'remote',
    workload: 'full',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    experience: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVacancy();
  }, [vacancyId]);

  const loadVacancy = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
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
        throw new Error('Failed to fetch vacancy');
      }

      const result = await response.json();
      const vacancies = result.data || [];
      const vacancy = vacancies.find((v: any) => v.id === vacancyId);

      if (!vacancy) {
        throw new Error('Vacancy not found');
      }

      setForm({
        title: vacancy.title || '',
        department: vacancy.department || '',
        level: vacancy.level || 'middle',
        salary_from: vacancy.salary_from?.toString() || '',
        salary_to: vacancy.salary_to?.toString() || '',
        format: vacancy.format || 'remote',
        workload: vacancy.vacancy_data?.workload || 'full',
        description: vacancy.vacancy_data?.description || '',
        requirements: vacancy.vacancy_data?.requirements || '',
        responsibilities: vacancy.vacancy_data?.responsibilities || '',
        benefits: vacancy.vacancy_data?.benefits || '',
        experience: vacancy.vacancy_data?.experience || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке вакансии');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      const payload = {
        user_id: userId,
        status: 'published',
        vacancy_data: {
          title: form.title,
          department: form.department,
          level: form.level,
          salary_from: form.salary_from ? Number(form.salary_from) : null,
          salary_to: form.salary_to ? Number(form.salary_to) : null,
          format: form.format,
          workload: form.workload,
          description: form.description,
          requirements: form.requirements,
          responsibilities: form.responsibilities,
          benefits: form.benefits,
          experience: form.experience,
        },
        extended_data: {
          type: 'vacancy_profile',
          is_ready: true,
        },
      };

      const response = await fetch(`https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-update-vacancy/api/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update vacancy');
      }

      navigate('/recruiter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof VacancyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка вакансии...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/recruiter')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-forest-600 rounded-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Редактирование вакансии</h1>
          </div>
          <p className="text-gray-600">Внесите изменения в информацию о вакансии</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Название вакансии"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="Frontend разработчик"
                    required
                  />
                </div>

                <Input
                  label="Отдел"
                  value={form.department}
                  onChange={(e) => updateForm('department', e.target.value)}
                  placeholder="Разработка"
                  required
                />

                <Select
                  label="Уровень"
                  value={form.level}
                  onChange={(e) => updateForm('level', e.target.value)}
                  options={[
                    { value: 'junior', label: 'Junior' },
                    { value: 'middle', label: 'Middle' },
                    { value: 'senior', label: 'Senior' },
                    { value: 'lead', label: 'Lead' },
                  ]}
                  required
                />

                <Input
                  label="Зарплата от (₽)"
                  type="number"
                  value={form.salary_from}
                  onChange={(e) => updateForm('salary_from', e.target.value)}
                  placeholder="100000"
                />

                <Input
                  label="Зарплата до (₽)"
                  type="number"
                  value={form.salary_to}
                  onChange={(e) => updateForm('salary_to', e.target.value)}
                  placeholder="200000"
                />

                <Select
                  label="Формат работы"
                  value={form.format}
                  onChange={(e) => updateForm('format', e.target.value)}
                  options={[
                    { value: 'remote', label: 'Удаленно' },
                    { value: 'hybrid', label: 'Гибрид' },
                    { value: 'office', label: 'Офис' },
                  ]}
                  required
                />

                <Select
                  label="График работы"
                  value={form.workload}
                  onChange={(e) => updateForm('workload', e.target.value)}
                  options={[
                    { value: 'full', label: 'Полный день' },
                    { value: 'part', label: 'Частичная занятость' },
                  ]}
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="Опыт работы"
                    value={form.experience}
                    onChange={(e) => updateForm('experience', e.target.value)}
                    placeholder="4+ лет опыта разработки"
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Описание вакансии"
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Описание компании и вакансии..."
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Требования"
                    value={form.requirements}
                    onChange={(e) => updateForm('requirements', e.target.value)}
                    placeholder="Опыт работы с React, TypeScript..."
                    rows={4}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Обязанности"
                    value={form.responsibilities}
                    onChange={(e) => updateForm('responsibilities', e.target.value)}
                    placeholder="Разработка frontend приложений..."
                    rows={4}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Преимущества"
                    value={form.benefits}
                    onChange={(e) => updateForm('benefits', e.target.value)}
                    placeholder="ДМС, удаленная работа, гибкий график..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="flex-1 md:flex-none">
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => navigate('/recruiter')}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
