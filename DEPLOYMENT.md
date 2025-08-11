# デプロイメントガイド

## 🚀 クイックスタート: Vercelでの自動デプロイ設定

### 📋 作業の全体像
```
1. GitHubにコードをプッシュ
2. Vercelでプロジェクト作成
3. 環境変数を設定
4. 自動デプロイ完了！
```

### ⏱️ 所要時間: 約10-15分

---

## Vercelへのデプロイ手順

### 1. 前提条件
- ✅ Vercelアカウントの作成
- ✅ GitHubリポジトリへのプッシュ
- ✅ Google Cloud Platformアカウント（Google Maps API用）

### 🎯 重要: どの画面で何をするかの一覧

| 画面 | 場所 | 実行する作業 |
|------|------|-------------|
| **Vercel Dashboard** | https://vercel.com/dashboard | 「New Project」をクリック |
| **Import Repository** | プロジェクト作成画面 | GitHubリポジトリを選択して「Import」 |
| **Configure Project** | インポート後の画面 | 設定確認して「Deploy」をクリック |
| **Settings > Environment Variables** | プロジェクト設定画面 | `GOOGLE_MAPS_API_KEY` を追加 |
| **Settings > Git** | プロジェクト設定画面 | 自動デプロイ設定を確認 |

### 2. 📍 Google Maps API設定（事前準備）

> **💡 ヒント**: この作業は一度だけ行えばOKです。既にAPIキーを持っている場合はスキップしてください。

#### Google Cloud Consoleでの設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. 「APIとサービス」→「ライブラリ」から以下のAPIを有効化：
   - Places API
   - Maps JavaScript API（将来の拡張用）
4. 「APIとサービス」→「認証情報」でAPIキーを作成
5. APIキーの制限設定：
   - アプリケーションの制限：HTTPリファラー
   - APIの制限：Places API

#### APIキーのセキュリティ設定
```
許可するリファラー例：
- https://your-domain.vercel.app/*
- https://*.vercel.app/*（開発用）
```

### 3. 🔧 Vercelでの環境変数設定（後で実行）

> **📝 注意**: この作業は「4.3 自動デプロイの設定」のステップ3で詳しく説明します。ここでは概要のみ記載。

#### 設定する環境変数
| 変数名 | 値 | 適用環境 |
|--------|-----|----------|
| `GOOGLE_MAPS_API_KEY` | あなたのGoogle Maps APIキー | Production, Preview, Development |

#### 設定場所
```
Vercel Dashboard → プロジェクト選択 → Settings → Environment Variables
```

### 4. GitHub連携による自動デプロイ設定

#### 4.1 GitHubリポジトリの準備
1. **リポジトリの作成・プッシュ**
   ```bash
   # GitHubでリポジトリを作成後
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/near-by-eats.git
   git push -u origin main
   ```

#### 4.2 Vercel プロジェクトの作成と連携

##### ステップ1: Vercelアカウントの作成・ログイン
1. **Vercelにアクセス**
   - ブラウザで [https://vercel.com](https://vercel.com) を開く
   - 右上の「Sign Up」をクリック（アカウントがない場合）
   - 「Continue with GitHub」を選択してGitHubアカウントでログイン

##### ステップ2: 新しいプロジェクトの作成
1. **ダッシュボードにアクセス**
   - ログイン後、自動的に [Vercel Dashboard](https://vercel.com/dashboard) に移動
   - 画面に「Welcome to Vercel」と表示される

2. **プロジェクト作成の開始**
   - 青い「New Project」ボタンをクリック
   - 「Import Git Repository」セクションが表示される

##### ステップ3: GitHubリポジトリの連携
1. **GitHub連携の設定（初回のみ）**
   - 「Import Git Repository」の下に「Continue with GitHub」ボタンが表示される
   - 「Continue with GitHub」をクリック
   - GitHubの認証画面で「Authorize Vercel」をクリック
   - リポジトリアクセス権限を設定（「All repositories」または「Selected repositories」）

2. **リポジトリの選択**
   - GitHubリポジトリ一覧が表示される
   - `near-by-eats` リポジトリを探す
   - リポジトリ名の右側にある「Import」ボタンをクリック

##### ステップ4: プロジェクト設定の確認
1. **Configure Project 画面が表示される**
   ```
   Project Name: near-by-eats （自動入力される）
   Framework Preset: Next.js （自動検出される）
   Root Directory: ./ （デフォルト）
   ```

2. **Build and Output Settings（通常は変更不要）**
   ```
   Build Command: npm run build （自動設定）
   Output Directory: .next （自動設定）
   Install Command: npm install （自動設定）
   ```

3. **Environment Variables（後で設定可能）**
   - この段階では空のままでOK
   - 「Add」ボタンで環境変数を追加可能

##### ステップ5: デプロイの実行
1. **Deploy ボタンをクリック**
   - 画面下部の青い「Deploy」ボタンをクリック
   - デプロイプロセスが開始される

2. **デプロイ進行状況の確認**
   - 「Building...」→「Deploying...」→「Ready」の順で進行
   - 通常2-3分で完了
   - エラーが発生した場合は、ログを確認して修正

#### 4.3 自動デプロイの設定

##### ステップ1: プロジェクト設定画面へのアクセス
1. **デプロイ完了後の画面**
   - デプロイが完了すると「Congratulations!」画面が表示される
   - 生成されたURLが表示される（例：`https://near-by-eats-abc123.vercel.app`）

2. **プロジェクト設定へ移動**
   - 画面上部の「Settings」タブをクリック
   - 左サイドバーに設定メニューが表示される

##### ステップ2: Git Integration の確認
1. **Git 設定の確認**
   - 左サイドバーの「Git」をクリック
   - 「Connected Git Repository」セクションで以下を確認：
     ```
     Repository: your-username/near-by-eats
     Production Branch: main ✅
     ```

2. **自動デプロイ設定の確認**
   - 「Automatic Deployments」セクションで以下が有効になっていることを確認：
     ```
     ✅ Deploy Hooks
     ✅ Deploy on push to production branch
     ✅ Deploy preview for all branches and pull requests
     ```

> **🔧 Deploy Hooks とは？**
> 
> Deploy Hooksは、GitHubからVercelに「コードが更新されました」という通知を送る仕組みです。
> これが有効でないと、GitHubにプッシュしてもVercelが気づかず、自動デプロイが実行されません。

##### ステップ3: 環境変数の設定
1. **Environment Variables 画面へ移動**
   - 左サイドバーの「Environment Variables」をクリック
   - 「Add New」ボタンが表示される

2. **Google Maps API キーの追加**
   - 「Add New」ボタンをクリック
   - 以下の情報を入力：
     ```
     Name: GOOGLE_MAPS_API_KEY
     Value: your_actual_google_maps_api_key_here
     Environments: ✅ Production ✅ Preview ✅ Development
     ```
   - 「Save」ボタンをクリック

3. **環境変数の確認**
   - 追加された環境変数が一覧に表示される
   - 値は「••••••••」で隠されて表示される

##### ステップ4: Deploy Hooks の詳細設定と確認

> **💡 重要**: Deploy Hooksは自動デプロイの核心部分です。ここが正しく設定されていないと、GitHubにプッシュしてもデプロイが実行されません。

1. **Deploy Hooks の仕組み**
   ```
   GitHub → Webhook → Vercel → 自動デプロイ実行
   ```
   - GitHubにコードをプッシュ
   - GitHubがVercelにWebhookを送信
   - VercelがDeploy Hooksを受信
   - 自動的にビルド・デプロイを開始

2. **Deploy Hooks 設定の確認方法**
   - 「Settings」→「Git」画面で以下を確認：
     ```
     ✅ Deploy Hooks: Enabled
     ✅ Deploy on push to production branch: Enabled
     ✅ Deploy preview for all branches and pull requests: Enabled
     ```

3. **Deploy Hooks が無効になっている場合の対処**
   - 「Deploy Hooks」のトグルスイッチをクリックして有効化
   - 「Save」ボタンをクリック
   - GitHubとの連携が自動的に再設定される

4. **Webhook の確認（上級者向け）**
   - GitHubリポジトリの「Settings」→「Webhooks」
   - Vercelのwebhook URL が存在することを確認：
     ```
     Payload URL: https://api.vercel.com/v1/integrations/deploy/...
     Content type: application/json
     Events: Just the push event
     ```

##### ステップ5: その他の設定確認
1. **Functions 設定（オプション）**
   - 左サイドバーの「Functions」をクリック
   - API Routes の設定を確認（通常はデフォルトでOK）

2. **Domains 設定**
   - 左サイドバーの「Domains」をクリック
   - 自動生成されたドメインが表示される
   - カスタムドメインを追加する場合はここで設定

#### 4.4 自動デプロイの動作確認

##### ステップ1: テスト用の変更をプッシュ
1. **ローカルでテスト変更を作成**
   ```bash
   # プロジェクトディレクトリで実行
   echo "# Deployment Test - $(date)" >> DEPLOYMENT_TEST.md
   git add DEPLOYMENT_TEST.md
   git commit -m "Test: trigger auto deployment"
   git push origin main
   ```

##### ステップ2: Vercel Dashboard でデプロイ確認
1. **Deployments タブへ移動**
   - Vercel Dashboard でプロジェクトを選択
   - 上部の「Deployments」タブをクリック

2. **デプロイ状況の確認**
   - 最新のデプロイが一覧の最上部に表示される
   - ステータスの変化を確認：
     ```
     🟡 Building... (ビルド中)
     🟡 Deploying... (デプロイ中)
     🟢 Ready (完了)
     ```

3. **デプロイログの確認**
   - デプロイ項目をクリックして詳細画面を開く
   - 「View Function Logs」でビルドログを確認
   - エラーがある場合はここで詳細を確認

##### ステップ3: 本番サイトでの動作確認
1. **デプロイ完了後のURL確認**
   - デプロイ完了後、「Visit」ボタンをクリック
   - または生成されたURL（例：`https://near-by-eats-abc123.vercel.app`）を直接開く

2. **機能テストの実行**
   - 「現在地を取得」ボタンをクリック
   - 位置情報許可ダイアログで「許可」を選択
   - レストラン情報が表示されることを確認
   - Google Maps APIキーが未設定の場合、デモデータが表示される

##### ステップ4: 自動デプロイの確認完了
1. **成功の確認**
   - アプリケーションが正常に動作すれば設定完了
   - 以降、mainブランチへのプッシュで自動デプロイが実行される

2. **テストファイルの削除（オプション）**
   ```bash
   git rm DEPLOYMENT_TEST.md
   git commit -m "Remove deployment test file"
   git push origin main
   ```

#### 4.5 プレビューデプロイ（プルリクエスト用）

1. **フィーチャーブランチでの開発**
   ```bash
   # 新しいブランチを作成
   git checkout -b feature/new-feature
   
   # 変更を加えてプッシュ
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **プルリクエスト作成**
   - GitHubでプルリクエストを作成
   - Vercelが自動的にプレビューデプロイを作成
   - プレビューURLがプルリクエストにコメントされる

#### 4.6 デプロイ設定のカスタマイズ

**vercel.json での詳細設定**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": true
    }
  },
  "github": {
    "autoAlias": false,
    "autoJobCancelation": true
  },
  "functions": {
    "src/app/api/places/route.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 5. CLI でのデプロイ（オプション）

#### Vercel CLI のセットアップ
```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトディレクトリで初期化
vercel

# 本番デプロイ
vercel --prod
```

#### CLI コマンド一覧
```bash
# プロジェクト情報確認
vercel ls

# デプロイ履歴確認
vercel ls --scope=your-team

# ログ確認
vercel logs

# 環境変数管理
vercel env ls
vercel env add GOOGLE_MAPS_API_KEY
vercel env rm GOOGLE_MAPS_API_KEY
```

### 6. 自動デプロイのワークフロー

#### 通常の開発フロー
```bash
# 1. 機能開発
git checkout -b feature/restaurant-filters
# コード変更...
git add .
git commit -m "Add restaurant filtering feature"
git push origin feature/restaurant-filters

# 2. プルリクエスト作成
# → Vercelが自動的にプレビューデプロイを作成

# 3. レビュー・マージ
git checkout main
git merge feature/restaurant-filters
git push origin main

# 4. 本番デプロイ
# → mainブランチへのpushで自動的に本番デプロイ実行
```

#### ホットフィックスのフロー
```bash
# 緊急修正
git checkout main
git checkout -b hotfix/critical-bug-fix
# 修正...
git add .
git commit -m "Fix critical API error"
git push origin hotfix/critical-bug-fix

# 即座にmainにマージして本番デプロイ
git checkout main
git merge hotfix/critical-bug-fix
git push origin main
# → 自動デプロイ実行
```

### 7. デプロイ後の確認事項

#### 機能テスト
- [ ] 位置情報取得機能の動作確認
- [ ] Google Places API連携の確認
- [ ] デモデータフォールバック機能の確認
- [ ] レスポンシブデザインの確認
- [ ] エラーハンドリングの確認

#### パフォーマンス確認
- [ ] ページ読み込み速度
- [ ] API レスポンス時間
- [ ] モバイル表示の最適化

### 8. 自動デプロイのトラブルシューティング

#### デプロイが実行されない場合

##### 問題1: mainブランチにプッシュしてもデプロイが開始されない

**確認手順:**
1. **Vercel Dashboard での確認**
   - プロジェクトの「Settings」→「Git」を開く
   - 「Connected Git Repository」が正しく設定されているか確認
   - 「Production Branch」が `main` になっているか確認

2. **GitHub側での確認**
   - GitHubリポジトリの「Settings」→「Webhooks」を確認
   - Vercelのwebhookが存在するか確認（通常は自動設定される）

3. **権限の確認**
   - GitHub の「Settings」→「Applications」→「Authorized OAuth Apps」
   - Vercelアプリの権限を確認・再認証

**解決方法:**
```bash
# 1. Vercel CLI で再連携
vercel link

# 2. 手動でデプロイをトリガー
vercel --prod

# 3. GitHubとの連携を再設定
# Vercel Dashboard → Settings → Git → Disconnect → Reconnect
```

##### 問題2: プレビューデプロイが作成されない

**確認手順:**
1. **プルリクエストの状態確認**
   - プルリクエストが「Draft」状態でないか確認
   - ベースブランチが正しく設定されているか確認

2. **Vercel設定の確認**
   - 「Settings」→「Git」→「Deploy Hooks」が有効か確認
   - 「Deploy preview for all branches and pull requests」が有効か確認

**解決方法:**
- プルリクエストを一度閉じて再作成
- ブランチ名に特殊文字が含まれている場合は変更
- Vercel Dashboard で手動プレビューデプロイを実行

##### 問題2.5: Deploy Hooks が機能しない場合

**Deploy Hooks の詳細確認手順:**
1. **Vercel Dashboard での確認**
   ```
   Settings → Git → Deploy Hooks の状態を確認
   - ✅ Enabled になっているか
   - ❌ Disabled の場合は有効化が必要
   ```

2. **GitHub Webhook の確認**
   ```
   GitHubリポジトリ → Settings → Webhooks
   - Vercel の webhook が存在するか確認
   - Recent Deliveries でエラーがないか確認
   ```

3. **Webhook の再作成**
   ```
   Vercel Dashboard で以下の手順を実行:
   1. Settings → Git → Disconnect
   2. 確認ダイアログで「Disconnect」をクリック
   3. 「Connect Git Repository」で再接続
   4. 同じリポジトリを選択して再連携
   ```

**Deploy Hooks のテスト方法:**
```bash
# 1. 簡単な変更をプッシュ
echo "Deploy hooks test: $(date)" >> README.md
git add README.md
git commit -m "Test deploy hooks"
git push origin main

# 2. Vercel Dashboard で確認
# Deployments タブで新しいデプロイが開始されるか確認
```

#### デプロイが失敗する場合

##### 問題3: ビルドエラーでデプロイが失敗する

**エラー確認手順:**
1. **Vercel Dashboard でのログ確認**
   - 「Deployments」タブで失敗したデプロイをクリック
   - 「View Function Logs」でエラー詳細を確認
   - 「Build Logs」でビルドプロセスのエラーを確認

2. **ローカルでの再現確認**
   ```bash
   # ローカルでビルドテスト
   npm run build
   
   # TypeScript エラーチェック
   npx tsc --noEmit
   
   # リンターチェック
   npm run lint
   ```

**よくあるエラーと解決方法:**
```bash
# 1. 依存関係の問題
npm ci  # package-lock.json を使用してクリーンインストール

# 2. TypeScript エラー
# src/types/index.ts などの型定義を確認・修正

# 3. 環境変数の問題
# .env.example と実際の環境変数設定を比較
```

##### 問題4: 環境変数が反映されない

**確認手順:**
1. **Vercel Dashboard での環境変数確認**
   - 「Settings」→「Environment Variables」を開く
   - 変数名のスペルミスがないか確認
   - 適用環境（Production/Preview/Development）が正しく選択されているか確認

2. **環境変数の値確認**
   ```bash
   # Vercel CLI で環境変数一覧を確認
   vercel env ls
   
   # 特定の環境変数を確認
   vercel env pull .env.vercel
   cat .env.vercel
   ```

**解決方法:**
1. **環境変数の再設定**
   - Vercel Dashboard で該当の環境変数を削除
   - 正しい値で再度追加
   - 「Save」ボタンをクリック

2. **再デプロイの実行**
   ```bash
   # 手動で再デプロイをトリガー
   vercel --prod
   
   # または、空コミットでプッシュ
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

##### 問題5: API Routes が動作しない

**確認手順:**
1. **API エンドポイントの確認**
   - ブラウザで `https://your-app.vercel.app/api/places` にアクセス
   - 404エラーの場合、ファイルパスを確認

2. **ログでのエラー確認**
   ```bash
   # リアルタイムログの確認
   vercel logs --follow
   
   # 特定の関数のログ確認
   vercel logs --since=1h
   ```

**解決方法:**
- `src/app/api/places/route.ts` のファイルパスが正しいか確認
- API Route の export 文が正しいか確認（`export async function POST`）
- vercel.json の functions 設定を確認

### 9. 従来のトラブルシューティング

#### よくある問題と解決方法

**問題**: APIキーエラーが発生する
```
解決方法:
1. 環境変数が正しく設定されているか確認
2. APIキーの制限設定を確認
3. Places APIが有効化されているか確認
```

**問題**: デモデータが表示される
```
解決方法:
1. GOOGLE_MAPS_API_KEY環境変数が設定されているか確認
2. APIキーが有効で制限設定が正しいか確認
```

**問題**: 位置情報が取得できない
```
解決方法:
1. HTTPSでアクセスしているか確認
2. ブラウザの位置情報許可設定を確認
```

### 10. デプロイ監視とメンテナンス

#### デプロイ状況の監視
1. **Vercel Dashboard での確認**
   - デプロイ履歴とステータス
   - ビルドログの確認
   - パフォーマンスメトリクス

2. **GitHub Integration**
   - プルリクエストでのデプロイステータス確認
   - コミットステータスでのデプロイ結果表示

3. **通知設定**
   ```
   Settings → Notifications で設定可能:
   - デプロイ成功/失敗の通知
   - Slack/Discord/Email 通知
   - GitHub Status の更新
   ```

#### 自動デプロイの一時停止
```bash
# 緊急時にデプロイを一時停止
vercel --prod --no-wait

# または Dashboard で "Pause Deployments" を設定
```

### 11. 本番環境での監視

#### ログ確認
```bash
# Vercel CLI でログを確認
vercel logs
```

#### エラー監視
- Vercel Analytics の活用
- Console エラーの監視
- API エラーレートの確認

### 12. GitHub Actions による CI/CD 強化（オプション）

#### GitHub Actions ワークフローの設定
プロジェクトには `.github/workflows/vercel-deploy.yml` が含まれており、以下の機能を提供します：

1. **自動テスト実行**
   - プルリクエスト作成時
   - mainブランチへのプッシュ時

2. **テスト成功後の自動デプロイ**
   - プレビューデプロイ（プルリクエスト）
   - 本番デプロイ（mainブランチ）

#### GitHub Secrets の設定
GitHub Actions を使用する場合、以下のシークレットを設定してください：

1. **リポジトリの Settings → Secrets and variables → Actions**
2. **必要なシークレット**：
   ```
   VERCEL_TOKEN: Vercelのアクセストークン
   VERCEL_ORG_ID: VercelのOrganization ID
   VERCEL_PROJECT_ID: VercelのProject ID
   ```

#### シークレット値の取得方法
```bash
# Vercel CLI でプロジェクト情報を取得
vercel link
vercel env ls

# .vercel/project.json から ID を確認
cat .vercel/project.json
```

### 13. 🔧 Deploy Hooks に関するよくある質問（FAQ）

#### Q1: Deploy Hooks とは具体的に何ですか？
**A**: Deploy Hooksは、GitHubからVercelに送信されるWebhookを受信して、自動デプロイを開始する仕組みです。

```
詳細な流れ:
1. GitHubにコードをプッシュ
2. GitHubがVercelのWebhook URLに通知を送信
3. VercelがDeploy Hooksでその通知を受信
4. 自動的にビルド・デプロイプロセスを開始
```

#### Q2: Deploy Hooks が無効になっているとどうなりますか？
**A**: GitHubにプッシュしても、Vercelが通知を受け取れないため、自動デプロイが実行されません。

#### Q3: Deploy Hooks の設定はどこで確認できますか？
**A**: Vercel Dashboard の以下の場所で確認できます：
```
プロジェクト選択 → Settings → Git → Automatic Deployments
```

#### Q4: Deploy Hooks が突然動かなくなった場合は？
**A**: 以下の順番で確認・対処してください：
1. Vercel Dashboard で Deploy Hooks が有効か確認
2. GitHub の Webhooks でエラーがないか確認
3. GitHubとVercelの連携を一度切断して再接続
4. 手動デプロイでテスト実行

#### Q5: プレビューデプロイも Deploy Hooks に依存しますか？
**A**: はい。プルリクエストのプレビューデプロイも Deploy Hooks の仕組みを使用します。

#### Q6: Deploy Hooks を手動で無効にする理由はありますか？
**A**: 以下のような場合に一時的に無効にすることがあります：
- メンテナンス中で自動デプロイを停止したい場合
- 大量のコミットを行う際に無駄なデプロイを避けたい場合
- デプロイに問題があり、手動でのみデプロイしたい場合

### 14. セキュリティ考慮事項

#### APIキー保護
- サーバーサイドでのみAPIキーを使用
- 環境変数での管理
- リファラー制限の適切な設定

#### HTTPS強制
- Vercelでは自動的にHTTPS化される
- カスタムドメイン使用時も証明書が自動発行される

#### GitHub Actions のセキュリティ
- シークレットの適切な管理
- 最小権限の原則に従ったトークン設定
- 定期的なトークンの更新

## 開発環境での動作確認

### ローカル環境変数設定
```bash
# .env.local ファイルを作成
cp .env.example .env.local

# APIキーを設定
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### ローカルでの動作確認
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# ビルド確認
npm run build
npm start
```