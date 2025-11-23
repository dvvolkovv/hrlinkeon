/*
  # Update RLS Policies for Demo/Testing

  ## Overview
  Updates RLS policies to allow demo functionality without authentication.
  This enables MVP testing where users can create vacancies and apply without signing in.

  ## Changes
  1. Allow anonymous users to create vacancies (for demo)
  2. Allow anonymous users to view vacancies with null hr_user_id
  3. Keep existing policies for authenticated users
*/

-- Allow anonymous users to insert vacancies (for demo/testing)
CREATE POLICY "Anonymous can create demo vacancies"
  ON vacancies FOR INSERT
  TO anon
  WITH CHECK (hr_user_id IS NULL);

-- Allow anonymous users to view demo vacancies
CREATE POLICY "Anonymous can view demo vacancies"
  ON vacancies FOR SELECT
  TO anon
  USING (hr_user_id IS NULL OR status = 'published');

-- Allow anonymous to create vacancy profiles for demo vacancies
CREATE POLICY "Anonymous can create demo vacancy profiles"
  ON vacancy_profiles FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id IS NULL
    )
  );

-- Allow anonymous to view demo vacancy profiles
CREATE POLICY "Anonymous can view demo vacancy profiles"
  ON vacancy_profiles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND (vacancies.hr_user_id IS NULL OR vacancies.status = 'published')
    )
  );

-- Allow anonymous to update demo vacancies (for profiling step)
CREATE POLICY "Anonymous can update demo vacancies"
  ON vacancies FOR UPDATE
  TO anon
  USING (hr_user_id IS NULL)
  WITH CHECK (hr_user_id IS NULL);

-- Allow anonymous to update demo vacancy profiles
CREATE POLICY "Anonymous can update demo vacancy profiles"
  ON vacancy_profiles FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id IS NULL
    )
  );