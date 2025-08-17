import { NextRequest, NextResponse } from 'next/server';
import { PlacesApiRequest, PlacesApiResponse, Restaurant } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';

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
    const { latitude, longitude, radius = 1500, type = 'restaurant', language = 'ja', includeAllTypes = false } = body;

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
    let nextPageToken: string | undefined;
    let pageCount = 0;
    const maxPages = 3; // 最大3ページ（60件）まで取得

    // より多くの飲食店を取得するため、複数のタイプで検索する場合
    const searchTypes = includeAllTypes 
      ? ['restaurant', 'food', 'cafe', 'bar', 'meal_takeaway'] 
      : [type];

    // 各タイプで検索を実行
    for (const searchType of searchTypes) {
      nextPageToken = undefined;
      pageCount = 0;
      
      // 最初のリクエスト
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${searchType}&language=${language}&key=${GOOGLE_MAPS_API_KEY}`;
    
    do {
      // ページトークンがある場合は追加
      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_MAPS_API_KEY}`;
        // ページトークン使用時は2秒待機（Google API要件）
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
        // 既に取得したデータがある場合はそれを返す
        if (allRestaurants.length > 0) {
          break;
        }
        return NextResponse.json({
          restaurants: [],
          status: data.status,
          error_message: data.error_message || 'Google Places APIの呼び出しに失敗しました'
        } as PlacesApiResponse);
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

      console.log(`Page ${pageCount}: ${data.results?.length || 0} restaurants found, total: ${allRestaurants.length}`);

    } while (nextPageToken && pageCount < maxPages);
    }

    // 重複を除去（同じplace_idを持つレストランを削除）
    const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) =>
      index === self.findIndex((r) => r.place_id === restaurant.place_id)
    );

    console.log(`Total unique restaurants found: ${uniqueRestaurants.length}`);

    return NextResponse.json({
      restaurants: uniqueRestaurants,
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