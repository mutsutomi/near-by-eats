import { NextRequest, NextResponse } from 'next/server';
import { PlacesApiRequest, PlacesApiResponse, Restaurant } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { calculateDistance } from '@/utils/distance';

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
    const { latitude, longitude, language = 'ja', query } = body;

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

    console.log(`Search query: "${query || 'all restaurants'}" at coordinates: ${latitude}, ${longitude}`);

    const allRestaurants: Restaurant[] = [];
    const TIMEOUT_MS = 15000;
    const startTime = Date.now();

    // 段階的半径拡大: 100m → 300m → 500m → 1km → 2km（より近い店を優先）
    const radiusSteps = [100, 300, 500, 1000, 2000];
    
    // 飲食店の種類を拡大して検索精度を向上
    const foodTypes = ['restaurant', 'meal_takeaway', 'cafe', 'bakery', 'food'];
    
    for (const radius of radiusSteps) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.log('Timeout reached, returning current results');
        break;
      }

      console.log(`Searching with radius: ${radius}m`);
      
      // 各タイプで並行検索
      for (const type of foodTypes) {
        if (Date.now() - startTime > TIMEOUT_MS) break;
        
        try {
          // Nearby Search APIを使用（コスト効率を優先）
          let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&language=${language}`;
          
          // keywordパラメータでジャンル絞り込み
          if (query && query.trim()) {
            url += `&keyword=${encodeURIComponent(query.trim())}`;
            console.log(`Using keyword: "${query.trim()}" for type: ${type}`);
          }
          
          url += `&key=${GOOGLE_MAPS_API_KEY}`;

          const response = await fetch(url);
          const data = await response.json();

          console.log(`API Response (${type} at ${radius}m):`, {
            status: data.status,
            resultsCount: data.results?.length || 0,
            error_message: data.error_message
          });

          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error(`Google Places API error (${type} at ${radius}m):`, data.status, data.error_message);
            continue; // 次のタイプで試行
          }

          // レストランデータを追加
          if (data.results && data.results.length > 0) {
            console.log(`Sample results (${type} at ${radius}m, first 2):`, 
              data.results.slice(0, 2).map((place: any) => ({
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

            // 重複除去しながら追加
            restaurants.forEach(restaurant => {
              if (!allRestaurants.find(existing => existing.place_id === restaurant.place_id)) {
                allRestaurants.push(restaurant);
              }
            });
            
            console.log(`Found ${data.results.length} restaurants (${type} at ${radius}m), total unique: ${allRestaurants.length}`);
          }

        } catch (error) {
          console.error(`Error fetching restaurants (${type} at ${radius}m):`, error);
          // APIエラーの場合も次のタイプで継続
        }
      }
      
      // 各半径の検索完了後、十分な結果があれば終了
      if (allRestaurants.length >= 15) {
        console.log(`Sufficient results found (${allRestaurants.length}) at radius ${radius}m, stopping search`);
        break;
      }
    }

    console.log(`Total unique restaurants found: ${allRestaurants.length}`);

    // 距離順でソート（近い順）
    const sortedByDistance = allRestaurants.sort((a, b) => {
      if (!a.geometry?.location || !b.geometry?.location) return 0;
      
      const distanceA = calculateDistance(
        latitude, longitude,
        a.geometry.location.lat, a.geometry.location.lng
      );
      const distanceB = calculateDistance(
        latitude, longitude,
        b.geometry.location.lat, b.geometry.location.lng
      );
      
      return distanceA - distanceB;
    });

    console.log(`Results sorted by distance. Closest 3:`, 
      sortedByDistance.slice(0, 3).map(r => ({
        name: r.name,
        distance: r.geometry?.location ? 
          Math.round(calculateDistance(latitude, longitude, r.geometry.location.lat, r.geometry.location.lng)) + 'm' 
          : 'unknown'
      }))
    );

    return NextResponse.json({
      restaurants: sortedByDistance,
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