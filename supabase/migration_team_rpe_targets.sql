-- TEAM RPE Targets テーブルの作成
-- 週ごとの曜日別の目標RPE設定を管理
CREATE TABLE IF NOT EXISTS team_rpe_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  monday DECIMAL(4,2) CHECK (monday >= 0 AND monday <= 10),
  tuesday DECIMAL(4,2) CHECK (tuesday >= 0 AND tuesday <= 10),
  wednesday DECIMAL(4,2) CHECK (wednesday >= 0 AND wednesday <= 10),
  thursday DECIMAL(4,2) CHECK (thursday >= 0 AND thursday <= 10),
  friday DECIMAL(4,2) CHECK (friday >= 0 AND friday <= 10),
  saturday DECIMAL(4,2) CHECK (saturday >= 0 AND saturday <= 10),
  sunday DECIMAL(4,2) CHECK (sunday >= 0 AND sunday <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_start_date)
);

-- Row Level Security (RLS)の有効化
ALTER TABLE team_rpe_targets ENABLE ROW LEVEL SECURITY;

-- team_rpe_targetsテーブルのポリシー
CREATE POLICY "Enable all access for all users" ON team_rpe_targets
  FOR ALL USING (true);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_team_rpe_targets_week_start ON team_rpe_targets(week_start_date DESC);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_team_rpe_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_update_team_rpe_targets_updated_at ON team_rpe_targets;
CREATE TRIGGER trigger_update_team_rpe_targets_updated_at
  BEFORE UPDATE ON team_rpe_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_team_rpe_targets_updated_at();

-- サンプルデータの挿入（当週の月曜日を基準に）
INSERT INTO team_rpe_targets (week_start_date, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
  (date_trunc('week', CURRENT_DATE)::date, 6.0, 7.0, 5.0, 8.0, 6.0, 4.0, 3.0)
ON CONFLICT (week_start_date) DO NOTHING;
