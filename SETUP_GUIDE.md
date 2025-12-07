# セットアップガイド

このガイドでは、KEIO HANDBALL Work Load Checkerのセットアップ手順を詳しく説明します。

## 必要な準備

1. Node.js 18以上がインストールされていること
2. Supabaseアカウント（無料）
3. Vercelアカウント（無料・デプロイ用）
4. GitHubアカウント

---

## ステップ1: Supabaseのセットアップ

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてサインイン
2. 「New Project」をクリック
3. 以下の情報を入力：
   - **Project name**: keio-handball
   - **Database password**: 強力なパスワードを設定（保存しておく）
   - **Region**: Northeast Asia (Tokyo)を推奨
4. 「Create new project」をクリック

### 1.2 データベースの作成

1. 左サイドバーから「SQL Editor」を選択
2. 「New query」をクリック
3. プロジェクトの`supabase/setup.sql`ファイルの内容をコピー
4. SQLエディタに貼り付け
5. 「Run」をクリックして実行

### 1.3 API情報の取得

1. 左サイドバーから「Project Settings」（歯車アイコン）を選択
2. 「API」タブを選択
3. 以下の情報をコピーして保存：
   - **Project URL** (例: https://xxxxx.supabase.co)
   - **anon public key** (長い文字列)

---

## ステップ2: ローカル開発環境のセットアップ

### 2.1 プロジェクトのクローン

```bash
git clone <your-repository-url>
cd keio-handball-workload-checker
```

### 2.2 依存パッケージのインストール

```bash
npm install
```

### 2.3 環境変数の設定

1. `.env.local`ファイルを作成：

```bash
cp .env.example .env.local
```

2. `.env.local`を編集して、Supabaseの情報を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 2.4 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて動作確認

---

## ステップ3: Vercelへのデプロイ

### 3.1 GitHubにプッシュ

```bash
git add .
git commit -m "Initial commit: KEIO HANDBALL Work Load Checker"
git push origin main
```

### 3.2 Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com)にアクセスしてサインイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを接続
4. プロジェクトをインポート

### 3.3 環境変数の設定

デプロイ設定画面で「Environment Variables」セクションに以下を追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your-supabase-anon-key |

### 3.4 デプロイ実行

1. 「Deploy」をクリック
2. ビルドが完了するまで待つ（約2-3分）
3. デプロイURLをクリックしてアプリにアクセス

---

## ステップ4: 初期データの確認

### 4.1 選手データの確認

デプロイしたアプリのトップページにアクセスして、以下の選手が表示されることを確認：

- 山田太郎 (センター)
- 佐藤花子 (ウイング)
- 鈴木一郎 (バック)
- 田中健一 (ゴールキーパー)
- 高橋美咲 (バック)

### 4.2 データ入力テスト

1. 選手を選択
2. 「データ入力」をクリック
3. プレー前/プレー後データを入力
4. 保存できることを確認

### 4.3 スタッフダッシュボードの確認

1. トップページで「スタッフログイン」をクリック
2. パスワード入力: `keiohandball2024`
3. ダッシュボードで選手を選択
4. グラフが表示されることを確認（データがある場合）

---

## ステップ5: 選手データの追加（オプション）

実際の選手データを追加する場合：

### 方法1: Supabase UI

1. Supabaseダッシュボードの「Table Editor」を選択
2. `players`テーブルを選択
3. 「Insert row」で新しい選手を追加

### 方法2: SQLで一括追加

```sql
INSERT INTO players (name, position, goal_weight) VALUES
  ('選手名1', 'ポジション1', 体重1),
  ('選手名2', 'ポジション2', 体重2);
```

---

## トラブルシューティング

### ビルドエラー: "supabaseUrl is required"

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. `.env.local`ファイルが存在するか確認
2. 環境変数名が正確か確認（`NEXT_PUBLIC_`プレフィックスが必要）
3. 開発サーバーを再起動

### データが表示されない

**原因**: Supabaseのテーブルが作成されていない

**解決方法**:
1. Supabaseダッシュボードで「Table Editor」を確認
2. `players`と`daily_logs`テーブルが存在するか確認
3. `supabase/setup.sql`を再実行

### グラフが表示されない

**原因**: データが不足している

**解決方法**:
- ACWR計算には最低7日分のデータが必要
- 複数日にわたってデータを入力してください

---

## セキュリティ設定（重要）

### スタッフパスワードの変更

デフォルトのスタッフパスワード(`keiohandball2024`)は必ず変更してください：

1. `app/staff/login/page.tsx`を編集
2. `STAFF_PASSWORD`の値を変更
3. コミット＆プッシュ

**推奨**: 本番環境ではSupabase Authを使用した認証に切り替えることを強く推奨します。

---

## サポート

問題が発生した場合は、以下を確認してください：

1. Node.jsのバージョン（18以上）
2. Supabaseの接続情報が正確か
3. Vercelのビルドログにエラーがないか

さらにサポートが必要な場合は、GitHubのIssuesで質問してください。
