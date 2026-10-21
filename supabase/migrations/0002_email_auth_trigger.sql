-- Migration 0002: Automatic profile provisioning on auth.users signup
-- Supports standard email/password authentication with email confirmation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username text;
  v_normalized text;
  v_timezone text;
BEGIN
  -- Extract username from metadata or fallback to email prefix
  v_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  v_normalized := lower(v_username);

  -- Extract timezone or fallback to UTC
  v_timezone := COALESCE(
    new.raw_user_meta_data->>'timezone',
    'UTC'
  );

  INSERT INTO public.profiles (id, username, username_normalized, timezone, created_at)
  VALUES (new.id, v_username, v_normalized, v_timezone, now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    username_normalized = EXCLUDED.username_normalized,
    timezone = EXCLUDED.timezone;

  RETURN new;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
