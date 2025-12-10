import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TermsAcceptance {
  id?: string;
  recruiter_phone: string;
  accepted_at: string;
  terms_version: string;
  user_agreement_accepted: boolean;
  privacy_policy_accepted: boolean;
  personal_data_consent_accepted: boolean;
  service_description_accepted: boolean;
}

export async function saveTermsAcceptance(phone: string, version: string = '1.0'): Promise<void> {
  const { error } = await supabase
    .from('recruiter_terms_acceptance')
    .insert({
      recruiter_phone: phone,
      accepted_at: new Date().toISOString(),
      terms_version: version,
      user_agreement_accepted: true,
      privacy_policy_accepted: true,
      personal_data_consent_accepted: true,
      service_description_accepted: true,
    });

  if (error) {
    console.error('Error saving terms acceptance:', error);
    throw new Error('Не удалось сохранить согласие');
  }
}
