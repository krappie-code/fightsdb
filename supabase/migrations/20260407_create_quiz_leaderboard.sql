-- Create quiz_leaderboard table for storing daily quiz scores
CREATE TABLE quiz_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  total_time INTEGER NOT NULL, -- time in seconds
  quiz_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX quiz_leaderboard_date_score_idx ON quiz_leaderboard (quiz_date, score DESC, total_time ASC);
CREATE INDEX quiz_leaderboard_date_idx ON quiz_leaderboard (quiz_date);
CREATE INDEX quiz_leaderboard_completed_at_idx ON quiz_leaderboard (completed_at);

-- Enable Row Level Security (optional - for when user auth is added)
ALTER TABLE quiz_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create a policy allowing all users to read leaderboard data
CREATE POLICY "Allow read access for all users" ON quiz_leaderboard
  FOR SELECT TO PUBLIC
  USING (true);

-- Create a policy allowing all users to insert their own scores (for now)
CREATE POLICY "Allow insert access for all users" ON quiz_leaderboard
  FOR INSERT TO PUBLIC
  WITH CHECK (true);

-- Add a comment for documentation
COMMENT ON TABLE quiz_leaderboard IS 'Stores daily UFC quiz scores and leaderboard data';
COMMENT ON COLUMN quiz_leaderboard.quiz_date IS 'The date of the quiz (YYYY-MM-DD format)';
COMMENT ON COLUMN quiz_leaderboard.total_time IS 'Total time taken to complete quiz in seconds';
COMMENT ON COLUMN quiz_leaderboard.score IS 'Number of correct answers';
COMMENT ON COLUMN quiz_leaderboard.max_score IS 'Total number of questions (usually 10)';
COMMENT ON COLUMN quiz_leaderboard.percentage IS 'Score as percentage (0-100)';