import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Sparkles, Target, Users, TrendingUp, CheckCircle, Briefcase, FileText } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.jpg"
              alt="HR-Linkeon"
              className="w-32 h-32 rounded-2xl shadow-lg"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-forest-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-forest-700" />
            <span className="text-sm font-medium text-forest-700">
              AI-powered рекрутинг нового поколения
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            HR-Linkeon
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Создавайте глубинный портрет идеального сотрудника за 10-15 минут и автоматически
            отбирайте подходящих кандидатов по soft-skills, мотивации и ценностям
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Briefcase className="w-5 h-5" />
                Кабинет рекрутера
              </Button>
            </Link>
            <Link to="/open-vacancies">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <FileText className="w-5 h-5" />
                Открытые вакансии
              </Button>
            </Link>
            <a href="https://hr.linkeon.io/vacancy/121808" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Users className="w-5 h-5" />
                Демо: Откликнуться
              </Button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card hover className="text-center">
            <CardContent className="py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Глубинное профилирование
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI-ассистент создает детальный портрет идеального кандидата через структурированное
                интервью с HR
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center">
            <CardContent className="py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Автоматический скрининг
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Система автоматически проводит чат-интервью с кандидатами и оценивает совместимость
                по 5 параметрам
              </p>
            </CardContent>
          </Card>

          <Card hover className="text-center">
            <CardContent className="py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-warm-400 to-warm-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Экономия 50-70% времени
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Автоматически отсеивайте неподходящих кандидатов и фокусируйтесь на лучших
                совпадениях
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-forest-600 to-forest-700 border-0 text-white">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Как работает HR-Linkeon
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '1',
                  title: 'Создайте вакансию',
                  description: 'Заполните базовую информацию о позиции',
                },
                {
                  step: '2',
                  title: 'AI-профилирование',
                  description: 'Ответьте на вопросы ассистента о идеальном кандидате',
                },
                {
                  step: '3',
                  title: 'Получайте отклики',
                  description: 'Кандидаты проходят автоматический AI-скрининг',
                },
                {
                  step: '4',
                  title: 'Выбирайте лучших',
                  description: 'Смотрите рейтинги совпадений и отчеты по каждому кандидату',
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-forest-100 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-16">
          <Card>
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Что получают HR-специалисты
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[
                  'Глубинный профиль вакансии с BDI-портретом',
                  'Автоматический анализ резюме',
                  'AI-чат интервью с кандидатами',
                  'Оценка совпадения по hard и soft skills',
                  'Культурный фит и ценностное совпадение',
                  'Риск-анализ и красные флаги',
                  'Рейтинг кандидатов по релевантности',
                  'Детальные отчеты по каждому кандидату',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <span>© 2025 HR Linkeon</span>
            <span className="hidden sm:block">•</span>
            <Link
              to="/privacy"
              className="text-forest-600 hover:text-forest-700 transition-colors underline"
            >
              Политика конфиденциальности
            </Link>
            <span className="hidden sm:block">•</span>
            <Link
              to="/terms"
              className="text-forest-600 hover:text-forest-700 transition-colors underline"
            >
              Пользовательское соглашение
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
