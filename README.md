# KEIO HANDBALL Work Load Checker

ハンドボールチーム向けのコンディション・負荷管理アプリケーション

## 概要

選手は日々の体調や練習時間を入力し、システムはsRPE（主観的運動負荷）とACWR（急性:慢性ワークロード比）を自動計算します。ダッシュボードでは高度な複合グラフを用いて負荷とコンディションの関係を可視化し、怪我のリスクを管理します。

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend/DB**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 主な機能

### 選手向け機能（キオスクモード）
- 名前選択によるログイン不要の入力
- プレー前データ入力（体重、睡眠時間、疲労度、体調VAS、不調部位）
- プレー後データ入力（練習後疲労度RPE、運動時間、不調部位）
- 自動sRPE計算

### スタッフ向け機能
- パスワード認証
- チーム全体のデータ閲覧
- 個別選手のワークロード分析
- sRPE/ACWRの複合グラフ表示（Sunbearsスタイル）
- ACWRリスクアラート（0.8～1.3の範囲外を検知）
- 統計情報の表示

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd keio-handball-workload-checker
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. Supabaseのセットアップ

#### 3.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新規プロジェクトを作成
3. プロジェクトURLとAnon Keyをコピー

#### 3.2 データベーステーブルの作成

Supabase SQLエディタで以下のSQLを実行：

```sql
-- Playersテーブル
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  goal_weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Logsテーブル
CREATE TABLE daily_logs (
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

-- サンプルデータの挿入
INSERT INTO players (name, position, goal_weight) VALUES
  ('山田太郎', 'センター', 75.0),
  ('佐藤花子', 'ウイング', 65.0),
  ('鈴木一郎', 'バック', 80.0);
```

#### 3.3 Row Level Security (RLS)の設定

```sql
-- Playersテーブルのポリシー
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON players
  FOR SELECT USING (true);

-- Daily Logsテーブルのポリシー
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON daily_logs
  FOR ALL USING (true);
```

### 4. 環境変数の設定

`.env.local`ファイルを作成：

```bash
cp .env.example .env.local
```

`.env.local`を編集して、Supabaseの情報を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く

## デプロイ（Vercel）

### 1. GitHubへプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercelへデプロイ

1. [Vercel](https://vercel.com)にアクセス
2. GitHubリポジトリをインポート
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイ

## 使い方

### 選手の場合

1. トップページで自分の名前を選択
2. 「データ入力」をクリック
3. 「プレー前入力」タブで練習前のデータを入力
4. 「プレー後入力」タブで練習後のデータを入力

### スタッフの場合

1. トップページで「スタッフログイン」をクリック
2. パスワードを入力（デフォルト: `keiohandball2024`）
3. ダッシュボードで選手を選択して分析

## 主要な計算式

### sRPE (Session Rating of Perceived Exertion)
```
sRPE = 運動時間(分) × 練習後RPE
```

### ACWR (Acute:Chronic Workload Ratio)
```
Acute Load = 過去7日間の平均sRPE
Chronic Load = 過去28日間の平均sRPE
ACWR = Acute Load / Chronic Load
```

### ACWRリスク範囲
- **0.8～1.3**: 安全範囲
- **0.8未満 または 1.3～1.5**: 注意
- **1.5超**: 高リスク

## ライセンス

MIT License
