-- Admin full control: grant the admin role complete DML on every table.
-- Most tables already allow admin writes (teams, team_members, projects,
-- tasks). profiles was missing INSERT/DELETE, so add admin-only policies.

GRANT INSERT, DELETE ON public.profiles TO authenticated;

CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_workspace_admin());