# API使用量制限とコスト管理

## 🚨 現在の設定

### レート制限
- **呼び出し制限**: 5回/分/IP
- **制限方法**: IPアドレスベース
- **リセット時間**: 1分

### コスト節約設定の選択肢

## 1. 完全デモモード（推奨）

**Vercelの環境変数を削除**
```bash
# Vercelダッシュボードで GOOGLE_MAPS_API_KEY を削除
# → 全ユーザーがデモデータを見る（コスト0円）
```

**メリット:**
- 完全無料
- 安定した動作
- デモとして十分な機能

## 2. ハイブリッドモード

**特定条件でのみAPI呼び出し**
```typescript
// 例: 管理者のみ実際のAPIを使用
const useRealAPI = process.env.NODE_ENV === 'development' || 
                  request.headers.get('x-admin-key') === process.env.ADMIN_KEY;
```

## 3. 地域制限

**特定地域のみAPI使用**
```typescript
// 例: 東京都内のみ実際のAPI使用
const isTokyoArea = latitude >= 35.5 && latitude <= 35.9 && 
                   longitude >= 139.3 && longitude <= 139.9;
```

## 4. 時間制限

**特定時間帯のみAPI使用**
```typescript
// 例: 平日の営業時間のみ
const now = new Date();
const isBusinessHours = now.getHours() >= 9 && now.getHours() <= 18 && 
                       now.getDay() >= 1 && now.getDay() <= 5;
```

## 推奨設定

**現在の状況を考慮すると:**

1. **Vercelの環境変数 `GOOGLE_MAPS_API_KEY` を削除** → 完全デモモード
2. **レート制限は維持** → サーバー負荷対策
3. **必要に応じて実際のAPIキーを設定** → 実演時のみ

これで安心してデモアプリとして運用できます。