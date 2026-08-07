
CREATE TYPE public.app_role AS ENUM ('admin','lead','member');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.task_status AS ENUM ('backlog','in_progress','under_review','completed');
CREATE TYPE public.project_status AS ENUM ('planning','active','on_hold','completed');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace open access" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated, anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace open access" ON public.teams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_team public.app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated, anon;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace open access" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  status public.project_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated, anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace open access" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'backlog',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated, anon;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace open access" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX tasks_status_idx ON public.tasks(status);

-- Seed data
INSERT INTO public.profiles (id, email, full_name, role) VALUES
 ('11111111-1111-1111-1111-111111111111','amara.dey@codops.io','Amara Dey','admin'),
 ('22222222-2222-2222-2222-222222222222','leo.marsh@codops.io','Leo Marsh','lead'),
 ('33333333-3333-3333-3333-333333333333','sana.iqbal@codops.io','Sana Iqbal','member'),
 ('44444444-4444-4444-4444-444444444444','tom.okafor@codops.io','Tom Okafor','member'),
 ('55555555-5555-5555-5555-555555555555','rin.tanaka@codops.io','Rin Tanaka','lead');

INSERT INTO public.teams (id, name, description) VALUES
 ('aaaaaaa1-0000-4000-8000-000000000001','Platform Core','Infrastructure, APIs and internal tooling'),
 ('aaaaaaa1-0000-4000-8000-000000000002','Product Design','Design system, research and UX flows'),
 ('aaaaaaa1-0000-4000-8000-000000000003','Growth','Acquisition, lifecycle and analytics');

INSERT INTO public.team_members (team_id, user_id, role_in_team) VALUES
 ('aaaaaaa1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','admin'),
 ('aaaaaaa1-0000-4000-8000-000000000001','22222222-2222-2222-2222-222222222222','lead'),
 ('aaaaaaa1-0000-4000-8000-000000000001','44444444-4444-4444-4444-444444444444','member'),
 ('aaaaaaa1-0000-4000-8000-000000000002','55555555-5555-5555-5555-555555555555','lead'),
 ('aaaaaaa1-0000-4000-8000-000000000002','33333333-3333-3333-3333-333333333333','member'),
 ('aaaaaaa1-0000-4000-8000-000000000003','22222222-2222-2222-2222-222222222222','lead'),
 ('aaaaaaa1-0000-4000-8000-000000000003','44444444-4444-4444-4444-444444444444','member');

INSERT INTO public.projects (id, name, description, team_id, start_date, due_date, status) VALUES
 ('bbbbbbb1-0000-4000-8000-000000000001','Atlas Migration','Move billing services onto the new event pipeline','aaaaaaa1-0000-4000-8000-000000000001','2026-05-01','2026-09-30','active'),
 ('bbbbbbb1-0000-4000-8000-000000000002','Design System v3','Token-driven component library refresh','aaaaaaa1-0000-4000-8000-000000000002','2026-06-15','2026-10-15','active'),
 ('bbbbbbb1-0000-4000-8000-000000000003','Onboarding Revamp','Reduce activation friction for new workspaces','aaaaaaa1-0000-4000-8000-000000000003','2026-07-01','2026-11-01','planning');

INSERT INTO public.tasks (title, description, project_id, assigned_to, created_by, priority, status, due_date, completed_at) VALUES
 ('Shard the billing event stream','Split the ingest topic by tenant to cut p99 latency during peak invoicing windows.','bbbbbbb1-0000-4000-8000-000000000001','22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','critical','in_progress','2026-08-12',NULL),
 ('Retire legacy invoice worker','Decommission the cron worker once the new consumer is verified in production.','bbbbbbb1-0000-4000-8000-000000000001','44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','high','backlog','2026-08-28',NULL),
 ('Write migration runbook','Step-by-step cutover and rollback instructions for the on-call rotation.','bbbbbbb1-0000-4000-8000-000000000001','33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','medium','under_review','2026-08-05',NULL),
 ('Audit token contrast ratios','Verify every semantic color pair clears WCAG AA on both themes.','bbbbbbb1-0000-4000-8000-000000000002','55555555-5555-5555-5555-555555555555','55555555-5555-5555-5555-555555555555','medium','completed','2026-07-28','2026-07-26T14:20:00Z'),
 ('Ship data table primitive','Sortable, virtualized table with sticky headers and density modes.','bbbbbbb1-0000-4000-8000-000000000002','33333333-3333-3333-3333-333333333333','55555555-5555-5555-5555-555555555555','high','in_progress','2026-08-20',NULL),
 ('Deprecate v2 icon set','Map old icon names to the new set and publish a codemod.','bbbbbbb1-0000-4000-8000-000000000002','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','low','backlog','2026-09-14',NULL),
 ('Instrument activation funnel','Add events for every step between signup and first task created.','bbbbbbb1-0000-4000-8000-000000000003','22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','high','under_review','2026-08-02',NULL),
 ('Draft welcome email series','Three-touch lifecycle sequence for new workspace owners.','bbbbbbb1-0000-4000-8000-000000000003','33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','low','backlog','2026-09-05',NULL),
 ('Interview 8 churned admins','Understand where teams stall during the first week.','bbbbbbb1-0000-4000-8000-000000000003','55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','medium','completed','2026-07-20','2026-07-19T09:10:00Z'),
 ('Rotate service credentials','Quarterly rotation across the ingest and billing workers.','bbbbbbb1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','critical','backlog','2026-08-01',NULL),
 ('Fix flaky checkout e2e suite','Three specs fail intermittently on CI due to race conditions.','bbbbbbb1-0000-4000-8000-000000000001','44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','high','in_progress','2026-08-09',NULL),
 ('Publish component usage docs','Cover props, accessibility notes and dos/donts per component.','bbbbbbb1-0000-4000-8000-000000000002','33333333-3333-3333-3333-333333333333','55555555-5555-5555-5555-555555555555','medium','completed','2026-08-01','2026-07-31T16:45:00Z');
