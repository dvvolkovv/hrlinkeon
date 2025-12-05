/*
  # Update vacancy_profiles structure
  
  1. Changes
    - Add full_profile_data jsonb column to store complete vacancy profile from AI
    - Add pitch text column for vacancy pitch
    - Update vacancy_profiles to support new profile structure with:
      - company info
      - role_context
      - responsibilities
      - hard_skills, soft_skills, values arrays
      - motivation_profile
      - anti_profile (red flags)
      - conditions
      - hiring_process
      - pitch
  
  2. Notes
    - Keep existing columns for backward compatibility
    - full_profile_data will store the complete JSON from backend
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vacancy_profiles' AND column_name = 'full_profile_data'
  ) THEN
    ALTER TABLE vacancy_profiles ADD COLUMN full_profile_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vacancy_profiles' AND column_name = 'pitch'
  ) THEN
    ALTER TABLE vacancy_profiles ADD COLUMN pitch text DEFAULT '';
  END IF;
END $$;
