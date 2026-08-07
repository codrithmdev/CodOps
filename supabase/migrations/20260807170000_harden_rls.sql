-- Harden RLS: replace the demo "Workspace open access" policies (open to anon +
-- authenticated with full DML) with ownership/role-scoped policies and drop all
-- anon privileges. Access now requires an authenticated session; writes are
-- gated by role (admin) and team membership (lead).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workspace_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_lead(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = _team_id AND tm.user_id = auth.uid()
      AND (tm.role_in_team = 'lead' OR public.is_workspace_admin())
  );
$$;

-- ---------------------------------------------------------------------------
-- Drop anon privileges across all tables for the old open-workspace model.
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.profiles, public.teams, public.team_members, public.projects, public.tasks FROM anon;

-- ---------------------------------------------------------------------------
-- profiles
--   users can read the roster, edit their own row; admins edit everyone.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workspace open access" ON public.profiles;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_workspace_admin())
  WITH CHECK (public.is_workspace_admin());

-- ---------------------------------------------------------------------------
-- teams
--   any signed-in user may read; only admins create/edit/remove teams.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workspace open access" ON public.teams;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;

CREATE POLICY "teams_select" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_write_admin" ON public.teams FOR ALL TO authenticated
  USING (public.is_workspace_admin())
  WITH CHECK (public.is_workspace_admin());

-- ---------------------------------------------------------------------------
-- team_members
--   membership visible to all; managed by admins and team leads.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workspace open access" ON public.team_members;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_write_lead" ON public.team_members FOR ALL TO authenticated
  USING (public.is_team_lead(team_id))
  WITH CHECK (public.is_team_lead(team_id));

-- ---------------------------------------------------------------------------
-- projects
--   readable workspace-wide; writable by admins or the owning team's lead.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workspace open access" ON public.projects;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_write_lead" ON public.projects FOR ALL TO authenticated
  USING (public.is_team_lead(team_id))
  WITH CHECK (public.is_team_lead(team_id));
CREATE POLICY "projects_write_admin" ON public.projects FOR ALL TO authenticated
  USING (public.is_workspace_admin())
  WITH CHECK (public.is_workspace_admin());

-- ---------------------------------------------------------------------------
-- tasks
--   any member can read/create/update (keeps the board usable for everyone);
--   deletions are admin-only. NOTE: dragging any card is open to members --
--   tighten to assignee/owner when per-task ownership is required.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Workspace open access" ON public.tasks;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

CREATE POLICY "tasks_read_create" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tasks_delete_admin" ON public.tasks FOR DELETE TO authenticated
  USING (public.is_workspace_admin());