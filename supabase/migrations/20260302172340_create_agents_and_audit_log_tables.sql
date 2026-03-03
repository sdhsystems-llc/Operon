/*
  # Create agents and audit_log tables

  1. New Tables
    - `agents` — AI agent definitions with status and task tracking
    - `agent_logs` — log lines per agent
    - `audit_log` — system-wide audit trail

  2. Security
    - Enable RLS on all three tables
    - Users can only access their own org's data
*/

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'investigator',
  status text NOT NULL DEFAULT 'idle',
  tasks_completed_today integer NOT NULL DEFAULT 0,
  current_task text,
  capabilities jsonb NOT NULL DEFAULT '[]',
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  actor_type text NOT NULL DEFAULT 'human',
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  resource_type text NOT NULL DEFAULT '',
  resource_name text NOT NULL DEFAULT '',
  ip_address text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org agents"
  ON agents FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents for their org"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org agents"
  ON agents FOR UPDATE
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

CREATE POLICY "Users can delete their org agents"
  ON agents FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view logs for their org agents"
  ON agent_logs FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN user_profiles up ON up.id = a.org_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their org agents"
  ON agent_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN user_profiles up ON up.id = a.org_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit log entries for their org"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );
