import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// デモ用の詳細データ
const DEMO_RESTAURANT_DETAILS: Record<string, any> = {
  'demo-1': {
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
    opening_hours: {
      open_now: true,
      weekday_text: [
        '月曜日: 11:30～14:00, 17:30～22:00',
        '火曜日: 11:30～14:00, 17:30～22:00',
        '水曜日: 11:30～14:00, 17:30～22:00',
        '木曜日: 11:30～14:00, 17:30～22:00',
        '金曜日: 11:30～14:00, 17:30～22:30',
        '土曜日: 11:30～14:30, 17:00～22:30',
        '日曜日: 11:30～14:30, 17:00～21:30'
      ]
    },
    price_level: 2,
    formatted_phone_number: '03-1234-5678',
    website: 'https://example.com/kagetsu',
    photos: [
      {
        photo_reference: 'demo_photo_1_japanese',
        width: 800,
        height: 600,
        html_attributions: []
      },
      {
        photo_reference: 'demo_photo_2_japanese',
        width: 800,
        height: 600,
        html_attributions: []
      },
      {
        photo_reference: 'demo_photo_3_japanese',
        width: 800,
        height: 600,
        html_attributions: []
      }
    ],
    reviews: [
      {
        author_name: '田中太郎',
        rating: 5,
        text: '素晴らしい和食レストランです。新鮮な食材を使った料理は絶品で、特に季節の懐石料理がおすすめです。店内の雰囲気も落ち着いており、接客も丁寧でした。',
        time: 1703123456
      },
      {
        author_name: '佐藤花子',
        rating: 4,
        text: '友人との食事で利用しました。料理の味は申し分なく、盛り付けも美しかったです。少し価格は高めですが、特別な日にはまた利用したいと思います。',
        time: 1702987654
      },
      {
        author_name: '山田次郎',
        rating: 4,
        text: 'ランチで訪問。定食メニューも充実しており、コストパフォーマンスが良いです。味噌汁が特に美味しかったです。',
        time: 1702851234
      }
    ]
  },
  'demo-2': {
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
    opening_hours: {
      open_now: true,
      weekday_text: [
        '月曜日: 11:00～15:00, 17:00～23:00',
        '火曜日: 11:00～15:00, 17:00～23:00',
        '水曜日: 11:00～15:00, 17:00～23:00',
        '木曜日: 11:00～15:00, 17:00～23:00',
        '金曜日: 11:00～15:00, 17:00～24:00',
        '土曜日: 11:00～24:00',
        '日曜日: 11:00～22:00'
      ]
    },
    price_level: 3,
    formatted_phone_number: '03-2345-6789',
    website: 'https://example.com/bellavista',
    photos: [
      {
        photo_reference: 'demo_photo_1_italian',
        width: 800,
        height: 600,
        html_attributions: []
      },
      {
        photo_reference: 'demo_photo_2_italian',
        width: 800,
        height: 600,
        html_attributions: []
      }
    ],
    reviews: [
      {
        author_name: '鈴木美咲',
        rating: 4,
        text: '本格的なイタリアンが楽しめるお店です。パスタの種類が豊富で、どれも美味しかったです。ワインの品揃えも良く、デートにおすすめです。',
        time: 1703234567
      },
      {
        author_name: '高橋健一',
        rating: 4,
        text: 'ピザが絶品でした！生地がもちもちで、トッピングも新鮮でした。店内は少し狭いですが、アットホームな雰囲気が良いです。',
        time: 1703098765
      }
    ]
  },
  'demo-3': {
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
    opening_hours: {
      open_now: false,
      weekday_text: [
        '月曜日: 8:00～20:00',
        '火曜日: 8:00～20:00',
        '水曜日: 8:00～20:00',
        '木曜日: 8:00～20:00',
        '金曜日: 8:00～21:00',
        '土曜日: 9:00～21:00',
        '日曜日: 9:00～19:00'
      ]
    },
    price_level: 1,
    formatted_phone_number: '03-3456-7890',
    website: 'https://example.com/aozora',
    photos: [
      {
        photo_reference: 'demo_photo_1_cafe',
        width: 800,
        height: 600,
        html_attributions: []
      },
      {
        photo_reference: 'demo_photo_2_cafe',
        width: 800,
        height: 600,
        html_attributions: []
      },
      {
        photo_reference: 'demo_photo_3_cafe',
        width: 800,
        height: 600,
        html_attributions: []
      }
    ],
    reviews: [
      {
        author_name: '伊藤さくら',
        rating: 4,
        text: 'モーニングで利用しました。コーヒーが美味しく、パンも焼きたてで満足です。Wi-Fiもあるので、作業にも使えそうです。',
        time: 1703345678
      },
      {
        author_name: '渡辺大輔',
        rating: 3,
        text: 'カジュアルなカフェです。料理の味は普通ですが、価格がリーズナブルで気軽に利用できます。',
        time: 1703209876
      }
    ]
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const placeId = params.id;

    if (!placeId) {
      return NextResponse.json(
        { 
          restaurant: null, 
          status: 'ERROR', 
          error_message: 'プレイスIDが必要です' 
        },
        { status: 400 }
      );
    }

    // Google Maps APIキーが設定されていない場合はデモデータを返す
    if (!GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API key not found, using demo data for place details');
      
      const demoRestaurant = DEMO_RESTAURANT_DETAILS[placeId];
      if (demoRestaurant) {
        return NextResponse.json({
          restaurant: demoRestaurant,
          status: 'OK'
        });
      } else {
        return NextResponse.json({
          restaurant: null,
          status: 'NOT_FOUND',
          error_message: 'レストランが見つかりませんでした'
        });
      }
    }

    // Google Places API の Place Details を呼び出し
    const fields = [
      'place_id',
      'name',
      'rating',
      'formatted_address',
      'formatted_phone_number',
      'website',
      'opening_hours',
      'price_level',
      'geometry',
      'types',
      'photos',
      'reviews'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ja&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({
        restaurant: null,
        status: data.status,
        error_message: data.error_message || 'レストラン詳細の取得に失敗しました'
      });
    }

    const place = data.result;
    const restaurant = {
      id: place.place_id,
      name: place.name,
      rating: place.rating,
      address: place.formatted_address,
      vicinity: place.vicinity,
      place_id: place.place_id,
      geometry: place.geometry,
      types: place.types,
      opening_hours: place.opening_hours,
      price_level: place.price_level,
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      photos: place.photos,
      reviews: place.reviews
    };

    return NextResponse.json({
      restaurant,
      status: 'OK'
    });

  } catch (error) {
    console.error('Place Details API Error:', error);
    return NextResponse.json(
      { 
        restaurant: null, 
        status: 'ERROR', 
        error_message: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}