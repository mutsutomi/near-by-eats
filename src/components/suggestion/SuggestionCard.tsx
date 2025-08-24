'use client';

import { motion } from 'framer-motion';
import { Restaurant } from '@/types';
import { calculateDistance } from '@/utils/distance';

interface SuggestionCardProps {
  restaurant: Restaurant;
  index: number;
  userLocation: { lat: number; lng: number } | null;
  onSelect: () => void;
}

// カテゴリに応じたグラデーション
const getGradientColors = (types?: string[]) => {
  if (!types || types.length === 0) return 'from-gray-400 to-gray-500';
  
  // メインカテゴリを判定
  if (types.includes('restaurant')) return 'from-orange-400 to-red-500';
  if (types.includes('cafe')) return 'from-yellow-400 to-orange-500';
  if (types.includes('meal_takeaway')) return 'from-green-400 to-teal-500';
  if (types.includes('bakery')) return 'from-pink-400 to-purple-500';
  if (types.includes('bar')) return 'from-indigo-400 to-purple-500';
  
  return 'from-blue-400 to-indigo-500';
};

// 徒歩時間を計算
const getWalkingTime = (distance: number) => {
  if (distance === 0) return '0';
  // 徒歩4km/h として計算
  const timeInMinutes = (distance / 1000) * 15;
  return Math.ceil(timeInMinutes).toString();
};

// カテゴリラベルを取得
const getCategoryLabel = (types?: string[]) => {
  if (!types || types.length === 0) return 'レストラン';
  
  const categoryMap: Record<string, string> = {
    restaurant: 'レストラン',
    cafe: 'カフェ',
    meal_takeaway: 'テイクアウト',
    bakery: 'ベーカリー',
    bar: 'バー',
    food: '飲食店',
    meal_delivery: 'デリバリー',
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  
  return 'レストラン';
};

// レーティング表示用の星
const StarRating = ({ rating }: { rating?: number }) => {
  if (!rating) return null;
  
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // フル星
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  
  // 半星
  if (hasHalfStar) {
    stars.push(
      <svg key="half" className="w-4 h-4 text-yellow-500" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  
  return <div className="flex items-center">{stars}</div>;
};

export default function SuggestionCard({ 
  restaurant, 
  index, 
  userLocation,
  onSelect 
}: SuggestionCardProps) {
  const distance = userLocation && restaurant.geometry?.location 
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        restaurant.geometry.location.lat,
        restaurant.geometry.location.lng
      )
    : 0;

  const gradientColors = getGradientColors(restaurant.types);
  const walkingTime = getWalkingTime(distance);
  const categoryLabel = getCategoryLabel(restaurant.types);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.15,
        duration: 0.5,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden 
                 hover:shadow-xl transition-all duration-300 cursor-pointer
                 transform hover:scale-[1.02]"
      onClick={onSelect}
    >
      {/* ヘッダー部分（グラデーション） */}
      <div className={`h-32 bg-gradient-to-br ${gradientColors} relative overflow-hidden`}>
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`pattern-${restaurant.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#pattern-${restaurant.id})`} />
          </svg>
        </div>
        
        {/* 中央のアイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
          >
            <svg className="text-white/60 w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </motion.div>
        </div>
        
        {/* 徒歩時間バッジ */}
        <div className="absolute top-4 right-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.5, duration: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm"
          >
            <span className="text-sm font-bold text-gray-800">
              徒歩{walkingTime}分
            </span>
          </motion.div>
        </div>

        {/* インデックスバッジ */}
        <div className="absolute top-4 left-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.4, duration: 0.3 }}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <span className="text-white font-bold text-lg">
              {index + 1}
            </span>
          </motion.div>
        </div>
      </div>
      
      {/* コンテンツ部分 */}
      <div className="p-6">
        <motion.h3 
          className="text-xl font-bold text-gray-800 mb-3 line-clamp-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.6, duration: 0.3 }}
        >
          {restaurant.name}
        </motion.h3>
        
        <motion.div 
          className="flex items-center gap-3 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.7, duration: 0.3 }}
        >
          {/* 評価 */}
          {restaurant.rating && (
            <div className="flex items-center gap-1">
              <StarRating rating={restaurant.rating} />
              <span className="font-medium text-gray-700 ml-1">
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
          )}
          
          {restaurant.rating && (
            <span className="text-gray-400">•</span>
          )}
          
          {/* カテゴリ */}
          <span className="text-gray-600 font-medium">
            {categoryLabel}
          </span>
        </motion.div>
        
        {/* 住所 */}
        <motion.p 
          className="text-gray-600 text-sm line-clamp-2 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.8, duration: 0.3 }}
        >
          {restaurant.vicinity || restaurant.address}
        </motion.p>

        {/* 営業状況 */}
        {restaurant.opening_hours && (
          <motion.div 
            className="mt-3 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.9, duration: 0.3 }}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              restaurant.opening_hours.open_now ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              restaurant.opening_hours.open_now ? 'text-green-700' : 'text-red-700'
            }`}>
              {restaurant.opening_hours.open_now ? '営業中' : '営業時間外'}
            </span>
          </motion.div>
        )}
      </div>
      
      {/* ホバー時のアクション表示 */}
      <motion.div 
        className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-200 
                   flex items-center justify-center opacity-0 hover:opacity-100"
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
        >
          <span className="text-gray-800 font-medium">詳細を見る</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}