-- Persist the Admin -> Policies toggles (previously hard-coded, UI-only).

-- Defined here (not just in the initial migration) because it's missing on
-- some environments; CREATE OR REPLACE makes this a no-op where it exists.
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.workspace_policies (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.workspace_policies TO authenticated;
GRANT ALL ON public.workspace_policies TO service_role;
ALTER TABLE public.workspace_policies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER workspace_policies_updated_at BEFORE UPDATE ON public.workspace_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "workspace_policies_select" ON public.workspace_policies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "workspace_policies_write_admin" ON public.workspace_policies
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin())
  WITH CHECK (public.is_workspace_admin());

INSERT INTO public.workspace_policies (key, label, enabled) VALUES
 ('require_lead_approval', 'Require lead approval on task completion', true),
 ('auto_archive_projects', 'Auto-archive completed projects after 30 days', false),
 ('publish_evaluation_scores', 'Publish quarterly evaluation scores to members', true),
 ('enforce_sso', 'Enforce SSO for all workspace members', true)
ON CONFLICT (key) DO NOTHING;
