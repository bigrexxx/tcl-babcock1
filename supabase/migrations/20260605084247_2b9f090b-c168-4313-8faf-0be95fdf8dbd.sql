CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  department text,
  photo_url text,
  kind text NOT NULL DEFAULT 'executive',
  committee_id text REFERENCES public.committees(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read team" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert team" ON public.team_members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update team" ON public.team_members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete team" ON public.team_members FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.team_members (name, role, department, kind, sort_order) VALUES
  ('Tobi A.', 'President', 'Business Administration', 'executive', 1),
  ('Halima S.', 'Vice President', 'Software Engineering', 'executive', 2),
  ('David O.', 'Secretary', 'Mass Comm', 'executive', 3),
  ('Faith I.', 'Treasurer', 'Accounting', 'executive', 4),
  ('Kunle B.', 'PRO', 'Political Science', 'executive', 5);