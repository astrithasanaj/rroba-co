
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_code text NOT NULL CHECK (country_code IN ('XK','AL','MK')),
  country_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are publicly readable" ON public.cities
  FOR SELECT USING (true);

CREATE UNIQUE INDEX cities_country_name_uniq ON public.cities (country_code, lower(name));
CREATE INDEX cities_country_sort_idx ON public.cities (country_code, sort_order, name);

-- Seed data
INSERT INTO public.cities (name, country_code, country_name, sort_order) VALUES
  -- Kosovë (XK) — largest first
  ('Prishtinë', 'XK', 'Kosovë', 10),
  ('Prizren', 'XK', 'Kosovë', 20),
  ('Pejë', 'XK', 'Kosovë', 30),
  ('Gjakovë', 'XK', 'Kosovë', 40),
  ('Ferizaj', 'XK', 'Kosovë', 50),
  ('Gjilan', 'XK', 'Kosovë', 60),
  ('Mitrovicë', 'XK', 'Kosovë', 70),
  ('Vushtrri', 'XK', 'Kosovë', 80),
  ('Suharekë', 'XK', 'Kosovë', 90),
  ('Rahovec', 'XK', 'Kosovë', 100),
  ('Drenas', 'XK', 'Kosovë', 110),
  ('Lipjan', 'XK', 'Kosovë', 120),
  ('Podujevë', 'XK', 'Kosovë', 130),
  ('Malishevë', 'XK', 'Kosovë', 140),
  ('Skenderaj', 'XK', 'Kosovë', 150),
  ('Kamenicë', 'XK', 'Kosovë', 160),
  ('Viti', 'XK', 'Kosovë', 170),
  ('Deçan', 'XK', 'Kosovë', 180),
  ('Istog', 'XK', 'Kosovë', 190),
  ('Klinë', 'XK', 'Kosovë', 200),
  ('Fushë Kosovë', 'XK', 'Kosovë', 210),
  ('Obiliq', 'XK', 'Kosovë', 220),
  ('Shtime', 'XK', 'Kosovë', 230),
  ('Dragash', 'XK', 'Kosovë', 240),
  ('Hani i Elezit', 'XK', 'Kosovë', 250),
  ('Kaçanik', 'XK', 'Kosovë', 260),
  ('Junik', 'XK', 'Kosovë', 270),
  ('Mamushë', 'XK', 'Kosovë', 280),
  ('Novobërdë', 'XK', 'Kosovë', 290),
  ('Partesh', 'XK', 'Kosovë', 300),
  ('Ranillug', 'XK', 'Kosovë', 310),
  ('Kllokot', 'XK', 'Kosovë', 320),
  ('Graçanicë', 'XK', 'Kosovë', 330),
  ('Zubin Potok', 'XK', 'Kosovë', 340),
  ('Zveçan', 'XK', 'Kosovë', 350),
  ('Leposaviq', 'XK', 'Kosovë', 360),

  -- Shqipëri (AL) — largest first
  ('Tiranë', 'AL', 'Shqipëri', 10),
  ('Durrës', 'AL', 'Shqipëri', 20),
  ('Vlorë', 'AL', 'Shqipëri', 30),
  ('Shkodër', 'AL', 'Shqipëri', 40),
  ('Elbasan', 'AL', 'Shqipëri', 50),
  ('Fier', 'AL', 'Shqipëri', 60),
  ('Korçë', 'AL', 'Shqipëri', 70),
  ('Berat', 'AL', 'Shqipëri', 80),
  ('Lushnjë', 'AL', 'Shqipëri', 90),
  ('Kavajë', 'AL', 'Shqipëri', 100),
  ('Pogradec', 'AL', 'Shqipëri', 110),
  ('Gjirokastër', 'AL', 'Shqipëri', 120),
  ('Sarandë', 'AL', 'Shqipëri', 130),
  ('Lezhë', 'AL', 'Shqipëri', 140),
  ('Kukës', 'AL', 'Shqipëri', 150),
  ('Krujë', 'AL', 'Shqipëri', 160),
  ('Patos', 'AL', 'Shqipëri', 170),
  ('Laç', 'AL', 'Shqipëri', 180),
  ('Peshkopi', 'AL', 'Shqipëri', 190),
  ('Kuçovë', 'AL', 'Shqipëri', 200),
  ('Burrel', 'AL', 'Shqipëri', 210),
  ('Cërrik', 'AL', 'Shqipëri', 220),
  ('Fushë-Krujë', 'AL', 'Shqipëri', 230),
  ('Rrëshen', 'AL', 'Shqipëri', 240),
  ('Bulqizë', 'AL', 'Shqipëri', 250),
  ('Përmet', 'AL', 'Shqipëri', 260),
  ('Tepelenë', 'AL', 'Shqipëri', 270),
  ('Ballsh', 'AL', 'Shqipëri', 280),
  ('Librazhd', 'AL', 'Shqipëri', 290),
  ('Gramsh', 'AL', 'Shqipëri', 300),
  ('Mamurras', 'AL', 'Shqipëri', 310),
  ('Divjakë', 'AL', 'Shqipëri', 320),
  ('Roskovec', 'AL', 'Shqipëri', 330),
  ('Selenicë', 'AL', 'Shqipëri', 340),
  ('Himarë', 'AL', 'Shqipëri', 350),
  ('Delvinë', 'AL', 'Shqipëri', 360),
  ('Ersekë', 'AL', 'Shqipëri', 370),
  ('Bilisht', 'AL', 'Shqipëri', 380),
  ('Krumë', 'AL', 'Shqipëri', 390),
  ('Bajram Curri', 'AL', 'Shqipëri', 400),
  ('Pukë', 'AL', 'Shqipëri', 410),

  -- Maqedoni e Veriut (MK) — Albanian-majority municipalities
  ('Shkup', 'MK', 'Maqedoni e Veriut', 10),
  ('Tetovë', 'MK', 'Maqedoni e Veriut', 20),
  ('Kumanovë', 'MK', 'Maqedoni e Veriut', 30),
  ('Gostivar', 'MK', 'Maqedoni e Veriut', 40),
  ('Strugë', 'MK', 'Maqedoni e Veriut', 50),
  ('Kërçovë', 'MK', 'Maqedoni e Veriut', 60),
  ('Dibër', 'MK', 'Maqedoni e Veriut', 70),
  ('Ohër', 'MK', 'Maqedoni e Veriut', 80),
  ('Manastir', 'MK', 'Maqedoni e Veriut', 90),
  ('Veles', 'MK', 'Maqedoni e Veriut', 100),
  ('Çair', 'MK', 'Maqedoni e Veriut', 110),
  ('Saraj', 'MK', 'Maqedoni e Veriut', 120),
  ('Haraçinë', 'MK', 'Maqedoni e Veriut', 130),
  ('Studeniçan', 'MK', 'Maqedoni e Veriut', 140),
  ('Bogovinë', 'MK', 'Maqedoni e Veriut', 150),
  ('Brvenicë', 'MK', 'Maqedoni e Veriut', 160),
  ('Zhelinë', 'MK', 'Maqedoni e Veriut', 170),
  ('Tearcë', 'MK', 'Maqedoni e Veriut', 180),
  ('Jegunovcë', 'MK', 'Maqedoni e Veriut', 190),
  ('Vrapçisht', 'MK', 'Maqedoni e Veriut', 200),
  ('Mavrovë dhe Rostushë', 'MK', 'Maqedoni e Veriut', 210),
  ('Qendër Zhupë', 'MK', 'Maqedoni e Veriut', 220),
  ('Likovë', 'MK', 'Maqedoni e Veriut', 230),
  ('Aracinovë', 'MK', 'Maqedoni e Veriut', 240),
  ('Bërvenicë', 'MK', 'Maqedoni e Veriut', 250),
  ('Pllasnicë', 'MK', 'Maqedoni e Veriut', 260),
  ('Vellesht', 'MK', 'Maqedoni e Veriut', 270);

-- Foreign keys
ALTER TABLE public.profiles ADD COLUMN city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.listings ADD COLUMN city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX profiles_city_id_idx ON public.profiles (city_id);
CREATE INDEX listings_city_id_idx ON public.listings (city_id);
