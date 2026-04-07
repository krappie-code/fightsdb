-- Function to get user's rank in leaderboard
-- This calculates where a user would rank based on their score and time
CREATE OR REPLACE FUNCTION get_user_rank(
  target_date DATE,
  target_score INTEGER,
  target_time INTEGER
)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT COUNT(*) + 1
      FROM quiz_leaderboard 
      WHERE quiz_date = target_date
        AND (
          score > target_score 
          OR (score = target_score AND total_time < target_time)
        )
    ),
    1
  );
$$;