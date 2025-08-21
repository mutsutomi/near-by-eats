import { NextRequest, NextResponse } from 'next/server';
import { PlacesApiRequest, PlacesApiResponse, Restaurant } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSearchableTypes, isSearchableType } from '@/utils/genre';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ジャンル別検索戦略の定義
const GENRE_SEARCH_STRATEGIES: Record<string, Array<{method: 'nearby' | 'text', type?: string, keyword?: string, query?: string, priority: number}>> = {
  ramen_restaurant: [
    { method: 'nearby', type: 'restaurant', keyword: 'ramen', priority: 1 },
    { method: 'text', query: 'ramen restaurants', priority: 2 },
    { method: 'nearby', type: 'japanese_restaurant', keyword: 'ramen', priority: 3 },
    { method: 'nearby', type: 'restaurant', keyword: 'ラーメン', priority: 4 }
  ],
  sushi_restaurant: [
    { method: 'nearby', type: 'restaurant', keyword: 'sushi', priority: 1 },
    { method: 'text', query: 'sushi restaurants', priority: 2 },
    { method: 'nearby', type: 'japanese_restaurant', keyword: '寿司', priority: 3 }
  ],
  pizza_restaurant: [
    { method: 'nearby', type: 'restaurant', keyword: 'pizza', priority: 1 },
    { method: 'text', query: 'pizza restaurants', priority: 2 }
  ],
  chinese_restaurant: [
    { method: 'nearby', type: 'chinese_restaurant', priority: 1 },
    { method: 'nearby', type: 'restaurant', keyword: 'chinese', priority: 2 },
    { method: 'text', query: 'chinese restaurants', priority: 3 }
  ],
  italian_restaurant: [
    { method: 'nearby', type: 'italian_restaurant', priority: 1 },
    { method: 'nearby', type: 'restaurant', keyword: 'italian', priority: 2 },
    { method: 'text', query: 'italian restaurants', priority: 3 }
  ]
};

// Text SearchとNearby Searchを統合した検索関数
async function executeSearch(strategy: {method: 'nearby' | 'text', type?: string, keyword?: string, query?: string}, 
                            latitude: number, longitude: number, radius: number, language: string): Promise<any> {
  if (strategy.method === 'text') {
    const query = `${strategy.query} near ${latitude},${longitude}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&language=${language}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(`Text Search: ${query}`);
    return fetch(url);
  } else {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${strategy.type}&language=${language}${strategy.keyword ? `&keyword=${encodeURIComponent(strategy.keyword)}` : ''}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(`Nearby Search: type=${strategy.type}${strategy.keyword ? `, keyword=${strategy.keyword}` : ''}`);
    return fetch(url);
  }
}

const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: 'demo-1',
    name: '和食レストラン 花月',
    rating: 4.2,
    address: '東京都渋谷区渋谷1-1-1',
    vicinity: '渋谷',
    place_id: 'demo-place-1',
    geometry: {
      location: { lat: 35.658584, lng: 139.701334 }
    },
    types: ['restaurant', 'food', 'japanese_restaurant'],
    opening_hours: { open_now: true },
    price_level: 2
  },
  {
    id: 'demo-2',
    name: 'イタリアン ベラヴィスタ',
    rating: 4.0,
    address: '東京都渋谷区渋谷1-2-3',
    vicinity: '渋谷',
    place_id: 'demo-place-2',
    geometry: {
      location: { lat: 35.659584, lng: 139.702334 }
    },
    types: ['restaurant', 'food', 'italian_restaurant'],
    opening_hours: { open_now: true },
    price_level: 3
  },
  {
    id: 'demo-3',
    name: 'カフェ & ビストロ 青空',
    rating: 3.8,
    address: '東京都渋谷区渋谷2-1-1',
    vicinity: '渋谷',
    place_id: 'demo-place-3',
    geometry: {
      location: { lat: 35.657584, lng: 139.700334 }
    },
    types: ['restaurant', 'food', 'cafe'],
    opening_hours: { open_now: false },
    price_level: 1
  },
  {
    id: 'demo-4',
    name: 'ラーメン二郎 大崎店',
    rating: 4.1,
    address: '東京都品川区大崎3-6-15',
    vicinity: '大崎',
    place_id: 'demo-place-4',
    geometry: {
      location: { lat: 35.54659, lng: 139.52554 }
    },
    types: ['restaurant', 'food', 'ramen_restaurant', 'japanese_restaurant'],
    opening_hours: { open_now: true },
    price_level: 1
  },
  {
    id: 'demo-5',
    name: '横浜家系 大崎家',
    rating: 3.9,
    address: '東京都品川区大崎1-2-3',
    vicinity: '大崎',
    place_id: 'demo-place-5',
    geometry: {
      location: { lat: 35.54700, lng: 139.52600 }
    },
    types: ['restaurant', 'food', 'ramen_restaurant', 'japanese_restaurant'],
    opening_hours: { open_now: true },
    price_level: 1
  }
];

export async function POST(request: NextRequest) {
  try {
    // IPアドレスベースのレート制限チェック
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimit = checkRateLimit(ip, 5, 60 * 1000); // 5回/分
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          restaurants: [], 
          status: 'ERROR', 
          error_message: 'API呼び出し制限に達しました。1分後に再試行してください。'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body: PlacesApiRequest = await request.json();
    const { latitude, longitude, radius = 1500, type = 'restaurant', language = 'ja', includeAllTypes = false, genres = [] } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { restaurants: [], status: 'ERROR', error_message: '緯度と経度が必要です' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API key not found, using demo data');
      return NextResponse.json({
        restaurants: DEMO_RESTAURANTS,
        status: 'OK'
      } as PlacesApiResponse);
    }

    const allRestaurants: Restaurant[] = [];
    
    // ハイブリッド検索戦略を決定
    let searchStrategies: Array<{method: 'nearby' | 'text', type?: string, keyword?: string, query?: string, priority: number}> = [];
    
    if (genres && genres.length > 0) {
      console.log(`Processing genres: [${genres.join(', ')}]`);
      
      // ジャンル別の専用戦略を使用
      for (const genre of genres) {
        if (GENRE_SEARCH_STRATEGIES[genre]) {
          console.log(`Using specialized strategies for ${genre}`);
          searchStrategies.push(...GENRE_SEARCH_STRATEGIES[genre]);
        } else if (isSearchableType(genre)) {
          // 通常のtype検索
          console.log(`Using standard type search for ${genre}`);
          searchStrategies.push({ method: 'nearby', type: genre, priority: 1 });
        } else {
          // フリーワード検索
          console.log(`Using freeword search for ${genre}`);
          const genreName = genre.replace('_restaurant', '').replace('_', ' ');
          searchStrategies.push(
            { method: 'nearby', type: 'restaurant', keyword: genreName, priority: 1 },
            { method: 'text', query: `${genreName} restaurants`, priority: 2 }
          );
        }
      }
    } else if (includeAllTypes) {
      // 全タイプ検索
      searchStrategies = getSearchableTypes().map(t => ({ method: 'nearby', type: t, priority: 1 }));
    } else {
      // デフォルト検索
      searchStrategies = [{ method: 'nearby', type: type, priority: 1 }];
    }
    
    // 優先度でソートし、重複を除去
    searchStrategies = searchStrategies
      .sort((a, b) => a.priority - b.priority)
      .filter((strategy, index, self) => 
        index === self.findIndex(s => 
          s.method === strategy.method && 
          s.type === strategy.type && 
          s.keyword === strategy.keyword && 
          s.query === strategy.query
        )
      );
    
    console.log(`Search strategies: ${searchStrategies.length} strategies planned, filter genres: [${genres?.join(', ') || 'none'}]`);

    // パフォーマンス改善のための設定
    const MAX_TOTAL_PAGES = 5; // 全体での最大ページ数
    const MAX_PAGES_PER_TYPE = 2; // 各タイプごとの最大ページ数
    const TIMEOUT_MS = 25000; // 25秒のタイムアウト
    const startTime = Date.now();

    // ハイブリッド検索の実行
    for (const strategy of searchStrategies) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.log('Overall timeout reached, returning current results');
        break;
      }

      let nextPageToken: string | undefined;
      let pageCount = 0;
      const strategyDescription = strategy.method === 'text' 
        ? `Text: ${strategy.query}` 
        : `Nearby: ${strategy.type}${strategy.keyword ? `+${strategy.keyword}` : ''}`;
      
      console.log(`Executing strategy: ${strategyDescription}`);
    
      do {
        // タイムアウトチェック
        if (Date.now() - startTime > TIMEOUT_MS) {
          console.log(`Timeout reached for strategy: ${strategyDescription}`);
          break;
        }

        try {
          let response;
          
          // ページトークンがある場合（Nearby Searchのみ）
          if (nextPageToken && strategy.method === 'nearby') {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_MAPS_API_KEY}`;
            console.log('Using page token for nearby search');
            // ページトークン使用時は2秒待機（Google API要件）
            await new Promise(resolve => setTimeout(resolve, 2000));
            response = await fetch(url);
          } else {
            // 最初のリクエストまたはText Search
            response = await executeSearch(strategy, latitude, longitude, radius, language);
          }

          const data = await response.json();

          console.log(`API Response for ${strategyDescription}:`, {
            status: data.status,
            resultsCount: data.results?.length || 0,
            error_message: data.error_message,
            next_page_token: data.next_page_token ? 'present' : 'none'
          });

          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error(`Google Places API error for ${strategyDescription}:`, data.status, data.error_message);
            break; // この戦略を終了して次へ
          }

          // レストランデータを追加
          if (data.results && data.results.length > 0) {
            console.log(`Sample results for ${strategyDescription}:`, 
              data.results.slice(0, 3).map((place: any) => ({
                name: place.name,
                types: place.types,
                vicinity: place.vicinity
              }))
            );
            
            const restaurants: Restaurant[] = data.results.map((place: any) => ({
              id: place.place_id || place.id,
              name: place.name,
              rating: place.rating,
              address: place.formatted_address || place.vicinity,
              vicinity: place.vicinity,
              place_id: place.place_id,
              geometry: place.geometry,
              types: place.types,
              opening_hours: place.opening_hours,
              price_level: place.price_level
            }));
            allRestaurants.push(...restaurants);
            
            console.log(`${strategyDescription} - Page ${pageCount + 1}: ${data.results.length} restaurants added, total: ${allRestaurants.length}`);
          } else {
            console.log(`No results found for ${strategyDescription}`);
          }

          // Text SearchはページネーションサポートしないのでText Searchの場合は1回で終了
          if (strategy.method === 'text') {
            break;
          }

          // 次のページトークンを設定（Nearby Searchのみ）
          nextPageToken = data.next_page_token;
          pageCount++;

        } catch (error) {
          console.error(`Error executing strategy ${strategyDescription}:`, error);
          break; // この戦略を終了して次へ
        }

      } while (nextPageToken && pageCount < MAX_PAGES_PER_TYPE && strategy.method === 'nearby');

      // 十分な結果が得られた場合は早期終了
      if (allRestaurants.length >= 20) {
        console.log(`Sufficient results found (${allRestaurants.length}), skipping remaining strategies`);
        break;
      }
      
      // 全体での制限チェック
      if (allRestaurants.length >= MAX_TOTAL_PAGES * 20) {
        console.log('Maximum total results reached');
        break;
      }
    }

    // 重複を除去（同じplace_idを持つレストランを削除）
    const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) =>
      index === self.findIndex((r) => r.place_id === restaurant.place_id)
    );

    // ジャンルフィルタリングを適用（検索可能でないジャンルも含めて後フィルタ）
    let filteredRestaurants = uniqueRestaurants;
    if (genres && genres.length > 0) {
      filteredRestaurants = uniqueRestaurants.filter(restaurant =>
        restaurant.types && restaurant.types.some(restaurantType => genres.includes(restaurantType))
      );
      console.log(`Filtered by genres [${genres.join(', ')}]: ${filteredRestaurants.length} restaurants from ${uniqueRestaurants.length} total`);
    }

    console.log(`Total unique restaurants found: ${uniqueRestaurants.length}, after genre filtering: ${filteredRestaurants.length}`);

    return NextResponse.json({
      restaurants: filteredRestaurants,
      status: 'OK'
    } as PlacesApiResponse);

  } catch (error) {
    console.error('Places API Error:', error);
    return NextResponse.json(
      { 
        restaurants: [], 
        status: 'ERROR', 
        error_message: 'サーバーエラーが発生しました'
      } as PlacesApiResponse,
      { status: 500 }
    );
  }
}