import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { mockStorage } from '../lib/mockData';
import { Edit3 } from 'lucide-react';

interface VacancyForm {
  title: string;
  department: string;
  level: 'junior' | 'middle' | 'senior' | 'lead';
  experience_years: number;
  salary_min: string;
  salary_max: string;
  work_format: 'remote' | 'hybrid' | 'office';
  work_schedule: 'full' | 'part';
  requirements: string;
  responsibilities: string;
}

export function CreateVacancyManual() {
  const navigate = useNavigate();
  const [form, setForm] = useState<VacancyForm>({
    title: '',
    department: '',
    level: 'middle',
    experience_years: 0,
    salary_min: '',
    salary_max: '',
    work_format: 'remote',
    work_schedule: 'full',
    requirements: '',
    responsibilities: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

      const vacancy = mockStorage.createVacancy({
        hr_user_id: null,
        title: form.title,
        department: form.department,
        level: form.level,
        experience_years: Number(form.experience_years),
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        work_format: form.work_format,
        work_schedule: form.work_schedule,
        requirements: form.requirements,
        responsibilities: form.responsibilities,
        slug,
        status: 'draft',
      });

      navigate(`/vacancy/${vacancy.id}/profiling`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof VacancyForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-forest-600 rounded-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Создание вакансии</h1>
          </div>
          <p className="text-gray-600">Заполните базовую информацию о вакансии</p>
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
                  label="Опыт работы (лет)"
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => updateForm('experience_years', e.target.value)}
                  min="0"
                  required
                />

                <Input
                  label="Зарплата от (₽)"
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => updateForm('salary_min', e.target.value)}
                  placeholder="100000"
                />

                <Input
                  label="Зарплата до (₽)"
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => updateForm('salary_max', e.target.value)}
                  placeholder="200000"
                />

                <Select
                  label="Формат работы"
                  value={form.work_format}
                  onChange={(e) => updateForm('work_format', e.target.value)}
                  options={[
                    { value: 'remote', label: 'Удаленно' },
                    { value: 'hybrid', label: 'Гибрид' },
                    { value: 'office', label: 'Офис' },
                  ]}
                  required
                />

                <Select
                  label="График работы"
                  value={form.work_schedule}
                  onChange={(e) => updateForm('work_schedule', e.target.value)}
                  options={[
                    { value: 'full', label: 'Полный день' },
                    { value: 'part', label: 'Частичная занятость' },
                  ]}
                  required
                />

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
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 md:flex-none">
                  {loading ? 'Создание...' : 'Продолжить'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => navigate('/create-vacancy')}
                >
                  Назад
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
