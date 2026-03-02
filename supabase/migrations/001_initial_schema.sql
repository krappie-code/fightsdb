-- FightsDB Initial Schema
-- Tables: venues, fighters, events, fights, fight_ratings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VENUES
-- ============================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  capacity INTEGER,
  altitude INTEGER,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_country ON venues(country);
CREATE INDEX idx_venues_city ON venues(city);

-- ============================================
-- FIGHTERS
-- ============================================
CREATE TABLE fighters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nickname TEXT,
  weight_class TEXT,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  reach NUMERIC,
  height TEXT,
  stance TEXT CHECK (stance IN ('Orthodox', 'Southpaw', 'Switch')),
  birth_date DATE,
  birth_location TEXT,
  ufc_stats_url TEXT,
  record_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fighters_name ON fighters(name);
CREATE INDEX idx_fighters_weight_class ON fighters(weight_class);

-- Full-text search index on fighter name + nickname
ALTER TABLE fighters ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(nickname, ''))
  ) STORED;
CREATE INDEX idx_fighters_fts ON fighters USING GIN(fts);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  venue_id UUID REFERENCES venues(id),
  location TEXT,
  event_type TEXT DEFAULT 'UFC',
  poster_url TEXT,
  ufc_stats_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_name ON events(name);
CREATE INDEX idx_events_ufc_stats_id ON events(ufc_stats_id);

-- ============================================
-- FIGHTS
-- ============================================
CREATE TABLE fights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fighter1_id UUID NOT NULL REFERENCES fighters(id),
  fighter2_id UUID NOT NULL REFERENCES fighters(id),
  weight_class TEXT,
  title_fight BOOLEAN NOT NULL DEFAULT FALSE,
  main_event BOOLEAN NOT NULL DEFAULT FALSE,
  card_position INTEGER,
  -- Result fields (spoiler territory!)
  result TEXT CHECK (result IN ('Win', 'Loss', 'Draw', 'No Contest', 'DQ')),
  winner_id UUID REFERENCES fighters(id),
  method TEXT CHECK (method IN ('KO/TKO', 'Submission', 'Decision', 'DQ', 'No Contest')),
  method_detail TEXT,
  round INTEGER,
  time TEXT,
  referee TEXT,
  bonuses TEXT[],
  fight_stats JSONB,
  ufc_stats_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fights_event_id ON fights(event_id);
CREATE INDEX idx_fights_fighter1 ON fights(fighter1_id);
CREATE INDEX idx_fights_fighter2 ON fights(fighter2_id);
CREATE INDEX idx_fights_winner ON fights(winner_id);
CREATE INDEX idx_fights_weight_class ON fights(weight_class);

-- ============================================
-- FIGHT RATINGS (user reviews)
-- ============================================
CREATE TABLE fight_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fight_id UUID NOT NULL REFERENCES fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  spoiler_free_review TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fight_id, user_id)
);

CREATE INDEX idx_fight_ratings_fight ON fight_ratings(fight_id);
CREATE INDEX idx_fight_ratings_user ON fight_ratings(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE fight_ratings ENABLE ROW LEVEL SECURITY;

-- Public read access for all data tables
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read fighters" ON fighters FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read fights" ON fights FOR SELECT USING (true);
CREATE POLICY "Public read ratings" ON fight_ratings FOR SELECT USING (true);

-- Service role can insert/update (for scraper)
CREATE POLICY "Service insert venues" ON venues FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update venues" ON venues FOR UPDATE USING (true);
CREATE POLICY "Service insert fighters" ON fighters FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update fighters" ON fighters FOR UPDATE USING (true);
CREATE POLICY "Service insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Service insert fights" ON fights FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update fights" ON fights FOR UPDATE USING (true);
CREATE POLICY "Service insert ratings" ON fight_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update ratings" ON fight_ratings FOR UPDATE USING (true);

-- ============================================
-- SPOILER-SAFE VIEW
-- Excludes result, winner, method fields
-- ============================================
CREATE VIEW fights_spoiler_free AS
SELECT
  f.id,
  f.event_id,
  f.fighter1_id,
  f.fighter2_id,
  f.weight_class,
  f.title_fight,
  f.main_event,
  f.card_position,
  f.referee,
  f.bonuses,
  f.created_at,
  e.name AS event_name,
  e.date AS event_date,
  f1.name AS fighter1_name,
  f2.name AS fighter2_name
FROM fights f
JOIN events e ON f.event_id = e.id
JOIN fighters f1 ON f.fighter1_id = f1.id
JOIN fighters f2 ON f.fighter2_id = f2.id;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fighters_updated_at BEFORE UPDATE ON fighters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fights_updated_at BEFORE UPDATE ON fights FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fight_ratings_updated_at BEFORE UPDATE ON fight_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
