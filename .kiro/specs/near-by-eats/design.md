# 設計書

## 概要

Near-by Eatsは、Next.js 14のApp Routerを使用したシンプルな位置情報ベースレストラン検索アプリケーションです。ブラウザのGeolocation APIとGoogle Places APIを組み合わせて、ユーザーの現在地から1.5km以内のレストランを検索・表示します。

## アーキテクチャ

### 全体構成

```
ブラウザ (Client)
    ↓ 位置情報取得
Geolocation API
    ↓ 座標データ
Next.js App (Frontend)
    ↓ API呼び出し
Next.js API Route (Backend)
    ↓ Places検索
Google Places API
    ↓ レストランデータ
```

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **外部API**: Google Places API, Browser Geolocation API
- **デプロイ**: Vercel

## コンポーネントとインターフェース

### ページ構成

#### メインページ (`src/app/page.tsx`)
- Client Component
- 位置情報取得ボタン
- ローディング状態管理
- レストランリスト表示
- エラーハンドリング

#### APIエンドポイント (`src/app/api/places/route.ts`)
- Server-side API Route
- Google Places API呼び出し
- エラーハンドリング
- デモデータフォールバック

### コンポーネント設計

#### LocationButton (`src/components/LocationButton.tsx`)
```typescript
interface LocationButtonProps {
  onLocationGet: (lat: number, lng: number) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}
```

#### RestaurantCard (`src/components/RestaurantCard.tsx`)
```typescript
interface Restaurant {
  place_id: string;
  name: string;
  rating?: number;
  vicinity: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}
```

### 状態管理

```typescript
// メインページの状態
interface AppState {
  restaurants: Restaurant[];
  isLoading: boolean;
  error: string | null;
  hasLocation: boolean;
}
```

## データモデル

### Restaurant型定義

```typescript
interface Restaurant {
  place_id: string;        // Google Places固有ID
  name: string;           // レストラン名
  rating?: number;        // 評価（1-5、オプション）
  vicinity: string;       // 住所
  geometry: {
    location: {
      lat: number;        // 緯度
      lng: number;        // 経度
    };
  };
}
```

### API Request/Response

#### Places API Request
```typescript
interface PlacesRequest {
  lat: number;
  lng: number;
}
```

#### Places API Response
```typescript
interface PlacesResponse {
  restaurants: Restaurant[];
  status: 'success' | 'error';
  message?: string;
}
```

### Google Places API統合

#### APIパラメータ
- **location**: `${lat},${lng}`
- **radius**: `1500` (1.5km)
- **type**: `restaurant`
- **language**: `ja` (日本語)
- **key**: 環境変数から取得

#### デモデータ構造
```typescript
const DEMO_RESTAURANTS: Restaurant[] = [
  {
    place_id: "demo_1",
    name: "サンプルレストラン1",
    rating: 4.2,
    vicinity: "東京都渋谷区",
    geometry: { location: { lat: 35.6762, lng: 139.6503 } }
  },
  // ... 追加のデモデータ
];
```

## エラーハンドリング

### 位置情報エラー

```typescript
enum GeolocationError {
  PERMISSION_DENIED = 1,
  POSITION_UNAVAILABLE = 2,
  TIMEOUT = 3
}

const getErrorMessage = (code: number): string => {
  switch (code) {
    case GeolocationError.PERMISSION_DENIED:
      return "位置情報の取得が拒否されました";
    case GeolocationError.POSITION_UNAVAILABLE:
      return "位置情報が利用できません";
    case GeolocationError.TIMEOUT:
      return "位置情報の取得がタイムアウトしました";
    default:
      return "位置情報の取得に失敗しました";
  }
};
```

### API エラー

```typescript
// API Route エラーハンドリング
try {
  const response = await fetch(googlePlacesUrl);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
} catch (error) {
  return NextResponse.json(
    { status: 'error', message: 'レストランの検索に失敗しました' },
    { status: 500 }
  );
}
```

### フロントエンドエラー表示

```typescript
// エラー状態の表示
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    <p>{error}</p>
    <button onClick={handleRetry} className="mt-2 text-sm underline">
      再試行
    </button>
  </div>
)}
```

## テスト戦略

### 単体テスト
- **コンポーネントテスト**: React Testing Library
- **API Routeテスト**: Jest + Supertest
- **ユーティリティ関数テスト**: Jest

### 統合テスト
- **位置情報取得フロー**: Geolocation APIモック
- **レストラン検索フロー**: Google Places APIモック
- **エラーハンドリング**: 各種エラーケース

### E2Eテスト
- **正常フロー**: 位置情報取得 → レストラン表示
- **エラーフロー**: 位置情報拒否、API失敗
- **レスポンシブ**: モバイル・デスクトップ表示

### テストデータ
```typescript
// モックデータ
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};

const mockRestaurants = [
  {
    place_id: "test_1",
    name: "テストレストラン",
    rating: 4.0,
    vicinity: "テスト住所"
  }
];
```

## パフォーマンス最適化

### フロントエンド最適化
- **Server Components**: 静的コンテンツの事前レンダリング
- **Client Components**: 必要最小限の使用
- **画像最適化**: Next.js Image コンポーネント（将来的な拡張用）
- **CSS最適化**: Tailwind CSS purge設定

### API最適化
- **レスポンスキャッシュ**: 同一位置での重複リクエスト防止
- **エラーレスポンス**: 適切なHTTPステータスコード
- **レート制限**: Google Places API制限への対応

### デプロイ最適化
- **静的生成**: 可能な部分のSSG
- **Edge Functions**: Vercel Edge Runtime使用
- **環境変数**: セキュアな設定管理

## セキュリティ考慮事項

### API キー保護
- **サーバーサイド**: APIキーはサーバーサイドでのみ使用
- **環境変数**: `.env.local`での管理
- **リファラー制限**: Google Cloud Consoleでの設定

### データ保護
- **位置情報**: ブラウザ内でのみ処理、保存しない
- **HTTPS**: 本番環境での強制
- **CORS**: 適切なオリジン設定

## 国際化・アクセシビリティ

### 日本語対応
- **UI言語**: 全て日本語
- **API言語**: Google Places APIで`language=ja`指定
- **エラーメッセージ**: 日本語での表示

### アクセシビリティ
- **セマンティックHTML**: 適切なHTML要素使用
- **キーボードナビゲーション**: Tab操作対応
- **スクリーンリーダー**: aria-label等の適切な設定
- **カラーコントラスト**: WCAG準拠