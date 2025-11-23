/*
  # Update auth_codes table structure

  ## Changes
  - Add recruiter_id column if missing
  - Rename 'used' to 'verified' if needed
  - Add proper foreign key constraints
  
  ## Security
  - Maintain existing RLS policies
*/

-- Add recruiter_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_codes' AND column_name = 'recruiter_id'
  ) THEN
    ALTER TABLE auth_codes ADD COLUMN recruiter_id uuid REFERENCES recruiters(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_auth_codes_recruiter ON auth_codes(recruiter_id);
  END IF;
END $$;

-- Rename 'used' to 'verified' if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_codes' AND column_name = 'used'
  ) THEN
    ALTER TABLE auth_codes RENAME COLUMN used TO verified;
  END IF;
END $$;

-- Ensure verified column exists with correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_codes' AND column_name = 'verified'
  ) THEN
    ALTER TABLE auth_codes ADD COLUMN verified boolean DEFAULT false;
  END IF;
END $$;
