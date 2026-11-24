CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('earthquake', 'flood', 'fire', 'lightning', 'cyclone', 'heatwave', 'other')),
  location TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 12 AND 1200),
  priority TEXT NOT NULL CHECK (priority IN ('immediate', 'urgent', 'non-urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'resolved')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS incident_reports_reporter_submitted_idx
  ON public.incident_reports (reporter_id, submitted_at DESC);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own incident reports"
  ON public.incident_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit own incident reports"
  ON public.incident_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Clients can supply report facts, but only server defaults can set workflow fields.
REVOKE ALL PRIVILEGES ON TABLE public.incident_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (
  id, client_id, reporter_id, incident_type, location, description,
  priority, status, submitted_at, created_at
) ON TABLE public.incident_reports FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id, client_id, reporter_id, incident_type, location, description,
  priority, status, submitted_at, created_at
) ON TABLE public.incident_reports TO authenticated;

GRANT INSERT (
  client_id, reporter_id, incident_type, location, description, priority
) ON TABLE public.incident_reports TO authenticated;
