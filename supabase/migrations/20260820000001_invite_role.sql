-- Allow invites to set the initial role. inviteUserByEmail passes the role via
-- raw_user_meta_data; the sign-up trigger reads it and falls back to 'member'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.raw_user_meta_data->>'role' IN ('admin','lead','member')
         THEN (NEW.raw_user_meta_data->>'role')::public.app_role
         ELSE 'member' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;