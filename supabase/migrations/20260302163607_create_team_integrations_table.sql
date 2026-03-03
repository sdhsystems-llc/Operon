/*
  # Create Team Integrations Table

  Stores Slack and Microsoft Teams integration configurations per user/org.

  ## New Tables
  - `team_integrations`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) — owner
    - `type` (text) — 'slack' or 'teams'
    - `connected` (boolean) — whether OAuth/config is complete
    - `workspace_name` (text) — Slack workspace name or Teams tenant name
    - `tenant_id` (text) — Teams tenant ID
    - `bot_token` (text) — encrypted token placeholder
    - `webhook_url` (text) — incoming webhook URL
    - `default_channel` (text) — default channel to route to
    - `channel_routes` (jsonb) — severity → channel mapping
    - `notification_settings` (jsonb) — per-event-type toggles
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled; users can only access their own records
*/

CREATE TABLE IF NOT EXISTS team_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('slack', 'teams')),
  connected boolean NOT NULL DEFAULT false,
  workspace_name text NOT NULL DEFAULT '',
  tenant_id text NOT NULL DEFAULT '',
  bot_token text NOT NULL DEFAULT '',
  webhook_url text NOT NULL DEFAULT '',
  default_channel text NOT NULL DEFAULT '',
  channel_routes jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team integrations"
  ON team_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert team integrations"
  ON team_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team integrations"
  ON team_integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own team integrations"
  ON team_integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_team_integrations_user_id ON team_integrations(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_integrations_user_type ON team_integrations(user_id, type);
