'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* メイン情報 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* 基本情報 */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {restaurant.name}
                </h1>

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

                {/* 連絡先情報 */}
                <div className="space-y-4">
                  {restaurant.formatted_phone_number && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">電話番号</h3>
                      <a 
                        href={`tel:${restaurant.formatted_phone_number}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {restaurant.formatted_phone_number}
                      </a>
                    </div>
                  )}

                  {restaurant.website && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ウェブサイト</h3>
                      <a 
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        公式サイトを開く
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 営業時間 */}
          {restaurant.opening_hours?.weekday_text && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">営業時間</h2>
              <div className="space-y-2">
                {restaurant.opening_hours.weekday_text.map((day, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-700">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* レビュー */}
          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">レビュー</h2>
              <div className="space-y-6">
                {restaurant.reviews.slice(0, 5).map((review, index) => (
                  <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {review.author_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.author_name}</h4>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 ml-1">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.time * 1000).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}