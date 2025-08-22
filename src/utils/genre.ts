// Google Places API のタイプを日本語のジャンル名に変換するマッピング
const GENRE_MAPPING: Record<string, string> = {
  // 基本的な飲食店タイプ
  restaurant: 'レストラン',
  food: '飲食店',
  cafe: 'カフェ',
  bar: 'バー',
  meal_takeaway: 'テイクアウト',
  meal_delivery: 'デリバリー',
  bakery: 'ベーカリー',
  
  // 料理の種類（Google Places APIで実際に返される可能性があるタイプ）
  american_restaurant: 'アメリカ料理',
  mexican_restaurant: 'メキシコ料理', 
  chinese_restaurant: '中華料理',
  italian_restaurant: 'イタリア料理',
  japanese_restaurant: '和食',
  asian_restaurant: 'アジア料理',
  indian_restaurant: 'インド料理',
  thai_restaurant: 'タイ料理',
  french_restaurant: 'フランス料理',
  greek_restaurant: 'ギリシャ料理',
  brazilian_restaurant: 'ブラジル料理',
  spanish_restaurant: 'スペイン料理',
  mediterranean_restaurant: '地中海料理',
  vietnamese_restaurant: 'ベトナム料理',
  korean_restaurant: '韓国料理',
  lebanese_restaurant: 'レバノン料理',
  middle_eastern_restaurant: '中東料理',
  
  // 特定の料理スタイル
  seafood_restaurant: 'シーフード',
  steak_house: 'ステーキハウス',
  sushi_restaurant: '寿司',
  pizza_restaurant: 'ピザ',
  barbecue_restaurant: 'バーベキュー',
  hamburger_restaurant: 'ハンバーガー',
  vegan_restaurant: 'ビーガン料理',
  vegetarian_restaurant: 'ベジタリアン料理',
  
  // 特定の飲食店
  coffee_shop: 'コーヒーショップ',
  pub: 'パブ',
  wine_bar: 'ワインバー',
  deli: 'デリカテッセン',
  fast_food_restaurant: 'ファストフード',
  
  // 専門店
  ice_cream_shop: 'アイスクリーム',
  sandwich_shop: 'サンドイッチ',
  donut_shop: 'ドーナツ',
  juice_shop: 'ジュース',
  tea_house: '茶房',
  
  // その他（実際のAPIレスポンスでは使われないが、一般的な分類として保持）
  ramen_restaurant: 'ラーメン',
  dessert_shop: 'デザート',
  frozen_yogurt_shop: 'フローズンヨーグルト',
  cocktail_lounge: 'カクテルラウンジ',
  beer_garden: 'ビアガーデン',
  sake_bar: '酒場',
  buffet_restaurant: 'ビュッフェ',
  family_restaurant: 'ファミリーレストラン',
  fine_dining_restaurant: '高級レストラン',
  casual_dining_restaurant: 'カジュアルダイニング',
};


/**
 * Google Places APIのタイプを日本語のジャンル名に変換する
 * @param type Google Places APIから取得したタイプ
 * @returns 日本語のジャンル名（マッピングが存在しない場合はnull）
 */
export function getJapaneseGenreName(type: string): string | null {
  return GENRE_MAPPING[type] || null;
}

/**
 * レストランのタイプ配列から、表示用の日本語ジャンル配列を取得する
 * @param types Google Places APIから取得したタイプ配列
 * @param maxCount 最大表示件数（デフォルト: 3）
 * @returns 日本語ジャンル名の配列
 */
export function getDisplayGenres(types: string[] = [], maxCount: number = 3): string[] {
  const genres = types
    .map(type => getJapaneseGenreName(type))
    .filter((genre): genre is string => genre !== null)
    .slice(0, maxCount);
  
  return genres;
}

