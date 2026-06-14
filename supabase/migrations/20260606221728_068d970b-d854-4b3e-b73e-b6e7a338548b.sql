
CREATE TABLE public.site_image_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  url text NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX site_image_versions_key_created_at_idx
  ON public.site_image_versions (key, created_at DESC);

GRANT SELECT ON public.site_image_versions TO authenticated;
GRANT ALL ON public.site_image_versions TO service_role;

ALTER TABLE public.site_image_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_image_versions admin read" ON public.site_image_versions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
