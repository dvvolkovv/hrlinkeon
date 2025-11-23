export interface Vacancy {
  id: string;
  hr_user_id: string;
  title: string;
  department: string;
  level: 'junior' | 'middle' | 'senior' | 'lead';
  experience_years: number;
  salary_min: number | null;
  salary_max: number | null;
  work_format: 'remote' | 'hybrid' | 'office';
  work_schedule: 'full' | 'part';
  requirements: string;
  responsibilities: string;
  status: 'draft' | 'published' | 'closed';
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface VacancyProfile {
  id: string;
  vacancy_id: string;
  mission: string;
  kpi: string[];
  hard_skills: string[];
  soft_skills: string[];
  values: string[];
  behavioral_profile: Record<string, any>;
  red_flags: string[];
  commander_profile: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  vacancy_id: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  status: 'new' | 'screening' | 'interviewed' | 'accepted' | 'rejected' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  candidate_id: string;
  motivation: string;
  experience_summary: string;
  soft_skills: string[];
  values: string[];
  work_style: Record<string, any>;
  behavioral_traits: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ScreeningConversation {
  id: string;
  candidate_id: string;
  messages: ChatMessage[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'assistant' | 'candidate';
  content: string;
  timestamp: string;
}

export interface CandidateMatch {
  id: string;
  candidate_id: string;
  vacancy_id: string;
  overall_score: number;
  hard_skills_score: number;
  soft_skills_score: number;
  cultural_score: number;
  commander_score: number;
  risk_analysis: string[];
  strengths: string[];
  created_at: string;
  updated_at: string;
}

export interface HRComment {
  id: string;
  candidate_id: string;
  hr_user_id: string;
  comment: string;
  created_at: string;
}
