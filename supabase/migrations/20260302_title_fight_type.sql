-- Add title fight type to distinguish undisputed vs interim
ALTER TABLE fights ADD COLUMN IF NOT EXISTS title_fight_type TEXT;
-- Values: 'undisputed', 'interim', null (not a title fight)

-- Update existing title fights to 'undisputed' by default
UPDATE fights SET title_fight_type = 'undisputed' WHERE title_fight = true AND title_fight_type IS NULL;

-- Index for championship queries
CREATE INDEX IF NOT EXISTS idx_fights_title ON fights(title_fight, title_fight_type, weight_class) WHERE title_fight = true;
