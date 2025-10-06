/*
  # Initial Database Schema for Project Portfolio Management

  ## Overview
  This migration creates the foundational database structure for a multi-tenant project portfolio 
  management system with authentication, company workspace management, and comprehensive project tracking.

  ## New Tables Created

  ### 1. `profiles`
  User profile information linked to Supabase auth
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `company_id` (uuid) - Links to companies table
  - `role` (text) - User role: 'admin', 'manager', 'member'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `companies`
  Company/organization workspaces
  - `id` (uuid, primary key) - Unique company identifier
  - `name` (text) - Company name
  - `access_code` (text, unique) - Code for team members to join
  - `created_at` (timestamptz) - Company creation timestamp
  - `created_by` (uuid) - User who created the company

  ### 3. `projects`
  Project portfolio with comprehensive tracking
  - `id` (uuid, primary key) - Unique project identifier
  - `company_id` (uuid) - Links to companies table
  - `created_by` (uuid) - User who created the project
  - `user_id` (uuid) - For backward compatibility
  - `name` (text) - Project name
  - `owner` (text) - Project owner/lead name
  - `details` (text) - Project description
  - `notes` (text) - Additional notes
  
  **Timeline & Status:**
  - `start_date` (date) - Project start date
  - `duration` (integer) - Duration in months
  - `scale` (text) - 'Short-term', 'Medium-term', or 'Long-term'
  - `priority` (text) - 'High', 'Medium', or 'Low'
  - `status` (text) - 'Planning', 'In progress', 'Complete', 'Paused', 'Cancelled'
  
  **Financial Tracking:**
  - `budget` (decimal) - Planned budget amount
  - `actual_costs` (decimal) - Actual costs incurred
  - `discount_rate` (decimal) - Discount rate for NPV calculation (default 10%)
  - `expected_revenue` (decimal) - Expected revenue from project
  - `npv` (decimal) - Calculated Net Present Value
  
  **Resource Management:**
  - `resource_allocation` (jsonb) - Resource assignments {resource_type: quantity}
  - `resource_utilization` (decimal) - Resource utilization percentage
  
  **Risk Assessment:**
  - `risk_score` (integer) - Calculated risk score (0-100)
  - `risk_factors` (jsonb) - Risk assessment details
  
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access data from their company
  - Policies enforce authentication and company membership
  - Restrictive by default - explicit policies grant access

  ## Important Notes
  - All monetary values use DECIMAL(15,2) for precision
  - JSONB fields allow flexible data structures for resources and risks
  - Timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure data integrity
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  access_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table with all fields for PPM features
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name text NOT NULL,
  owner text,
  details text,
  notes text,
  
  -- Timeline & Status
  start_date date,
  duration integer,
  scale text DEFAULT 'Short-term' CHECK (scale IN ('Short-term', 'Medium-term', 'Long-term')),
  priority text DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status text DEFAULT 'Planning' CHECK (status IN ('Planning', 'In progress', 'Complete', 'Paused', 'Cancelled')),
  
  -- Financial tracking
  budget decimal(15,2) DEFAULT 0,
  actual_costs decimal(15,2) DEFAULT 0,
  discount_rate decimal(5,2) DEFAULT 10.00,
  expected_revenue decimal(15,2) DEFAULT 0,
  npv decimal(15,2),
  
  -- Resource management
  resource_allocation jsonb DEFAULT '{}',
  resource_utilization decimal(5,2) DEFAULT 0,
  
  -- Risk assessment
  risk_score integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_scale ON projects(scale);
CREATE INDEX IF NOT EXISTS idx_companies_access_code ON companies(access_code);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for COMPANIES table

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.company_id = companies.id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.company_id = companies.id
      AND profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.company_id = companies.id
      AND profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for PROFILES table

CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = profiles.company_id
    )
  );

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for PROJECTS table

CREATE POLICY "Users can view projects in their company"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = projects.company_id
    )
  );

CREATE POLICY "Company members can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = projects.company_id
    )
  );

CREATE POLICY "Company members can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = projects.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = projects.company_id
    )
  );

CREATE POLICY "Company members can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = projects.company_id
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_projects ON projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();