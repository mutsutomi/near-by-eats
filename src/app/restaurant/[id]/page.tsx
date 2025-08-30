'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Restaurant } from '@/types';

interface RestaurantDetail extends Restaurant {
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

// 写真ギャラリーコンポーネント
function PhotoGallery({ photos }: { photos: RestaurantDetail['photos'] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [showModal, setShowModal] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-64 md:h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* メイン写真 */}
        <motion.div 
          className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          onClick={() => setShowModal(true)}
        >
          <img
            src={`/api/places/photo/${photos[selectedPhoto].photo_reference}?maxwidth=800`}
            alt="Restaurant photo"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&auto=format';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-300" />
          
          {/* 画像送りボタン */}
          {photos.length > 1 && (
            <>
              {/* 前の画像ボタン */}
              <motion.button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              {/* 次の画像ボタン */}
              <motion.button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </>
          )}

          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {selectedPhoto + 1} / {photos.length}
          </div>
        </motion.div>

        {/* サムネイル */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <motion.button
                key={index}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                  selectedPhoto === index ? 'ring-3 ring-blue-500' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPhoto(index)}
              >
                <img
                  src={`/api/places/photo/${photo.photo_reference}?maxwidth=200`}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&h=200&fit=crop&auto=format';
                  }}
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* フルスクリーンモーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`/api/places/photo/${photos[selectedPhoto].photo_reference}?maxwidth=1200`}
                alt="Restaurant photo"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&h=800&fit=crop&auto=format';
                }}
              />

              {/* モーダル内の画像送りボタン */}
              {photos.length > 1 && (
                <>
                  {/* 前の画像ボタン */}
                  <motion.button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1);
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>

                  {/* 次の画像ボタン */}
                  <motion.button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0);
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </>
              )}

              {/* 閉じるボタン */}
              <button
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-opacity"
                onClick={() => setShowModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 画像カウンター */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {selectedPhoto + 1} / {photos.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      if (!params.id) return;

      try {
        const response = await fetch(`/api/places/${params.id}`);
        
        if (!response.ok) {
          throw new Error('レストラン詳細の取得に失敗しました');
        }

        const data = await response.json();
        
        if (data.status === 'OK') {
          setRestaurant(data.restaurant);
        } else {
          setError(data.error_message || 'レストラン詳細の取得に失敗しました');
        }
      } catch (err) {
        setError('レストラン詳細の取得中にエラーが発生しました');
        console.error('Restaurant detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetail();
  }, [params.id]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">☆</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">☆</span>
      );
    }

    return stars;
  };

  const renderPriceLevel = (level: number) => {
    const yenSymbols = [];
    for (let i = 0; i < level; i++) {
      yenSymbols.push('¥');
    }
    for (let i = level; i < 4; i++) {
      yenSymbols.push(<span key={i} className="text-gray-300">¥</span>);
    }
    return yenSymbols;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                レストラン詳細を読み込み中...
              </h2>
              <p className="text-gray-600 text-sm">
                しばらくお待ちください
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                {error}
              </p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* ヒーロー写真セクション */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PhotoGallery photos={restaurant.photos} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* メイン情報 */}
            <motion.div 
              className="lg:col-span-2 space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* 基本情報カード */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                      {restaurant.name}
                    </h1>
                    
                    {/* カテゴリバッジ */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {restaurant.types?.slice(0, 3).map((type, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                        >
                          {type === 'restaurant' ? 'レストラン' : 
                           type === 'cafe' ? 'カフェ' : 
                           type === 'meal_takeaway' ? 'テイクアウト' : type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ソーシャル共有 */}
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: restaurant.name,
                            text: `${restaurant.name}をチェック！`,
                            url: window.location.href,
                          });
                        }
                      }}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 評価と価格帯 */}
                <div className="flex items-center gap-6 mb-6">
                  {restaurant.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center" aria-label={`評価: 5つ星中${restaurant.rating}つ星`}>
                        {renderStars(restaurant.rating)}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  
                  {restaurant.price_level && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">価格帯:</span>
                      <div className="flex items-center text-lg font-semibold text-green-600">
                        {renderPriceLevel(restaurant.price_level)}
                      </div>
                    </div>
                  )}
                </div>

                {/* 営業状況 */}
                {restaurant.opening_hours && (
                  <div className="mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      restaurant.opening_hours.open_now 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        restaurant.opening_hours.open_now ? 'bg-green-600' : 'bg-red-600'
                      }`} />
                      {restaurant.opening_hours.open_now ? '営業中' : '営業時間外'}
                    </div>
                  </div>
                )}

                {/* 住所 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">住所</h3>
                  <p className="text-gray-700 flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {restaurant.address}
                  </p>
                </div>

              </div>
            </motion.div>

            {/* サイドバー - アクションボタン */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="sticky top-8 space-y-6">
                {/* クイックアクション */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
                  <div className="space-y-3">
                    {/* 電話ボタン */}
                    {restaurant.formatted_phone_number && (
                      <motion.a
                        href={`tel:${restaurant.formatted_phone_number}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-green-800">電話する</div>
                          <div className="text-sm text-green-600">今すぐ連絡</div>
                        </div>
                      </motion.a>
                    )}

                    {/* ナビゲーションボタン */}
                    <motion.button
                      onClick={() => {
                        if (restaurant.geometry?.location) {
                          const { lat, lng } = restaurant.geometry.location;
                          window.open(`https://maps.google.com/maps?daddr=${lat},${lng}`, '_blank');
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-blue-800">ナビ開始</div>
                        <div className="text-sm text-blue-600">Google Mapsで開く</div>
                      </div>
                    </motion.button>

                    {/* ウェブサイトボタン */}
                    {restaurant.website && (
                      <motion.a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 w-full p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-purple-800">公式サイト</div>
                          <div className="text-sm text-purple-600">詳細をチェック</div>
                        </div>
                      </motion.a>
                    )}

                    {/* お気に入りボタン */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors duration-200 group"
                    >
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-red-800">お気に入り</div>
                        <div className="text-sm text-red-600">保存する</div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* 基本情報カード */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                  <div className="space-y-4">
                    {/* 営業状況 */}
                    {restaurant.opening_hours && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">営業状況</span>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          restaurant.opening_hours.open_now 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            restaurant.opening_hours.open_now ? 'bg-green-600' : 'bg-red-600'
                          }`} />
                          {restaurant.opening_hours.open_now ? '営業中' : '営業時間外'}
                        </div>
                      </div>
                    )}

                    {/* 価格帯 */}
                    {restaurant.price_level && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">価格帯</span>
                        <div className="flex items-center text-lg font-semibold text-green-600">
                          {renderPriceLevel(restaurant.price_level)}
                        </div>
                      </div>
                    )}

                    {/* 評価 */}
                    {restaurant.rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">評価</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {renderStars(restaurant.rating)}
                          </div>
                          <span className="text-lg font-semibold text-gray-700">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* マップとアクセス情報 */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">アクセス</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 地図プレースホルダー */}
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">地図を表示</p>
                    <p className="text-sm text-gray-500">クリックしてGoogle Mapsで開く</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (restaurant.geometry?.location) {
                      const { lat, lng } = restaurant.geometry.location;
                      window.open(`https://maps.google.com/maps?q=${lat},${lng}`, '_blank');
                    }
                  }}
                  className="absolute inset-0 w-full h-full bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200"
                />
              </div>
              
              {/* アクセス情報 */}
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">住所</h3>
                  <p className="text-gray-700">{restaurant.address}</p>
                </div>
                
                {restaurant.formatted_phone_number && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">電話番号</h3>
                    <a 
                      href={`tel:${restaurant.formatted_phone_number}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {restaurant.formatted_phone_number}
                    </a>
                  </div>
                )}
                
                <div className="flex gap-2 mt-6">
                  <motion.button
                    onClick={() => {
                      if (restaurant.geometry?.location) {
                        const { lat, lng } = restaurant.geometry.location;
                        window.open(`https://maps.google.com/maps?daddr=${lat},${lng}`, '_blank');
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    ルート案内
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: restaurant.name,
                          text: `${restaurant.name} - ${restaurant.address}`,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    共有
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 営業時間 */}
          {restaurant.opening_hours?.weekday_text && (
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">営業時間</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurant.opening_hours.weekday_text.map((day, index) => (
                  <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{day.split(':')[0]}</span>
                    <span className="text-gray-600">{day.split(':').slice(1).join(':').trim()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* レビュー */}
          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">レビュー</h2>
              <div className="space-y-6">
                {restaurant.reviews.slice(0, 5).map((review, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gray-50 rounded-xl p-6 border border-gray-100"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">
                            {review.author_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.author_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                        {new Date(review.time * 1000).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-100">
                      {review.text}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              {restaurant.reviews.length > 5 && (
                <div className="text-center mt-6">
                  <p className="text-gray-600 text-sm">
                    他にも{restaurant.reviews.length - 5}件のレビューがあります
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}