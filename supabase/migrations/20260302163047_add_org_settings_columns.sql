/*
  # Add Organization Settings Columns to user_profiles

  Adds timezone and default_project_id columns to support
  the Organization Settings section in the Settings page.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'default_project_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN default_project_id uuid;
  END IF;
END $$;
