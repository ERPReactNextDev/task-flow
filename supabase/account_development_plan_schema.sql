-- Drop tables in reverse order (to handle foreign keys)
DROP TABLE IF EXISTS adp_kpis;
DROP TABLE IF EXISTS adp_risks;
DROP TABLE IF EXISTS adp_competitors;
DROP TABLE IF EXISTS adp_project_pipeline;
DROP TABLE IF EXISTS adp_action_items;
DROP TABLE IF EXISTS adp_growth_opportunities;
DROP TABLE IF EXISTS adp_business_objectives;
DROP TABLE IF EXISTS adp_key_contacts;
DROP TABLE IF EXISTS account_development_plans;

-- Create Single Account Development Plan Table
CREATE TABLE account_development_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id INTEGER, -- Integer ID referencing your custom users table
  customer_name TEXT,
  industry TEXT,
  account_manager TEXT,
  status TEXT,
  projects TEXT,
  product_offering TEXT,
  account_summary TEXT,
  -- Dynamic sections stored as JSON
  key_contacts JSONB DEFAULT '[]'::jsonb,
  business_objectives JSONB DEFAULT '[]'::jsonb,
  growth_opportunities JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  project_pipeline JSONB DEFAULT '[]'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE account_development_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now)
CREATE POLICY "Enable read access for all users" ON account_development_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON account_development_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON account_development_plans FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON account_development_plans FOR DELETE USING (true);
