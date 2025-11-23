/*
  # Authentication and Token Management System

  ## 1. New Tables
    
    ### `recruiters`
    - `id` (uuid, primary key) - Unique identifier
    - `phone` (text, unique) - Phone number for authentication
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `last_login_at` (timestamptz) - Last successful login
    
    ### `auth_codes`
    - `id` (uuid, primary key) - Unique identifier
    - `recruiter_id` (uuid, foreign key) - Reference to recruiters table
    - `phone` (text) - Phone number
    - `code` (text) - 6-digit verification code
    - `expires_at` (timestamptz) - Expiration time (5 minutes from creation)
    - `verified` (boolean) - Whether code has been used
    - `created_at` (timestamptz) - Code generation timestamp
    
    ### `token_balances`
    - `id` (uuid, primary key) - Unique identifier
    - `recruiter_id` (uuid, foreign key, unique) - Reference to recruiters table
    - `balance` (integer) - Current token balance
    - `total_purchased` (integer) - Total tokens ever purchased
    - `total_consumed` (integer) - Total tokens ever consumed
    - `created_at` (timestamptz) - Balance creation timestamp
    - `updated_at` (timestamptz) - Last balance update
    
    ### `token_transactions`
    - `id` (uuid, primary key) - Unique identifier
    - `recruiter_id` (uuid, foreign key) - Reference to recruiters table
    - `type` (text) - Transaction type: 'purchase', 'consumption', 'refund'
    - `amount` (integer) - Amount of tokens (positive for purchase, negative for consumption)
    - `balance_after` (integer) - Balance after this transaction
    - `description` (text) - Transaction description
    - `metadata` (jsonb) - Additional data (price, tariff, vacancy_id, etc.)
    - `created_at` (timestamptz) - Transaction timestamp
    
    ### `token_tariffs`
    - `id` (uuid, primary key) - Unique identifier
    - `name` (text) - Tariff name
    - `tokens` (integer) - Number of tokens
    - `price` (integer) - Price in rubles
    - `active` (boolean) - Whether tariff is currently available
    - `sort_order` (integer) - Display order
    - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security
    - Enable RLS on all tables
    - Recruiters can only view/edit their own data
    - Auth codes are write-only for security
    - Token transactions are append-only
    - Token tariffs are read-only for recruiters

  ## 3. Important Notes
    - Auth codes expire after 5 minutes
    - Token balances must never go negative
    - All token operations are tracked in transactions table
    - Phone numbers are stored in international format
*/

-- Create recruiters table
CREATE TABLE IF NOT EXISTS recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own profile"
  ON recruiters FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can update own profile"
  ON recruiters FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create auth codes table
CREATE TABLE IF NOT EXISTS auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES recruiters(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth codes can be created by anyone"
  ON auth_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create token balances table
CREATE TABLE IF NOT EXISTS token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid UNIQUE NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  total_purchased integer DEFAULT 0,
  total_consumed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own token balance"
  ON token_balances FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Create token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund')),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

-- Create token tariffs table
CREATE TABLE IF NOT EXISTS token_tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tokens integer NOT NULL,
  price integer NOT NULL,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_tariffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tariffs"
  ON token_tariffs FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Insert default tariffs
INSERT INTO token_tariffs (name, tokens, price, active, sort_order) VALUES
  ('Стартовый', 50000, 199, true, 1),
  ('Профессиональный', 200000, 499, true, 2),
  ('Бизнес', 1000000, 1999, true, 3)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_codes_phone ON auth_codes(phone);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at ON auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_balances_recruiter ON token_balances(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_recruiter ON token_transactions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created ON token_transactions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recruiters_updated_at') THEN
    CREATE TRIGGER update_recruiters_updated_at
      BEFORE UPDATE ON recruiters
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_token_balances_updated_at') THEN
    CREATE TRIGGER update_token_balances_updated_at
      BEFORE UPDATE ON token_balances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Link existing vacancies to recruiter system (update schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vacancies' AND column_name = 'recruiter_id'
  ) THEN
    ALTER TABLE vacancies ADD COLUMN recruiter_id uuid REFERENCES recruiters(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_vacancies_recruiter ON vacancies(recruiter_id);
  END IF;
END $$;

-- Link candidates to recruiter system
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'tokens_consumed'
  ) THEN
    ALTER TABLE candidates ADD COLUMN tokens_consumed integer DEFAULT 0;
  END IF;
END $$;
