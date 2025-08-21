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
  
  // 料理の種類
  japanese_restaurant: '和食',
  chinese_restaurant: '中華料理',
  italian_restaurant: 'イタリア料理',
  french_restaurant: 'フランス料理',
  korean_restaurant: '韓国料理',
  thai_restaurant: 'タイ料理',
  indian_restaurant: 'インド料理',
  mexican_restaurant: 'メキシコ料理',
  american_restaurant: 'アメリカ料理',
  mediterranean_restaurant: '地中海料理',
  seafood_restaurant: 'シーフード',
  steak_house: 'ステーキハウス',
  sushi_restaurant: '寿司',
  ramen_restaurant: 'ラーメン',
  pizza_restaurant: 'ピザ',
  hamburger_restaurant: 'ハンバーガー',
  sandwich_shop: 'サンドイッチ',
  
  // ファストフード・チェーン
  fast_food_restaurant: 'ファストフード',
  
  // 飲み物関連
  coffee_shop: 'コーヒーショップ',
  tea_house: '茶房',
  juice_bar: 'ジュースバー',
  
  // その他の飲食関連
  ice_cream_shop: 'アイスクリーム',
  dessert_shop: 'デザート',
  donut_shop: 'ドーナツ',
  frozen_yogurt_shop: 'フローズンヨーグルト',
  
  // 居酒屋・バー関連
  pub: 'パブ',
  wine_bar: 'ワインバー',
  cocktail_lounge: 'カクテルラウンジ',
  beer_garden: 'ビアガーデン',
  sake_bar: '酒場',
  
  // その他
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

/**
 * 利用可能なすべてのジャンルを取得する（フィルタリング用）
 * @returns ジャンルのマッピング
 */
export function getAllGenres(): Record<string, string> {
  return { ...GENRE_MAPPING };
}