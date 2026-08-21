-- Tighten tasks writes: previously any authenticated member could insert or
-- update any task (see 20260807170000_harden_rls.sql). Now inserts must be
-- self-attributed, and updates require being the assignee, the creator, the
-- owning project's team lead, or an admin. Reads and admin-only deletes are
-- unchanged.

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_workspace_admin()
    OR (
      project_id IS NOT NULL
      AND public.is_team_lead((SELECT p.team_id FROM public.projects p WHERE p.id = project_id))
    )
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_workspace_admin()
    OR (
      project_id IS NOT NULL
      AND public.is_team_lead((SELECT p.team_id FROM public.projects p WHERE p.id = project_id))
    )
  );
