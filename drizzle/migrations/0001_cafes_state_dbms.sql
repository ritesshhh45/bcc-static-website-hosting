ALTER TABLE public.restaurants ADD COLUMN is_cafe boolean NOT NULL DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN logo_url text;
ALTER TABLE public.addresses ADD COLUMN state text NOT NULL DEFAULT 'Maharashtra';
ALTER TABLE public.addresses ALTER COLUMN city SET DEFAULT 'Chhatrapati Sambhajinagar';
CREATE INDEX idx_restaurants_is_cafe ON public.restaurants(is_cafe);

-- Owner/admin may read customer profiles on their orders already; let admin manage roles
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- order_items & status log realtime not needed; enable realtime for menu changes not needed.

-- DBMS demo queries (read by the hidden report page)
CREATE TABLE public.dbms_queries (
  id int PRIMARY KEY,
  topic text NOT NULL,
  question text NOT NULL,
  used_in text NOT NULL,
  sql text NOT NULL,
  kind text NOT NULL DEFAULT 'select' CHECK (kind IN ('select','stmt')),
  verify_sql text
);
GRANT SELECT ON public.dbms_queries TO anon, authenticated;
GRANT ALL ON public.dbms_queries TO service_role;
ALTER TABLE public.dbms_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dbms queries readable" ON public.dbms_queries FOR SELECT TO anon, authenticated USING (true);

-- Runs one stored demo query inside a sandbox that is ALWAYS rolled back.
CREATE OR REPLACE FUNCTION public.run_dbms_query(_id int, _passcode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.dbms_queries; res jsonb; n bigint;
BEGIN
  IF _passcode IS DISTINCT FROM 'dbms2026' THEN RAISE EXCEPTION 'Wrong passcode'; END IF;
  SELECT * INTO q FROM public.dbms_queries WHERE id = _id;
  IF q.id IS NULL THEN RAISE EXCEPTION 'Unknown query'; END IF;
  BEGIN
    IF q.kind = 'select' THEN
      EXECUTE format('SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', q.sql) INTO res;
    ELSE
      EXECUTE q.sql;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF q.verify_sql IS NOT NULL THEN
        EXECUTE format('SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', q.verify_sql) INTO res;
      ELSE
        res := jsonb_build_array(jsonb_build_object('rows_affected', n));
      END IF;
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = res::text;
  EXCEPTION WHEN SQLSTATE 'P0099' THEN
    RETURN SQLERRM::jsonb;
  END;
END $$;
GRANT EXECUTE ON FUNCTION public.run_dbms_query(int, text) TO anon, authenticated;