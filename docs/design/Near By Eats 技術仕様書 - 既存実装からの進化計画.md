# Near By Eats 技術仕様書 - 既存実装からの進化計画

## 現在の実装状況分析

### リポジトリ概要
- **URL**: https://github.com/mutsutomi/near-by-eats
- **現在の機能**: 現在地から1.5km以内のレストランを検索・表示
- **技術スタック**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **APIキー不要のデモモード**: 開発環境での動作確認が可能

### 実装済み機能
1. ✅ 位置情報自動取得（Geolocation API）
2. ✅ 1.5km範囲内のレストラン検索
3. ✅ レストラン情報のカード表示
4. ✅ エラーハンドリング（位置情報、API）
5. ✅ レスポンシブデザイン
6. ✅ 日本語UI
7. ✅ デモデータモード
8. ✅ Vercel自動デプロイ

### 現在の課題（UX分析より）
- **選択肢過多**: 検索結果が多すぎて選べない可能性
- **決定責任**: ユーザーが選択の責任を感じる
- **グループ利用未対応**: 複数人での意思決定が困難
- **学習機能なし**: 毎回同じような検索結果

## 新UX設計に基づく進化計画

### コアコンセプト：「選ばない」選択肢の提供

現在の「検索して一覧表示」から「AIが3つだけ提案」へのパラダイムシフト

## フェーズ1: 3店舗提案システムへの移行（優先度：最高）

### 1.1 提案アルゴリズムの実装

```typescript
// src/lib/suggestion/suggestionEngine.ts
export interface SuggestionCriteria {
  location: { lat: number; lng: number };
  timeContext: {
    hour: number;
    dayOfWeek: number;
    isHoliday: boolean;
  };
  userPreferences?: {
    recentVisits?: string[];
    avoidCategories?: string[];
  };
  groupSize?: number;
}

export class RestaurantSuggestionEngine {
  private readonly SUGGESTION_COUNT = 3;
  private readonly SEARCH_RADIUS = 1500; // 既存の1.5km維持
  
  async generateSmartSuggestions(
    criteria: SuggestionCriteria
  ): Promise<Restaurant[]> {
    // 1. 既存のPlaces API検索を活用
    const nearbyRestaurants = await this.searchNearby(criteria.location);
    
    // 2. スコアリングアルゴリズム
    const scored = this.calculateScores(nearbyRestaurants, criteria);
    
    // 3. 多様性を考慮した3店舗選択
    return this.selectDiverseTop3(scored);
  }
  
  private calculateScores(
    restaurants: Restaurant[],
    criteria: SuggestionCriteria
  ): ScoredRestaurant[] {
    return restaurants.map(restaurant => ({
      ...restaurant,
      score: this.calculateCompositeScore({
        distance: this.distanceScore(restaurant, criteria.location),
        rating: this.normalizeRating(restaurant.rating),
        timeRelevance: this.timeScore(restaurant, criteria.timeContext),
        diversity: this.categoryDiversityScore(restaurant)
      })
    }));
  }
  
  private selectDiverseTop3(scored: ScoredRestaurant[]): Restaurant[] {
    // 異なるカテゴリから選択するロジック
    const selected: Restaurant[] = [];
    const usedCategories = new Set<string>();
    
    for (const restaurant of scored.sort((a, b) => b.score - a.score)) {
      if (selected.length >= this.SUGGESTION_COUNT) break;
      
      const category = this.getMainCategory(restaurant);
      if (!usedCategories.has(category) || selected.length < 2) {
        selected.push(restaurant);
        usedCategories.add(category);
      }
    }
    
    return selected;
  }
}
```

### 1.2 UI/UXの刷新

```tsx
// src/components/SuggestionDisplay.tsx
export function SuggestionDisplay() {
  const [suggestions, setSuggestions] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>("");
  
  const generateSuggestions = async () => {
    setIsLoading(true);
    
    // フェーズ表示で体感速度向上
    setLoadingPhase("位置情報を取得中...");
    const location = await getCurrentLocation();
    
    setLoadingPhase("おすすめを選定中...");
    const suggestions = await fetchSuggestions(location);
    
    setSuggestions(suggestions);
    setIsLoading(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* タイトル変更 */}
      <h1 className="text-3xl font-bold text-center mb-2">
        今すぐ行ける3つの店
      </h1>
      <p className="text-gray-600 text-center mb-8">
        AIが厳選した最適な選択肢
      </p>
      
      {isLoading ? (
        <LoadingAnimation phase={loadingPhase} />
      ) : suggestions.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {suggestions.map((restaurant, index) => (
            <SuggestionCard
              key={restaurant.id}
              restaurant={restaurant}
              index={index}
              onSelect={() => handleSelection(restaurant)}
            />
          ))}
        </div>
      ) : (
        <InitialState onStart={generateSuggestions} />
      )}
      
      {suggestions.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={generateSuggestions}
            className="px-8 py-3 bg-white border-2 border-gray-300 
                     rounded-full hover:bg-gray-50 transition-all
                     font-medium text-gray-700"
          >
            <RefreshIcon className="inline mr-2" />
            他の選択肢を見る
          </button>
        </div>
      )}
    </div>
  );
}
```

### 1.3 新しいレストランカードデザイン

```tsx
// src/components/SuggestionCard.tsx
export function SuggestionCard({ 
  restaurant, 
  index, 
  onSelect 
}: SuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden 
                 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      {/* ビジュアル要素を追加 */}
      <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 
                      relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <RestaurantIcon className="text-white/20 w-24 h-24" />
        </div>
        <div className="absolute top-4 right-4 bg-white/90 
                        rounded-full px-3 py-1">
          <span className="text-sm font-bold">
            {getWalkingTime(restaurant.distance)}分
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <StarIcon className="text-yellow-500 w-5 h-5" />
          <span className="font-medium">{restaurant.rating}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">
            {getCategoryLabel(restaurant.types[0])}
          </span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">
          {restaurant.vicinity}
        </p>
      </div>
    </motion.div>
  );
}
```

## フェーズ2: グループ共有機能（優先度：高）

### 2.1 URLベースの簡易共有システム

```typescript
// src/app/api/share/route.ts
export async function POST(request: Request) {
  const { suggestions, expiresIn = 3600 } = await request.json();
  
  // 一時的な共有IDを生成
  const shareId = generateShareId();
  
  // Redisに保存（Upstash Redis）
  await redis.setex(
    `share:${shareId}`,
    expiresIn,
    JSON.stringify({
      suggestions,
      createdAt: Date.now(),
      votes: {}
    })
  );
  
  return Response.json({
    shareUrl: `${process.env.NEXT_PUBLIC_URL}/share/${shareId}`,
    shareId
  });
}
```

### 2.2 シンプルな投票UI

```tsx
// src/app/share/[id]/page.tsx
export default function SharePage({ params }: { params: { id: string } }) {
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        みんなで選ぼう！
      </h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {sharedData?.suggestions.map((restaurant, index) => (
          <VotableCard
            key={restaurant.id}
            restaurant={restaurant}
            isSelected={userVote === restaurant.id}
            voteCount={sharedData.votes[restaurant.id] || 0}
            onVote={() => handleVote(restaurant.id)}
          />
        ))}
      </div>
      
      <VoteSummary votes={sharedData?.votes} />
      
      <ShareInstructions shareUrl={window.location.href} />
    </div>
  );
}
```

## フェーズ3: パフォーマンス最適化（優先度：中）

### 3.1 Edge Functionsの活用

```typescript
// src/app/api/suggestions/route.ts
export const runtime = 'edge'; // Edge Runtime指定

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  // マルチレイヤーキャッシング
  const cacheKey = `suggestions:${lat}:${lng}`;
  
  // 1. Edge Cache確認
  const cached = await getEdgeCache(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
      }
    });
  }
  
  // 2. 新規生成
  const suggestions = await generateSuggestions({ lat, lng });
  
  // 3. キャッシュ保存
  await setEdgeCache(cacheKey, suggestions, 300);
  
  return Response.json(suggestions, {
    headers: {
      'X-Cache': 'MISS',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
    }
  });
}
```

### 3.2 プリフェッチ戦略

```typescript
// src/hooks/usePrefetchSuggestions.ts
export function usePrefetchSuggestions() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // 位置情報を取得したらすぐにプリフェッチ開始
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          queryClient.prefetchQuery({
            queryKey: ['suggestions', position.coords],
            queryFn: () => fetchSuggestions(position.coords),
            staleTime: 5 * 60 * 1000 // 5分
          });
        }
      );
    }
  }, [queryClient]);
}
```

## フェーズ4: 学習機能（将来実装）

### 4.1 暗黙的な嗜好学習

```typescript
// src/lib/learning/preferenceTracker.ts
export class PreferenceTracker {
  // 選択履歴から嗜好を推測
  async trackSelection(userId: string, restaurant: Restaurant) {
    const selection = {
      restaurantId: restaurant.place_id,
      category: this.extractCategory(restaurant),
      priceLevel: restaurant.price_level,
      rating: restaurant.rating,
      timestamp: Date.now(),
      dayOfWeek: new Date().getDay(),
      hour: new Date().getHours()
    };
    
    // ローカルストレージに保存（プライバシー配慮）
    this.saveToLocal(userId, selection);
    
    // 嗜好パターンを更新
    this.updatePreferences(userId, selection);
  }
  
  async getPreferences(userId: string): Promise<UserPreferences> {
    const history = this.getLocalHistory(userId);
    
    return {
      favoriteCategories: this.analyzeFavoriteCategories(history),
      pricePreference: this.analyzePricePreference(history),
      timePatterns: this.analyzeTimePatterns(history)
    };
  }
}
```

## 実装スケジュール

### 第1週：基礎実装
- [ ] 既存コードのリファクタリング
- [ ] 3店舗提案アルゴリズムの実装
- [ ] 新UIコンポーネントの作成

### 第2週：コア機能完成
- [ ] 提案システムのAPI統合
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

### 第3週：グループ機能
- [ ] 共有機能の実装
- [ ] 投票システムの構築
- [ ] リアルタイム更新（オプション）

### 第4週：最終調整
- [ ] テスト作成・実行
- [ ] パフォーマンスチューニング
- [ ] 本番デプロイ準備

## 技術的な変更点まとめ

### 追加が必要なパッケージ
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "framer-motion": "^11.x",
    "@upstash/redis": "^1.x",
    "nanoid": "^5.x"
  }
}
```

### 環境変数の追加
```env
# 既存
GOOGLE_MAPS_API_KEY=xxx

# 新規追加
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_URL=https://your-domain.vercel.app
```

## Claude Codeでの実装指示

以下の順序で実装を進めてください：

1. **既存コードの整理**
   - 現在の検索機能をリファクタリング
   - コンポーネントの分離と整理

2. **提案エンジンの実装**
   - `src/lib/suggestion/`ディレクトリ作成
   - スコアリングアルゴリズムの実装

3. **UI/UXの刷新**
   - 新しいコンポーネント作成
   - アニメーションの追加

4. **APIルートの更新**
   - Edge Functions対応
   - キャッシング実装

5. **テストの作成**
   - 単体テスト
   - 統合テスト

この仕様書に基づいて、段階的に実装を進めることで、「お昼どこにする？」問題を根本的に解決するアプリケーションへと進化させることができます。