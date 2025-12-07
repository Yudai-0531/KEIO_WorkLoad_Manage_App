-- Playersテーブルの作成
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  goal_weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Logsテーブルの作成
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Pre-Practice
  weight DECIMAL(5,2),
  sleep_hours DECIMAL(4,2),
  pre_fatigue_rpe INTEGER CHECK (pre_fatigue_rpe BETWEEN 1 AND 10),
  pre_condition_vas INTEGER CHECK (pre_condition_vas BETWEEN 0 AND 100),
  pre_pain_area VARCHAR(50),
  -- Post-Practice
  post_fatigue_rpe INTEGER CHECK (post_fatigue_rpe BETWEEN 1 AND 10),
  duration_minutes DECIMAL(6,2),
  post_pain_area VARCHAR(50),
  -- Calculated
  srpe DECIMAL(10,2),
  acwr DECIMAL(6,3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Row Level Security (RLS)の有効化
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Playersテーブルのポリシー
CREATE POLICY "Enable read access for all users" ON players
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON players
  FOR INSERT WITH CHECK (true);

-- Daily Logsテーブルのポリシー
CREATE POLICY "Enable all access for all users" ON daily_logs
  FOR ALL USING (true);

-- サンプルデータの挿入
INSERT INTO players (name, position, goal_weight) VALUES
  ('山田太郎', 'センター', 75.0),
  ('佐藤花子', 'ウイング', 65.0),
  ('鈴木一郎', 'バック', 80.0),
  ('田中健一', 'ゴールキーパー', 85.0),
  ('高橋美咲', 'バック', 70.0)
ON CONFLICT DO NOTHING;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_daily_logs_player_id ON daily_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_player_date ON daily_logs(player_id, date);
