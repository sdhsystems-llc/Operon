/*
  # Create Operon Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `role` (text)
      - `avatar_url` (text)
      - `org_name` (text)
      - `created_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, primary key)
      - `org_id` (uuid, references user_profiles)
      - `name` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `investigations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `title` (text)
      - `severity` (text)
      - `status` (text)
      - `service` (text)
      - `assigned_agent` (text)
      - `root_cause` (text)
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz)
      - `duration_minutes` (integer)
    
    - `investigation_events`
      - `id` (uuid, primary key)
      - `investigation_id` (uuid, references investigations)
      - `event_type` (text)
      - `title` (text)
      - `description` (text)
      - `source` (text)
      - `timestamp` (timestamptz)
      - `correlation_score` (decimal)
    
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `context` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `role` (text)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `integrations`
      - `id` (uuid, primary key)
      - `org_id` (uuid, references user_profiles)
      - `name` (text)
      - `type` (text)
      - `status` (text)
      - `config` (jsonb)
      - `last_sync_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `knowledge_documents`
      - `id` (uuid, primary key)
      - `org_id` (uuid, references user_profiles)
      - `name` (text)
      - `type` (text)
      - `size` (bigint)
      - `status` (text)
      - `url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their organization's data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  avatar_url text,
  org_name text NOT NULL DEFAULT 'Default Organization',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create investigations table
CREATE TABLE IF NOT EXISTS investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'p3',
  status text NOT NULL DEFAULT 'open',
  service text NOT NULL,
  assigned_agent text,
  root_cause text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  duration_minutes integer
);

ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org investigations"
  ON investigations FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert investigations"
  ON investigations FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own org investigations"
  ON investigations FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create investigation_events table
CREATE TABLE IF NOT EXISTS investigation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid REFERENCES investigations(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL DEFAULT 'log',
  title text NOT NULL,
  description text DEFAULT '',
  source text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  correlation_score decimal(3,2) DEFAULT 0.0
);

ALTER TABLE investigation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org investigation events"
  ON investigation_events FOR SELECT
  TO authenticated
  USING (
    investigation_id IN (
      SELECT id FROM investigations WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert investigation events"
  ON investigation_events FOR INSERT
  TO authenticated
  WITH CHECK (
    investigation_id IN (
      SELECT id FROM investigations WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  config jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  size bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org knowledge documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert knowledge documents"
  ON knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org knowledge documents"
  ON knowledge_documents FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org knowledge documents"
  ON knowledge_documents FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_investigations_project_id ON investigations(project_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigation_events_investigation_id ON investigation_events(investigation_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_org_id ON knowledge_documents(org_id);