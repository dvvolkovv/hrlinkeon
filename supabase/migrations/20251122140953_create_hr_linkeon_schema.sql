/*
  # HR-Linkeon MVP Database Schema

  ## Overview
  Creates the core database structure for HR-Linkeon platform that enables:
  - HR specialists to create and manage vacancies
  - AI-assisted deep profiling of vacancies
  - Candidate applications and screening
  - AI-powered candidate analysis and matching

  ## New Tables

  ### 1. `vacancies`
  Stores vacancy information created by HR specialists
  - `id` (uuid, primary key)
  - `hr_user_id` (uuid, references auth.users)
  - `title` (text) - Job title
  - `department` (text) - Department name
  - `level` (text) - junior/middle/senior/lead
  - `experience_years` (integer) - Required years of experience
  - `salary_min` (integer) - Minimum salary
  - `salary_max` (integer) - Maximum salary
  - `work_format` (text) - remote/hybrid/office
  - `work_schedule` (text) - full/part
  - `requirements` (text) - Job requirements
  - `responsibilities` (text) - Key responsibilities
  - `status` (text) - draft/published/closed
  - `slug` (text, unique) - URL-friendly identifier
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `vacancy_profiles`
  Deep AI-generated profiles for vacancies
  - `id` (uuid, primary key)
  - `vacancy_id` (uuid, references vacancies)
  - `mission` (text) - Role mission
  - `kpi` (jsonb) - Key performance indicators
  - `hard_skills` (jsonb) - Required technical skills
  - `soft_skills` (jsonb) - Required soft skills
  - `values` (jsonb) - Cultural values
  - `behavioral_profile` (jsonb) - Ideal behavioral traits
  - `red_flags` (jsonb) - Warning signs
  - `commander_profile` (jsonb) - Manager compatibility profile
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `candidates`
  Candidate applications for vacancies
  - `id` (uuid, primary key)
  - `vacancy_id` (uuid, references vacancies)
  - `email` (text, not null)
  - `phone` (text)
  - `resume_url` (text) - Link to uploaded resume
  - `portfolio_url` (text) - GitHub/portfolio link
  - `status` (text) - new/screening/interviewed/accepted/rejected/reserved
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `candidate_profiles`
  AI-generated profiles from candidate screening
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates)
  - `motivation` (text) - Candidate motivation
  - `experience_summary` (text) - Experience summary from resume
  - `soft_skills` (jsonb) - Detected soft skills
  - `values` (jsonb) - Personal values
  - `work_style` (jsonb) - Preferred work style
  - `behavioral_traits` (jsonb) - Behavioral patterns
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `screening_conversations`
  AI chat screening conversations with candidates
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates)
  - `messages` (jsonb) - Array of chat messages
  - `completed` (boolean) - Screening completed flag
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. `candidate_matches`
  AI-calculated matching scores between candidates and vacancies
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates)
  - `vacancy_id` (uuid, references vacancies)
  - `overall_score` (integer) - Overall match 0-100
  - `hard_skills_score` (integer) - Technical skills match
  - `soft_skills_score` (integer) - Soft skills match
  - `cultural_score` (integer) - Cultural fit score
  - `commander_score` (integer) - Manager compatibility
  - `risk_analysis` (jsonb) - Identified risks
  - `strengths` (jsonb) - Candidate strengths
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. `hr_comments`
  HR notes and comments on candidates
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates)
  - `hr_user_id` (uuid, references auth.users)
  - `comment` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to access their own data
  - Public read access to published vacancies
*/

-- Create vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  department text NOT NULL,
  level text NOT NULL CHECK (level IN ('junior', 'middle', 'senior', 'lead')),
  experience_years integer DEFAULT 0,
  salary_min integer,
  salary_max integer,
  work_format text NOT NULL CHECK (work_format IN ('remote', 'hybrid', 'office')),
  work_schedule text NOT NULL CHECK (work_schedule IN ('full', 'part')),
  requirements text DEFAULT '',
  responsibilities text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vacancy_profiles table
CREATE TABLE IF NOT EXISTS vacancy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid REFERENCES vacancies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mission text DEFAULT '',
  kpi jsonb DEFAULT '[]'::jsonb,
  hard_skills jsonb DEFAULT '[]'::jsonb,
  soft_skills jsonb DEFAULT '[]'::jsonb,
  values jsonb DEFAULT '[]'::jsonb,
  behavioral_profile jsonb DEFAULT '{}'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  commander_profile jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid REFERENCES vacancies(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  phone text,
  resume_url text,
  portfolio_url text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'screening', 'interviewed', 'accepted', 'rejected', 'reserved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidate_profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE UNIQUE NOT NULL,
  motivation text DEFAULT '',
  experience_summary text DEFAULT '',
  soft_skills jsonb DEFAULT '[]'::jsonb,
  values jsonb DEFAULT '[]'::jsonb,
  work_style jsonb DEFAULT '{}'::jsonb,
  behavioral_traits jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create screening_conversations table
CREATE TABLE IF NOT EXISTS screening_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE UNIQUE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidate_matches table
CREATE TABLE IF NOT EXISTS candidate_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  vacancy_id uuid REFERENCES vacancies(id) ON DELETE CASCADE NOT NULL,
  overall_score integer DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  hard_skills_score integer DEFAULT 0 CHECK (hard_skills_score >= 0 AND hard_skills_score <= 100),
  soft_skills_score integer DEFAULT 0 CHECK (soft_skills_score >= 0 AND soft_skills_score <= 100),
  cultural_score integer DEFAULT 0 CHECK (cultural_score >= 0 AND cultural_score <= 100),
  commander_score integer DEFAULT 0 CHECK (commander_score >= 0 AND commander_score <= 100),
  risk_analysis jsonb DEFAULT '[]'::jsonb,
  strengths jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, vacancy_id)
);

-- Create hr_comments table
CREATE TABLE IF NOT EXISTS hr_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  hr_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_comments ENABLE ROW LEVEL SECURITY;

-- Policies for vacancies
CREATE POLICY "HR can view own vacancies"
  ON vacancies FOR SELECT
  TO authenticated
  USING (auth.uid() = hr_user_id);

CREATE POLICY "HR can insert own vacancies"
  ON vacancies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = hr_user_id);

CREATE POLICY "HR can update own vacancies"
  ON vacancies FOR UPDATE
  TO authenticated
  USING (auth.uid() = hr_user_id)
  WITH CHECK (auth.uid() = hr_user_id);

CREATE POLICY "HR can delete own vacancies"
  ON vacancies FOR DELETE
  TO authenticated
  USING (auth.uid() = hr_user_id);

CREATE POLICY "Public can view published vacancies"
  ON vacancies FOR SELECT
  TO anon
  USING (status = 'published');

-- Policies for vacancy_profiles
CREATE POLICY "HR can view profiles for own vacancies"
  ON vacancy_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "HR can insert profiles for own vacancies"
  ON vacancy_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "HR can update profiles for own vacancies"
  ON vacancy_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = vacancy_profiles.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

-- Policies for candidates
CREATE POLICY "HR can view candidates for own vacancies"
  ON candidates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = candidates.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can apply to published vacancies"
  ON candidates FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = candidates.vacancy_id
      AND vacancies.status = 'published'
    )
  );

CREATE POLICY "HR can update candidates for own vacancies"
  ON candidates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = candidates.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = candidates.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

-- Policies for candidate_profiles
CREATE POLICY "HR can view candidate profiles for own vacancies"
  ON candidate_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates
      JOIN vacancies ON vacancies.id = candidates.vacancy_id
      WHERE candidates.id = candidate_profiles.candidate_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "System can create candidate profiles"
  ON candidate_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "System can update candidate profiles"
  ON candidate_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for screening_conversations
CREATE POLICY "HR can view screening for own vacancies"
  ON screening_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates
      JOIN vacancies ON vacancies.id = candidates.vacancy_id
      WHERE candidates.id = screening_conversations.candidate_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage screening conversations"
  ON screening_conversations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for candidate_matches
CREATE POLICY "HR can view matches for own vacancies"
  ON candidate_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vacancies
      WHERE vacancies.id = candidate_matches.vacancy_id
      AND vacancies.hr_user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage candidate matches"
  ON candidate_matches FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for hr_comments
CREATE POLICY "HR can view own comments"
  ON hr_comments FOR SELECT
  TO authenticated
  USING (auth.uid() = hr_user_id);

CREATE POLICY "HR can insert own comments"
  ON hr_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = hr_user_id);

CREATE POLICY "HR can update own comments"
  ON hr_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = hr_user_id)
  WITH CHECK (auth.uid() = hr_user_id);

CREATE POLICY "HR can delete own comments"
  ON hr_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = hr_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacancies_hr_user ON vacancies(hr_user_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_slug ON vacancies(slug);
CREATE INDEX IF NOT EXISTS idx_candidates_vacancy ON candidates(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_scores ON candidate_matches(vacancy_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_hr_comments_candidate ON hr_comments(candidate_id);