-- Pain Areas（不調部位）テーブルの作成
CREATE TABLE IF NOT EXISTS pain_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)の有効化
ALTER TABLE pain_areas ENABLE ROW LEVEL SECURITY;

-- Pain Areasテーブルのポリシー（全ユーザーが読み取り可能）
CREATE POLICY "Enable read access for all users" ON pain_areas
  FOR SELECT USING (true);

-- Pain Areasテーブルのポリシー（全ユーザーが追加・更新・削除可能）
CREATE POLICY "Enable insert access for all users" ON pain_areas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON pain_areas
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON pain_areas
  FOR DELETE USING (true);

-- Playersテーブルに削除ポリシーを追加（既存データベースに欠けている場合に備えて）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'players' 
    AND policyname = 'Enable update access for all users'
  ) THEN
    CREATE POLICY "Enable update access for all users" ON players
      FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'players' 
    AND policyname = 'Enable delete access for all users'
  ) THEN
    CREATE POLICY "Enable delete access for all users" ON players
      FOR DELETE USING (true);
  END IF;
END $$;

-- デフォルトの不調部位データを挿入
INSERT INTO pain_areas (name, display_order) VALUES
  ('なし', 0),
  ('右肩', 1),
  ('左肩', 2),
  ('右肘', 3),
  ('左肘', 4),
  ('右膝', 5),
  ('左膝', 6),
  ('腰', 7),
  ('右足首', 8),
  ('左足首', 9),
  ('その他', 10)
ON CONFLICT (name) DO NOTHING;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_pain_areas_display_order ON pain_areas(display_order);
