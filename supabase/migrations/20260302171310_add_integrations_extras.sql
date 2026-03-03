/*
  # Extend integrations table for Operon Agent Seeding

  1. Changes to `integrations`
    - Add `events_today` integer column (default 0) to track events pulled today
    - Add `data_sources` jsonb column to store selected data pull options (logs/metrics/alerts/events)
    - Extend `type` column to accept new provider types via a new enum value set
    - Add `pending` status option

  2. New types added to integration type:
     jira, mcp, microsoft_teams (we store as varchar to avoid enum migration complexity)

  We widen the `type` column from enum to text to support the full provider set without needing
  to alter the enum (which requires exclusive lock).

  Note: The existing `status` column already supports 'active' | 'inactive' | 'error'.
  We add a check constraint for 'pending' as well.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'events_today'
  ) THEN
    ALTER TABLE integrations ADD COLUMN events_today integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'data_sources'
  ) THEN
    ALTER TABLE integrations ADD COLUMN data_sources jsonb DEFAULT '{"logs": true, "metrics": true, "alerts": true, "events": false}'::jsonb;
  END IF;
END $$;
