import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { RichTextEditor } from '../components/ui/RichTextEditor';
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
  pitch: string;
  values: string;
  company_name: string;
  company_mission: string;
  company_culture: string;
  company_values: string;
  hard_skills: string;
  soft_skills: string;
  anti_profile: string;
  role_goals: string;
  role_impact: string;
  hiring_stages: string;
  motivation_drivers: string;
}

export function CreateVacancyManual() {
  const navigate = useNavigate();
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
    pitch: '',
    values: '',
    company_name: '',
    company_mission: '',
    company_culture: '',
    company_values: '',
    hard_skills: '',
    soft_skills: '',
    anti_profile: '',
    role_goals: '',
    role_impact: '',
    hiring_stages: '',
    motivation_drivers: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      const extendedData: any = {
        type: 'vacancy_profile',
        is_ready: false,
        vacancy: {},
      };

      if (form.pitch) extendedData.vacancy.pitch = form.pitch;
      if (form.values) extendedData.vacancy.values = form.values.split('\n').filter(v => v.trim());

      if (form.company_name || form.company_mission || form.company_culture || form.company_values) {
        extendedData.vacancy.company = {};
        if (form.company_name) extendedData.vacancy.company.name = form.company_name;
        if (form.company_mission) extendedData.vacancy.company.mission = form.company_mission;
        if (form.company_culture) extendedData.vacancy.company.culture = form.company_culture;
        if (form.company_values) extendedData.vacancy.company.values = form.company_values.split('\n').filter(v => v.trim());
      }

      if (form.hard_skills) extendedData.vacancy.hard_skills = form.hard_skills.split('\n').filter(v => v.trim());
      if (form.soft_skills) extendedData.vacancy.soft_skills = form.soft_skills.split('\n').filter(v => v.trim());

      if (form.anti_profile) {
        extendedData.vacancy.anti_profile = {
          not_suitable_if: form.anti_profile.split('\n').filter(v => v.trim()),
        };
      }

      if (form.role_goals || form.role_impact) {
        extendedData.vacancy.role_context = {};
        if (form.role_goals) extendedData.vacancy.role_context.goals = form.role_goals;
        if (form.role_impact) extendedData.vacancy.role_context.impact = form.role_impact;
      }

      if (form.hiring_stages) {
        extendedData.vacancy.hiring_process = {
          stages: form.hiring_stages.split('\n').filter(v => v.trim()),
        };
      }

      if (form.motivation_drivers) {
        extendedData.vacancy.motivation_profile = {
          drivers: form.motivation_drivers.split('\n').filter(v => v.trim()),
        };
      }

      const payload = {
        user_id: userId,
        status: 'draft',
        vacancy_data: {
          title: form.title,
          department: form.department,
          level: form.level,
          experience: form.experience,
          salary_from: form.salary_from ? Number(form.salary_from) : null,
          salary_to: form.salary_to ? Number(form.salary_to) : null,
          format: form.format,
          workload: form.workload,
          description: form.description,
          requirements: form.requirements,
          responsibilities: form.responsibilities,
          benefits: form.benefits,
        },
        extended_data: extendedData,
      };

      const response = await fetch('https://nomira-ai-test.up.railway.app/webhook/api/create_vacancy_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create vacancy');
      }

      const result = await response.json();
      navigate(`/vacancy/${result.id}/profiling`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании вакансии');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof VacancyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/create-vacancy')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-forest-600 rounded-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Создание вакансии</h1>
          </div>
          <p className="text-gray-600">Заполните информацию о вакансии</p>
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
                  label="Формат работы(видно соискателю)"
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
                  label="График работы(видно соискателю)"
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
                    label="Опыт работы(видно соискателю)"
                    value={form.experience}
                    onChange={(e) => updateForm('experience', e.target.value)}
                    placeholder="4+ лет опыта разработки"
                  />
                </div>

                <div className="md:col-span-2">
                  <RichTextEditor
                    label="Описание вакансии(видно соискателю)"
                    value={form.description}
                    onChange={(value) => updateForm('description', value)}
                    placeholder="Описание компании и вакансии..."
                  />
                </div>

                <div className="md:col-span-2">
                  <RichTextEditor
                    label="Требования(видно соискателю)"
                    value={form.requirements}
                    onChange={(value) => updateForm('requirements', value)}
                    placeholder="Опыт работы с React, TypeScript..."
                  />
                </div>

                <div className="md:col-span-2">
                  <RichTextEditor
                    label="Обязанности(видно соискателю)"
                    value={form.responsibilities}
                    onChange={(value) => updateForm('responsibilities', value)}
                    placeholder="Разработка frontend приложений..."
                  />
                </div>

                <div className="md:col-span-2">
                  <RichTextEditor
                    label="Преимущества(видно соискателю)"
                    value={form.benefits}
                    onChange={(value) => updateForm('benefits', value)}
                    placeholder="ДМС, удаленная работа, гибкий график..."
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Расширенная информация</h3>
                <div className="space-y-6">
                  <div>
                    <Textarea
                      label="Pitch вакансии(видно соискателю)"
                      value={form.pitch}
                      onChange={(e) => updateForm('pitch', e.target.value)}
                      placeholder="Краткое привлекательное описание вакансии..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Продающее описание вакансии для привлечения кандидатов</p>
                  </div>

                  <div>
                    <Textarea
                      label="Ценности вакансии(не видно соискателю)"
                      value={form.values}
                      onChange={(e) => updateForm('values', e.target.value)}
                      placeholder="Каждая ценность с новой строки..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Список ценностей, каждая с новой строки</p>
                  </div>

                  <div>
                    <Textarea
                      label="Hard Skills (не видно соискателю)"
                      value={form.hard_skills}
                      onChange={(e) => updateForm('hard_skills', e.target.value)}
                      placeholder="Каждый навык с новой строки..."
                      rows={5}
                    />
                    <p className="text-sm text-gray-500 mt-1">Технические навыки, каждый с новой строки</p>
                  </div>

                  <div>
                    <Textarea
                      label="Soft Skills(не видно соискателю)"
                      value={form.soft_skills}
                      onChange={(e) => updateForm('soft_skills', e.target.value)}
                      placeholder="Каждый навык с новой строки..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Личностные качества, каждое с новой строки</p>
                  </div>

                  <div>
                    <Textarea
                      label="Антипрофиль (кому не подойдет)(не видно соискателю)"
                      value={form.anti_profile}
                      onChange={(e) => updateForm('anti_profile', e.target.value)}
                      placeholder="Каждый пункт с новой строки..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Описание кандидатов, которым не подойдет вакансия</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">О компании</h3>
                <div className="space-y-6">
                  <Input
                    label="Название компании(не видно соискателю)"
                    value={form.company_name}
                    onChange={(e) => updateForm('company_name', e.target.value)}
                    placeholder="Название компании"
                  />

                  <Textarea
                    label="Миссия компании(не видно соискателю)"
                    value={form.company_mission}
                    onChange={(e) => updateForm('company_mission', e.target.value)}
                    placeholder="Миссия и цели компании..."
                    rows={3}
                  />

                  <Textarea
                    label="Культура компании(не видно соискателю)"
                    value={form.company_culture}
                    onChange={(e) => updateForm('company_culture', e.target.value)}
                    placeholder="Описание корпоративной культуры..."
                    rows={3}
                  />

                  <div>
                    <Textarea
                      label="Ценности компании(не видно соискателю)"
                      value={form.company_values}
                      onChange={(e) => updateForm('company_values', e.target.value)}
                      placeholder="Каждая ценность с новой строки..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Корпоративные ценности, каждая с новой строки</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Роль и контекст</h3>
                <div className="space-y-6">
                  <Textarea
                    label="Цели роли(не видно соискателю)"
                    value={form.role_goals}
                    onChange={(e) => updateForm('role_goals', e.target.value)}
                    placeholder="Основные цели и задачи позиции..."
                    rows={3}
                  />

                  <Textarea
                    label="Влияние роли(не видно соискателю)"
                    value={form.role_impact}
                    onChange={(e) => updateForm('role_impact', e.target.value)}
                    placeholder="Какое влияние будет иметь кандидат на продукт и компанию..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Процесс найма и мотивация</h3>
                <div className="space-y-6">
                  <div>
                    <Textarea
                      label="Этапы найма(не видно соискателю)"
                      value={form.hiring_stages}
                      onChange={(e) => updateForm('hiring_stages', e.target.value)}
                      placeholder="Каждый этап с новой строки..."
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Этапы процесса найма, каждый с новой строки</p>
                  </div>

                  <div>
                    <Textarea
                      label="Мотиваторы(не видно соискателю)"
                      value={form.motivation_drivers}
                      onChange={(e) => updateForm('motivation_drivers', e.target.value)}
                      placeholder="Каждый мотиватор с новой строки..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Что может мотивировать кандидата, каждый пункт с новой строки</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t">
                <Button type="submit" disabled={loading} className="flex-1 md:flex-none">
                  {loading ? 'Создание...' : 'Создать вакансию'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => navigate('/create-vacancy')}
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
