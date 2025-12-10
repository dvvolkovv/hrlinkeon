/*
  # Создание таблицы для хранения согласий рекрутеров

  1. Новые таблицы
    - `recruiter_terms_acceptance`
      - `id` (uuid, primary key)
      - `recruiter_phone` (text, номер телефона рекрутера)
      - `accepted_at` (timestamptz, дата и время принятия)
      - `terms_version` (text, версия документов)
      - `user_agreement_accepted` (boolean, пользовательское соглашение)
      - `privacy_policy_accepted` (boolean, политика конфиденциальности)
      - `personal_data_consent_accepted` (boolean, согласие на обработку ПД)
      - `service_description_accepted` (boolean, описание услуг)
      - `created_at` (timestamptz)

  2. Безопасность
    - Включить RLS для таблицы `recruiter_terms_acceptance`
    - Добавить политику для чтения собственных данных
    - Добавить политику для вставки новых записей
*/

CREATE TABLE IF NOT EXISTS recruiter_terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_phone text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  terms_version text NOT NULL DEFAULT '1.0',
  user_agreement_accepted boolean NOT NULL DEFAULT false,
  privacy_policy_accepted boolean NOT NULL DEFAULT false,
  personal_data_consent_accepted boolean NOT NULL DEFAULT false,
  service_description_accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_terms_phone ON recruiter_terms_acceptance(recruiter_phone);
CREATE INDEX IF NOT EXISTS idx_recruiter_terms_accepted_at ON recruiter_terms_acceptance(accepted_at);

ALTER TABLE recruiter_terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert terms acceptance"
  ON recruiter_terms_acceptance
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own terms acceptance"
  ON recruiter_terms_acceptance
  FOR SELECT
  TO public
  USING (recruiter_phone = current_setting('request.jwt.claims', true)::json->>'phone');
