import { Vacancy, Candidate, CandidateMatch } from '../types/database';

export const MOCK_VACANCIES: Record<string, Vacancy> = {
  'demo-frontend-developer-1234567890': {
    id: 'demo-vacancy-1',
    hr_user_id: null,
    title: 'Frontend разработчик',
    department: 'Разработка',
    level: 'middle',
    experience_years: 2,
    salary_min: 150000,
    salary_max: 250000,
    work_format: 'remote',
    work_schedule: 'full',
    requirements: '• Опыт работы с React от 2 лет\n• Знание TypeScript\n• Опыт работы с состояниями (Redux/MobX/Zustand)\n• Понимание принципов REST API\n• Опыт работы с Git\n• Знание HTML5, CSS3, адаптивная верстка\n• Будет плюсом: опыт с Next.js, знание тестирования (Jest, React Testing Library)',
    responsibilities: '• Разработка новых функций для веб-приложения\n• Поддержка и оптимизация существующего кода\n• Участие в code review\n• Взаимодействие с дизайнерами и backend-разработчиками\n• Написание технической документации\n• Участие в планировании спринтов',
    status: 'published',
    slug: 'demo-frontend-developer-1234567890',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'backend-developer-python': {
    id: 'demo-vacancy-2',
    hr_user_id: null,
    title: 'Backend разработчик (Python)',
    department: 'Разработка',
    level: 'senior',
    experience_years: 4,
    salary_min: 200000,
    salary_max: 350000,
    work_format: 'hybrid',
    work_schedule: 'full',
    requirements: '• Опыт разработки на Python от 4 лет\n• Django или FastAPI\n• PostgreSQL, Redis\n• Docker, Kubernetes\n• Опыт проектирования REST API\n• Знание принципов микросервисной архитектуры',
    responsibilities: '• Разработка и поддержка backend-сервисов\n• Проектирование архитектуры\n• Оптимизация производительности\n• Код-ревью и менторинг\n• Интеграция с внешними сервисами',
    status: 'published',
    slug: 'backend-developer-python',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'product-manager': {
    id: 'demo-vacancy-3',
    hr_user_id: null,
    title: 'Product Manager',
    department: 'Продукт',
    level: 'middle',
    experience_years: 3,
    salary_min: 180000,
    salary_max: 280000,
    work_format: 'office',
    work_schedule: 'full',
    requirements: '• Опыт управления продуктом от 3 лет\n• Знание методологий Agile/Scrum\n• Умение работать с аналитикой\n• Опыт формирования продуктовой стратегии\n• Навыки работы с командами разработки',
    responsibilities: '• Формирование продуктовой стратегии\n• Управление бэклогом\n• Анализ метрик и пользовательского поведения\n• Взаимодействие со стейкхолдерами\n• Приоритизация задач',
    status: 'published',
    slug: 'product-manager',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'ux-ui-designer': {
    id: 'demo-vacancy-4',
    hr_user_id: null,
    title: 'UX/UI Дизайнер',
    department: 'Дизайн',
    level: 'middle',
    experience_years: 2,
    salary_min: 120000,
    salary_max: 200000,
    work_format: 'remote',
    work_schedule: 'full',
    requirements: '• Опыт работы дизайнером от 2 лет\n• Figma, Sketch\n• Портфолио с реализованными проектами\n• Знание UX-исследований\n• Понимание UI-паттернов',
    responsibilities: '• Проектирование интерфейсов\n• Создание прототипов\n• Проведение UX-исследований\n• Работа с дизайн-системой\n• Взаимодействие с разработчиками',
    status: 'published',
    slug: 'ux-ui-designer',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const MOCK_CANDIDATES: Record<string, Candidate[]> = {
  'demo-vacancy-1': [
    {
      id: 'candidate-1',
      vacancy_id: 'demo-vacancy-1',
      email: 'ivan.petrov@example.com',
      phone: '+7 (999) 123-45-67',
      portfolio_url: 'https://github.com/ivanpetrov',
      resume_url: null,
      status: 'screening',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-2',
      vacancy_id: 'demo-vacancy-1',
      email: 'maria.sidorova@example.com',
      phone: '+7 (999) 234-56-78',
      portfolio_url: 'https://github.com/mariasidorova',
      resume_url: null,
      status: 'new',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-3',
      vacancy_id: 'demo-vacancy-1',
      email: 'alex.kozlov@example.com',
      phone: null,
      portfolio_url: null,
      resume_url: null,
      status: 'interviewed',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-4',
      vacancy_id: 'demo-vacancy-1',
      email: 'olga.ivanova@example.com',
      phone: '+7 (999) 345-67-89',
      portfolio_url: null,
      resume_url: null,
      status: 'rejected',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-5',
      vacancy_id: 'demo-vacancy-1',
      email: 'dmitry.sokolov@example.com',
      phone: '+7 (999) 456-78-90',
      portfolio_url: 'https://github.com/dmitrysokolov',
      resume_url: null,
      status: 'offered',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-10',
      vacancy_id: 'demo-vacancy-1',
      email: 'igor.frolov@example.com',
      phone: '+7 (999) 567-89-01',
      portfolio_url: 'https://github.com/igorfrolov',
      resume_url: null,
      status: 'rejected',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'demo-vacancy-2': [
    {
      id: 'candidate-6',
      vacancy_id: 'demo-vacancy-2',
      email: 'sergey.morozov@example.com',
      phone: '+7 (999) 567-89-01',
      portfolio_url: 'https://github.com/sergeymorozov',
      resume_url: null,
      status: 'screening',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-7',
      vacancy_id: 'demo-vacancy-2',
      email: 'anna.volkova@example.com',
      phone: '+7 (999) 678-90-12',
      portfolio_url: null,
      resume_url: null,
      status: 'interviewed',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'demo-vacancy-3': [
    {
      id: 'candidate-8',
      vacancy_id: 'demo-vacancy-3',
      email: 'pavel.novikov@example.com',
      phone: '+7 (999) 789-01-23',
      portfolio_url: null,
      resume_url: null,
      status: 'new',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-9',
      vacancy_id: 'demo-vacancy-3',
      email: 'elena.orlova@example.com',
      phone: '+7 (999) 890-12-34',
      portfolio_url: null,
      resume_url: null,
      status: 'screening',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'candidate-10',
      vacancy_id: 'demo-vacancy-3',
      email: 'igor.lebedev@example.com',
      phone: null,
      portfolio_url: null,
      resume_url: null,
      status: 'interviewed',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'demo-vacancy-4': [
    {
      id: 'candidate-11',
      vacancy_id: 'demo-vacancy-4',
      email: 'natalia.romanova@example.com',
      phone: '+7 (999) 901-23-45',
      portfolio_url: 'https://behance.net/nataliaromanova',
      resume_url: null,
      status: 'new',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const MOCK_MATCHES: Record<string, CandidateMatch> = {
  'candidate-1': {
    id: 'match-1',
    candidate_id: 'candidate-1',
    vacancy_id: 'demo-vacancy-1',
    overall_score: 85,
    hard_skills_score: 80,
    soft_skills_score: 90,
    values_match_score: 85,
    motivation_score: 88,
    cultural_fit_score: 87,
    analysis: {
      strengths: ['Отличные коммуникативные навыки', 'Высокая мотивация', 'Опыт работы в команде'],
      concerns: ['Недостаточный опыт с TypeScript'],
      recommendations: 'Рекомендуется к собеседованию'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'candidate-3': {
    id: 'match-3',
    candidate_id: 'candidate-3',
    vacancy_id: 'demo-vacancy-1',
    overall_score: 92,
    hard_skills_score: 95,
    soft_skills_score: 88,
    values_match_score: 90,
    motivation_score: 94,
    cultural_fit_score: 91,
    analysis: {
      strengths: ['Отличные технические навыки', 'Проактивность', 'Системное мышление'],
      concerns: [],
      recommendations: 'Сильный кандидат, рекомендуется к офферу'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'candidate-10': {
    id: 'match-10',
    candidate_id: 'candidate-10',
    vacancy_id: 'demo-vacancy-1',
    overall_score: 42,
    hard_skills_score: 35,
    soft_skills_score: 65,
    values_match_score: 45,
    motivation_score: 50,
    cultural_fit_score: 55,
    analysis: {
      strengths: ['Коммуникабельность', 'Пунктуальность'],
      concerns: ['Критически недостаточный опыт с React', 'Не знаком с TypeScript', 'Отсутствие опыта с современными инструментами сборки', 'Недостаточное понимание компонентной архитектуры'],
      recommendations: 'Не рекомендуется к найму. Требуемые hard skills не соответствуют уровню вакансии.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export interface AIMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export interface CandidateConversation {
  candidateId: string;
  messages: AIMessage[];
  aiConclusion?: string;
  rejectionReason?: string;
}

export const MOCK_CONVERSATIONS: Record<string, CandidateConversation> = {
  'candidate-1': {
    candidateId: 'candidate-1',
    messages: [
      {
        role: 'assistant',
        content: 'Здравствуйте! Спасибо за отклик на вакансию Frontend разработчика. Я AI-ассистент, который поможет оценить вашу кандидатуру. Расскажите, пожалуйста, что привлекло вас в этой вакансии?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        role: 'user',
        content: 'Привет! Меня привлекла возможность работать с современным стеком технологий, особенно React и TypeScript. Также интересна удаленная работа и возможность развития в команде.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Отлично! Расскажите о вашем опыте работы с React. Какие проекты вы разрабатывали и с какими сложностями сталкивались?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      },
      {
        role: 'user',
        content: 'Работал над несколькими проектами. Последний был SPA для управления проектами. Использовал React, Redux, делал интеграцию с REST API. Сложности были с оптимизацией рендеринга больших списков - решил через React.memo и виртуализацию.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 180000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Хороший подход! А как вы относитесь к работе в команде? Опишите ситуацию, когда пришлось искать компромисс с коллегами.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 240000).toISOString(),
      },
      {
        role: 'user',
        content: 'Люблю командную работу. Был случай, когда мы с backend-разработчиком не могли договориться о формате API. Я предложил созвониться, обсудили требования с обеих сторон и нашли решение, которое устроило всех.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
      },
    ],
    aiConclusion: 'Кандидат демонстрирует хорошие технические навыки и опыт решения практических задач. Особенно ценно умение работать в команде и искать компромиссы. Единственное замечание - опыт с TypeScript можно было бы углубить. Рекомендую к собеседованию.',
  },
  'candidate-3': {
    candidateId: 'candidate-3',
    messages: [
      {
        role: 'assistant',
        content: 'Добрый день! Благодарю за отклик. Давайте познакомимся. Расскажите о вашей текущей роли и опыте.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        role: 'user',
        content: 'Здравствуйте! Работаю Frontend-разработчиком 3 года. Специализируюсь на React экосистеме. Делал проекты разной сложности - от лендингов до enterprise SPA.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Впечатляет! Расскажите о самом сложном техническом вызове в вашей карьере.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      },
      {
        role: 'user',
        content: 'Пришлось оптимизировать приложение с огромной формой - 200+ полей. Проблема была в производительности. Разбил на шаги, использовал React Hook Form, добавил lazy loading для секций. Время загрузки сократил с 8 сек до 1.5 сек.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 180000).toISOString(),
      },
    ],
    aiConclusion: 'Очень сильный кандидат. Демонстрирует глубокие технические знания, системное мышление и умение решать сложные задачи. Проактивен, четко формулирует мысли. Рекомендую к офферу.',
  },
  'candidate-4': {
    candidateId: 'candidate-4',
    messages: [
      {
        role: 'assistant',
        content: 'Здравствуйте! Расскажите, почему вы хотите сменить работу?',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        role: 'user',
        content: 'Хочу больше денег и меньше работать.',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Понятно. А что вас интересует в технологическом плане? Какие задачи хотели бы решать?',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      },
      {
        role: 'user',
        content: 'Не знаю, какие дадут.',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 180000).toISOString(),
      },
    ],
    aiConclusion: 'Кандидат не демонстрирует заинтересованности в вакансии и развитии. Мотивация исключительно финансовая, без понимания специфики работы. Отсутствует проактивность и желание развиваться.',
    rejectionReason: 'Низкая мотивация, отсутствие интереса к профессиональному развитию и специфике вакансии. Кандидат не соответствует культурным ценностям компании.',
  },
  'candidate-10': {
    candidateId: 'candidate-10',
    messages: [
      {
        role: 'assistant',
        content: 'Добрый день! Спасибо за интерес к вакансии Frontend разработчика. Расскажите о вашем опыте работы с React.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        role: 'user',
        content: 'Здравствуйте! Я работал с React примерно полгода на прошлом проекте. Делал простые компоненты и формы.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Хорошо. А какие хуки вы использовали? Расскажите о useState, useEffect и других.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      },
      {
        role: 'user',
        content: 'useState использовал для состояния. С useEffect не очень разбирался, честно говоря. Обычно копировал примеры из документации.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 180000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Понятно. А что насчет TypeScript? Как ваш опыт с ним?',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 240000).toISOString(),
      },
      {
        role: 'user',
        content: 'С TypeScript не работал. Только JavaScript. Но я готов учиться!',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'Хорошо. Расскажите про опыт с управлением состоянием - Redux, Zustand или другие библиотеки?',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 360000).toISOString(),
      },
      {
        role: 'user',
        content: 'Нет, с этим не сталкивался. У нас на проекте было все просто, состояние хранили в компонентах.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 420000).toISOString(),
      },
      {
        role: 'assistant',
        content: 'А как вы тестировали свой код? Jest, React Testing Library?',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 480000).toISOString(),
      },
      {
        role: 'user',
        content: 'Тестами занимался QA отдел. Я сам тесты не писал.',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 540000).toISOString(),
      },
    ],
    aiConclusion: 'Кандидат имеет минимальный опыт с React (всего полгода) и демонстрирует поверхностное понимание фреймворка. Не знаком с ключевыми инструментами: TypeScript, state management библиотеки, тестирование. Отсутствует опыт работы с современным стеком технологий, требуемым для вакансии.',
    rejectionReason: 'Недостаточный уровень технических навыков (hard skills). Кандидат не соответствует требованиям вакансии по знанию React, TypeScript и современных практик frontend-разработки. Требуется минимум 2 года практического опыта с нужным стеком технологий.',
  },
};

let nextVacancyId = 2;
let nextCandidateId = 4;

export const mockStorage = {
  vacancies: { ...MOCK_VACANCIES } as Record<string, Vacancy>,
  candidates: { ...MOCK_CANDIDATES } as Record<string, Candidate[]>,
  matches: { ...MOCK_MATCHES } as Record<string, CandidateMatch>,
  conversations: { ...MOCK_CONVERSATIONS } as Record<string, CandidateConversation>,

  createVacancy(vacancy: Omit<Vacancy, 'id' | 'created_at' | 'updated_at'>): Vacancy {
    const id = `vacancy-${nextVacancyId++}`;
    const newVacancy: Vacancy = {
      ...vacancy,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.vacancies[vacancy.slug] = newVacancy;
    this.candidates[id] = [];
    return newVacancy;
  },

  getAllVacancies(): Vacancy[] {
    return Object.values(this.vacancies).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getVacancyBySlug(slug: string): Vacancy | null {
    return this.vacancies[slug] || null;
  },

  getVacancyById(id: string): Vacancy | null {
    return Object.values(this.vacancies).find(v => v.id === id) || null;
  },

  updateVacancy(id: string, updates: Partial<Vacancy>): Vacancy | null {
    const vacancy = this.getVacancyById(id);
    if (!vacancy) return null;

    const updated = { ...vacancy, ...updates, updated_at: new Date().toISOString() };
    this.vacancies[vacancy.slug] = updated;
    return updated;
  },

  createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Candidate {
    const id = `candidate-${nextCandidateId++}`;
    const newCandidate: Candidate = {
      ...candidate,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!this.candidates[candidate.vacancy_id]) {
      this.candidates[candidate.vacancy_id] = [];
    }
    this.candidates[candidate.vacancy_id].push(newCandidate);
    return newCandidate;
  },

  getCandidatesByVacancyId(vacancyId: string): Candidate[] {
    return this.candidates[vacancyId] || [];
  },

  updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
    for (const vacancyId in this.candidates) {
      const index = this.candidates[vacancyId].findIndex(c => c.id === id);
      if (index !== -1) {
        this.candidates[vacancyId][index] = {
          ...this.candidates[vacancyId][index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return this.candidates[vacancyId][index];
      }
    }
    return null;
  },

  getMatchByCandidate(candidateId: string): CandidateMatch | null {
    return this.matches[candidateId] || null;
  },

  getCandidateById(candidateId: string): Candidate | null {
    for (const vacancyId in this.candidates) {
      const candidate = this.candidates[vacancyId].find(c => c.id === candidateId);
      if (candidate) return candidate;
    }
    return null;
  },

  getConversationByCandidate(candidateId: string): CandidateConversation | null {
    return this.conversations[candidateId] || null;
  },
};
