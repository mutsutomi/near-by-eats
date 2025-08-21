import { NextRequest, NextResponse } from 'next/server';
import { PlacesApiRequest, PlacesApiResponse, Restaurant } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSearchableTypes, isSearchableType } from '@/utils/genre';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
    types: ['restaurant', 'food'],
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
    types: ['restaurant', 'food'],
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
    
    // 効率的な順次検索戦略を決定
    let searchStrategies: Array<{type: string, keyword?: string, priority: number}> = [];
    
    if (genres && genres.length > 0) {
      // ラーメン特別対応
      if (genres.includes('ramen_restaurant')) {
        searchStrategies = [
          { type: 'restaurant', keyword: 'ラーメン', priority: 1 },
          { type: 'japanese_restaurant', keyword: 'ラーメン', priority: 2 }
        ];
      } else {
        // 他のジャンル検索
        const searchableGenres = genres.filter(isSearchableType).filter(g => g !== 'ramen_restaurant');
        searchStrategies = searchableGenres.map(searchType => ({ type: searchType, priority: 1 }));
        
        if (searchStrategies.length === 0) {
          // 検索可能なジャンルがない場合は全タイプで検索
          searchStrategies = getSearchableTypes().filter(t => t !== 'ramen_restaurant').map(t => ({ type: t, priority: 1 }));
        }
      }
    } else if (includeAllTypes) {
      // 全タイプ検索
      searchStrategies = getSearchableTypes().filter(t => t !== 'ramen_restaurant').map(t => ({ type: t, priority: 1 }));
    } else {
      // デフォルト検索
      searchStrategies = [{ type: type, priority: 1 }];
    }
    
    console.log(`Search strategies: ${searchStrategies.map(s => `${s.type}${s.keyword ? `+${s.keyword}` : ''}`).join(', ')}, filter genres: [${genres?.join(', ') || 'none'}]`);

    // パフォーマンス改善のための設定
    const MAX_TOTAL_PAGES = 5; // 全体での最大ページ数
    const MAX_PAGES_PER_TYPE = 2; // 各タイプごとの最大ページ数
    const TIMEOUT_MS = 25000; // 25秒のタイムアウト
    const startTime = Date.now();

    // 順次検索による効率的な検索実行
    for (const strategy of searchStrategies.sort((a, b) => a.priority - b.priority)) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.log('Overall timeout reached, returning current results');
        break;
      }

      let nextPageToken: string | undefined;
      let pageCount = 0;
      const { type: searchType, keyword } = strategy;
      
      // 最初のリクエスト
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${searchType}&language=${language}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log(`Searching with type: ${searchType}${keyword ? `, keyword: ${keyword}` : ''}`);
    
      do {
        // タイムアウトチェック
        if (Date.now() - startTime > TIMEOUT_MS) {
          console.log(`Timeout reached for search type: ${searchType}`);
          break;
        }

        // ページトークンがある場合は追加
        if (nextPageToken) {
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_MAPS_API_KEY}`;
          // ページトークン使用時は2秒待機（Google API要件）
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error(`Google Places API error for ${searchType}:`, data.status, data.error_message);
            break;
          }

          // レストランデータを追加
          if (data.results && data.results.length > 0) {
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
          }

          // 次のページトークンを設定
          nextPageToken = data.next_page_token;
          pageCount++;

          console.log(`${searchType}${keyword ? `+${keyword}` : ''} - Page ${pageCount}: ${data.results?.length || 0} restaurants found, total: ${allRestaurants.length}`);

        } catch (error) {
          console.error(`Error fetching ${searchType}:`, error);
          break;
        }

      } while (nextPageToken && pageCount < MAX_PAGES_PER_TYPE);

      // ラーメン検索の場合、最初の検索で結果が得られたら第2段階をスキップ
      if (strategy.keyword === 'ラーメン' && strategy.priority === 1 && allRestaurants.length >= 10) {
        console.log('Sufficient ramen results found, skipping additional searches');
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