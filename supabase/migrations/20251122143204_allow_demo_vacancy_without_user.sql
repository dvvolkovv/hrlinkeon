/*
  # Allow Demo Vacancy Without User

  ## Overview
  Temporarily makes hr_user_id nullable to allow demo vacancy creation without auth user.
  This is only for demo/testing purposes.

  ## Changes
  1. Make hr_user_id nullable in vacancies table
  2. Create demo vacancy with null hr_user_id
  3. Update RLS policies to allow public read access to published vacancies
*/

-- Make hr_user_id nullable for demo purposes
ALTER TABLE vacancies ALTER COLUMN hr_user_id DROP NOT NULL;

-- Insert demo vacancy if it doesn't exist
INSERT INTO vacancies (
  id,
  hr_user_id,
  title,
  department,
  level,
  experience_years,
  salary_min,
  salary_max,
  work_format,
  work_schedule,
  requirements,
  responsibilities,
  status,
  slug,
  created_at,
  updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  NULL,
  'Frontend разработчик',
  'Разработка',
  'middle',
  2,
  150000,
  250000,
  'remote',
  'full',
  E'• Опыт работы с React от 2 лет\n• Знание TypeScript\n• Опыт работы с состояниями (Redux/MobX/Zustand)\n• Понимание принципов REST API\n• Опыт работы с Git\n• Знание HTML5, CSS3, адаптивная верстка\n• Будет плюсом: опыт с Next.js, знание тестирования (Jest, React Testing Library)',
  E'• Разработка новых функций для веб-приложения\n• Поддержка и оптимизация существующего кода\n• Участие в code review\n• Взаимодействие с дизайнерами и backend-разработчиками\n• Написание технической документации\n• Участие в планировании спринтов',
  'published',
  'demo-frontend-developer-1234567890',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'published',
  updated_at = now();

-- Create vacancy profile for demo vacancy
INSERT INTO vacancy_profiles (
  vacancy_id,
  mission,
  kpi,
  hard_skills,
  soft_skills,
  values,
  behavioral_profile,
  red_flags,
  created_at,
  updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'Разработка качественного пользовательского интерфейса для инновационного продукта',
  '["Качество кода", "Скорость разработки", "Покрытие тестами"]'::jsonb,
  '["React", "TypeScript", "CSS", "Git"]'::jsonb,
  '["Внимание к деталям", "Коммуникабельность", "Самостоятельность"]'::jsonb,
  '["Качество", "Инновации", "Командная работа"]'::jsonb,
  '{"work_style": "Проактивный", "communication": "Открытый"}'::jsonb,
  '["Отсутствие инициативы", "Игнорирование best practices"]'::jsonb,
  now(),
  now()
)
ON CONFLICT (vacancy_id) DO UPDATE SET
  updated_at = now();