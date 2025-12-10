import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { mockStorage } from '../lib/mockData';
import { Briefcase, FileText, Edit3, Upload, Link as LinkIcon } from 'lucide-react';

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
  description: string;
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

type CreationMode = 'select' | 'manual' | 'upload' | 'link' | 'review';

export function CreateVacancy() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>('select');
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
    description: '',
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [vacancyUrl, setVacancyUrl] = useState('');
  const [currentVacancyId, setCurrentVacancyId] = useState<string | null>(null);
  const [previousMode, setPreviousMode] = useState<'upload' | 'link'>('upload');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setError('Выберите файл для загрузки');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Пользователь не авторизован');
        navigate('/login');
        return;
      }

      const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;
      if (!hrLinkeonUrl) {
        throw new Error('HR Linkeon URL не настроен');
      }

      const formData = new FormData();
      formData.append('document', uploadedFile);
      formData.append('user_id', userId);

      const response = await fetch(`${hrLinkeonUrl}/webhook/hrcscan`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при загрузке файла');
      }

      const responseData = await response.json();

      if (!responseData.success || !responseData.vacancy_id) {
        throw new Error('Некорректный формат ответа от сервера');
      }

      const vacancyId = responseData.vacancy_id;
      setCurrentVacancyId(vacancyId);
      localStorage.setItem('current_vacancy_id', vacancyId);

      setPreviousMode('upload');
      await loadVacancyData(vacancyId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  const loadVacancyData = async (vacancyId: string, userId: string) => {
    try {
      const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;
      const response = await fetch(`${hrLinkeonUrl}/webhook/api/vacancies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить данные вакансии');
      }

      const result = await response.json();
      const vacancies = result.data || [];
      const vacancy = vacancies.find((v: any) => v.id === vacancyId);

      if (!vacancy) {
        throw new Error('Вакансия не найдена');
      }

      const extendedData = vacancy.extended_data?.vacancy || {};

      setForm({
        title: vacancy.title || '',
        department: vacancy.department || '',
        level: vacancy.level || 'middle',
        experience_years: vacancy.vacancy_data?.experience_years || 0,
        salary_min: vacancy.salary_from ? String(vacancy.salary_from) : '',
        salary_max: vacancy.salary_to ? String(vacancy.salary_to) : '',
        work_format: vacancy.format || 'remote',
        work_schedule: vacancy.vacancy_data?.workload || 'full',
        requirements: vacancy.vacancy_data?.requirements || '',
        responsibilities: vacancy.vacancy_data?.responsibilities || '',
        description: vacancy.vacancy_data?.description || '',
        benefits: vacancy.vacancy_data?.benefits || '',
        experience: vacancy.vacancy_data?.experience || '',
        pitch: extendedData.pitch || '',
        values: Array.isArray(extendedData.values) ? extendedData.values.join('\n') : '',
        company_name: extendedData.company?.name || '',
        company_mission: extendedData.company?.mission || '',
        company_culture: extendedData.company?.culture || '',
        company_values: Array.isArray(extendedData.company?.values) ? extendedData.company.values.join('\n') : '',
        hard_skills: Array.isArray(extendedData.hard_skills) ? extendedData.hard_skills.join('\n') : '',
        soft_skills: Array.isArray(extendedData.soft_skills) ? extendedData.soft_skills.join('\n') : '',
        anti_profile: extendedData.anti_profile?.not_suitable_if ? extendedData.anti_profile.not_suitable_if.join('\n') : '',
        role_goals: extendedData.role_context?.goals || '',
        role_impact: extendedData.role_context?.impact || '',
        hiring_stages: Array.isArray(extendedData.hiring_process?.stages) ? extendedData.hiring_process.stages.join('\n') : '',
        motivation_drivers: Array.isArray(extendedData.motivation_profile?.what_motivates || extendedData.motivation_profile?.drivers)
          ? (extendedData.motivation_profile.what_motivates || extendedData.motivation_profile.drivers).join('\n')
          : '',
      });

      setMode('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных вакансии');
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVacancyId) {
      setError('ID вакансии не найден');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Пользователь не авторизован');
        navigate('/login');
        return;
      }

      const extendedData: any = {
        type: 'vacancy_profile',
        is_ready: true,
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

      const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;
      const response = await fetch(
        `${hrLinkeonUrl}/webhook/hrlinkeon-update-vacancy/api/vacancies/${currentVacancyId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: form.title,
            department: form.department,
            level: form.level,
            salary_from: form.salary_min ? Number(form.salary_min) : null,
            salary_to: form.salary_max ? Number(form.salary_max) : null,
            format: form.work_format,
            vacancy_data: {
              experience_years: Number(form.experience_years),
              workload: form.work_schedule,
              requirements: form.requirements,
              responsibilities: form.responsibilities,
              description: form.description,
              benefits: form.benefits,
              experience: form.experience,
            },
            extended_data: extendedData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Не удалось обновить вакансию');
      }

      navigate(`/vacancy/${currentVacancyId}/profiling`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при обновлении вакансии');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacancyUrl.trim()) {
      setError('Введите ссылку на вакансию');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Пользователь не авторизован');
        navigate('/login');
        return;
      }

      const response = await fetch(
        'https://nomira-ai-test.up.railway.app/webhook/vacancy/urlscan',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: vacancyUrl.trim(),
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при импорте вакансии');
      }

      const responseData = await response.json();

      if (!responseData.vacancy_id) {
        throw new Error('Некорректный формат ответа от сервера');
      }

      const vacancyId = responseData.vacancy_id;
      setCurrentVacancyId(vacancyId);
      localStorage.setItem('current_vacancy_id', vacancyId);

      const vacancyData = responseData.vacancy_data || {};

      const levelMapping: Record<string, 'junior' | 'middle' | 'senior' | 'lead'> = {
        'младший': 'junior',
        'junior': 'junior',
        'средний': 'middle',
        'middle': 'middle',
        'старший': 'senior',
        'senior': 'senior',
        'ведущий': 'lead',
        'lead': 'lead',
      };

      const levelValue = vacancyData.level?.toLowerCase() || '';
      const validLevel = levelMapping[levelValue] || 'middle';

      setForm({
        title: vacancyData.title || '',
        department: vacancyData.department || '',
        level: validLevel,
        experience_years: 0,
        salary_min: vacancyData.salary_from ? String(vacancyData.salary_from) : '',
        salary_max: vacancyData.salary_to ? String(vacancyData.salary_to) : '',
        work_format: vacancyData.format || 'remote',
        work_schedule: vacancyData.workload || 'full',
        requirements: vacancyData.requirements || '',
        responsibilities: vacancyData.responsibilities || '',
        description: vacancyData.description || '',
        benefits: vacancyData.benefits || '',
        experience: vacancyData.experience || '',
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

      setPreviousMode('link');
      setMode('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке вакансии');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-forest-600 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Создание вакансии</h1>
            </div>
            <p className="text-gray-600">Выберите способ создания вакансии</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
              onClick={() => {
                console.log('Navigating to /create-vacancy/manual');
                navigate('/create-vacancy/manual');
              }}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl group-hover:from-forest-600 group-hover:to-forest-700 transition-all">
                  <Edit3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Заполнить вручную</h3>
                <p className="text-gray-600">
                  Введите все данные о вакансии самостоятельно через форму
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
              onClick={() => setMode('upload')}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl group-hover:from-warm-600 group-hover:to-warm-700 transition-all">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Загрузить файл</h3>
                <p className="text-gray-600">
                  Загрузите готовое описание вакансии в формате PDF(рекомендуется), RTF, XML или TXT
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
              onClick={() => setMode('link')}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all">
                  <LinkIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Вставить ссылку</h3>
                <p className="text-gray-600">
                  Предоставьте ссылку на существующую вакансию с сайта
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/recruiter')}
              className="w-full md:w-auto"
            >
              Отмена
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warm-600 rounded-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Загрузка вакансии</h1>
            </div>
            <p className="text-gray-600">Загрузите файл с описанием вакансии</p>
          </div>

          <Card>
            <form onSubmit={handleUploadSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="p-8 bg-warm-50 border-2 border-warm-200 rounded-lg">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-warm-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-warm-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          Обрабатываем ваш файл...
                        </p>
                        <p className="text-sm text-gray-600">
                          Это может занять несколько секунд
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-warm-500 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.rtf,.xml,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-warm-100 rounded-full">
                        <FileText className="w-8 h-8 text-warm-600" />
                      </div>
                      <div className="mb-2">
                        {uploadedFile ? (
                          <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                        ) : (
                          <>
                            <p className="text-lg font-medium text-gray-900 mb-1">
                              Нажмите для выбора файла
                            </p>
                            <p className="text-sm text-gray-500">
                              Поддерживаемые форматы: PDF(рекомедуется), RTF, XML, TXT
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading || !uploadedFile} className="flex-1">
                    {loading ? 'Загрузка...' : 'Продолжить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setMode('select')}
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

  if (mode === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warm-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Проверка и редактирование вакансии</h1>
            </div>
            <p className="text-gray-600">Проверьте данные вакансии и внесите изменения при необходимости</p>
          </div>

          <Card>
            <form onSubmit={handleReviewSubmit}>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Информация о вакансии</h2>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <div className="p-4 bg-warm-50 border border-warm-200 rounded-lg">
                  <p className="text-sm text-warm-800">
                    <strong>Подсказка:</strong> Проверьте автоматически заполненные данные и отредактируйте их при необходимости перед переходом к следующему шагу.
                  </p>
                </div>

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

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Расширенная информация</h3>
                  <div className="space-y-6">
                    <div>
                      <Textarea
                        label="Pitch вакансии"
                        value={form.pitch}
                        onChange={(e) => updateForm('pitch', e.target.value)}
                        placeholder="Краткое привлекательное описание вакансии..."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">Продающее описание вакансии для привлечения кандидатов</p>
                    </div>

                    <div>
                      <Textarea
                        label="Ценности вакансии"
                        value={form.values}
                        onChange={(e) => updateForm('values', e.target.value)}
                        placeholder="Каждая ценность с новой строки..."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">Список ценностей, каждая с новой строки</p>
                    </div>

                    <div>
                      <Textarea
                        label="Hard Skills"
                        value={form.hard_skills}
                        onChange={(e) => updateForm('hard_skills', e.target.value)}
                        placeholder="Каждый навык с новой строки..."
                        rows={5}
                      />
                      <p className="text-sm text-gray-500 mt-1">Технические навыки, каждый с новой строки</p>
                    </div>

                    <div>
                      <Textarea
                        label="Soft Skills"
                        value={form.soft_skills}
                        onChange={(e) => updateForm('soft_skills', e.target.value)}
                        placeholder="Каждый навык с новой строки..."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">Личностные качества, каждое с новой строки</p>
                    </div>

                    <div>
                      <Textarea
                        label="Антипрофиль (кому не подойдет)"
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
                      label="Название компании"
                      value={form.company_name}
                      onChange={(e) => updateForm('company_name', e.target.value)}
                      placeholder="Название компании"
                    />

                    <Textarea
                      label="Миссия компании"
                      value={form.company_mission}
                      onChange={(e) => updateForm('company_mission', e.target.value)}
                      placeholder="Миссия и цели компании..."
                      rows={3}
                    />

                    <Textarea
                      label="Культура компании"
                      value={form.company_culture}
                      onChange={(e) => updateForm('company_culture', e.target.value)}
                      placeholder="Описание корпоративной культуры..."
                      rows={3}
                    />

                    <div>
                      <Textarea
                        label="Ценности компании"
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
                      label="Цели роли"
                      value={form.role_goals}
                      onChange={(e) => updateForm('role_goals', e.target.value)}
                      placeholder="Основные цели и задачи позиции..."
                      rows={3}
                    />

                    <Textarea
                      label="Влияние роли"
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
                        label="Этапы найма"
                        value={form.hiring_stages}
                        onChange={(e) => updateForm('hiring_stages', e.target.value)}
                        placeholder="Каждый этап с новой строки..."
                        rows={3}
                      />
                      <p className="text-sm text-gray-500 mt-1">Этапы процесса найма, каждый с новой строки</p>
                    </div>

                    <div>
                      <Textarea
                        label="Мотиваторы"
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
                    {loading ? 'Сохранение...' : 'Подтвердить и продолжить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setMode(previousMode)}
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

  if (mode === 'link') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Импорт по ссылке</h1>
            </div>
            <p className="text-gray-600">Вставьте ссылку на вакансию с HeadHunter</p>
          </div>

          <Card>
            <form onSubmit={handleLinkSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          Импортируем вакансию...
                        </p>
                        <p className="text-sm text-gray-600">
                          Извлекаем данные из ссылки
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && (
                  <>
                    <div>
                      <Input
                        label="Ссылка на вакансию"
                        type="url"
                        value={vacancyUrl}
                        onChange={(e) => setVacancyUrl(e.target.value)}
                        placeholder="https://hh.ru/vacancy/12345678"
                        required
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Поддерживаются ссылки с HeadHunter
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        </div>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Как это работает?</p>
                          <p className="text-blue-700">
                            Мы автоматически извлечем информацию о вакансии по ссылке и заполним профиль
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading || !vacancyUrl.trim()} className="flex-1">
                    {loading ? 'Загрузка...' : 'Продолжить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setMode('select')}
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
                  onClick={() => setMode('select')}
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
