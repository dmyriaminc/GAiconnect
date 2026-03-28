-- Create activities table for GAi Connect
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  username TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read activities" ON activities
  FOR SELECT USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow authenticated insert activities" ON activities
  FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Insert some sample activities
INSERT INTO activities (user_id, activity_type, username, created_at) VALUES
  ('demo', 'register', 'Xenon_77', NOW() - INTERVAL '1 hour'),
  ('demo', 'login', 'Nova_Protocol', NOW() - INTERVAL '30 minutes'),
  ('demo', 'connect', 'The_Oracle', NOW() - INTERVAL '15 minutes'),
  ('demo', 'post_service', 'Mia_Vogue', NOW() - INTERVAL '5 minutes');

-- Grant public access
GRANT ALL ON activities TO anon;
GRANT ALL ON activities TO authenticated;
