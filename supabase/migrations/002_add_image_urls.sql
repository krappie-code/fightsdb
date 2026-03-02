-- Add image_url column to fighters
ALTER TABLE fighters ADD COLUMN IF NOT EXISTS image_url TEXT;
