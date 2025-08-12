'use client';

import { useState, useMemo } from 'react';
import LocationButton from '@/components/LocationButton';
import RestaurantCard from '@/components/RestaurantCard';
import { Restaurant, LocationError, PlacesApiResponse } from '@/types';
import { calculateDistance } from '@/utils/distance';

type SearchState = 'idle' | 'getting-location' | 'searching' | 'success' | 'error';

type SortOption = 'default' | 'rating' | 'distance' | 'price-low' | 'price-high';

export default function Home() {
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(1500);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const handleLocationSuccess = async (latitude: number, longitude: number) => {
    setSearchState('searching');
    setError('');
    setUserLocation({ latitude, longitude });

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius: searchRadius,
          type: 'restaurant',
          language: 'ja'
        }),
      });

      let data: PlacesApiResponse;
      
      if (!response.ok) {
        if (response.status === 429) {
          // 429エラーの場合、レスポンス内容を取得して詳細メッセージを表示
          try {
            data = await response.json();
            setSearchState('error');
            setError(data.error_message || 'API呼び出し制限に達しました。1分後に再試行してください。');
            return;
          } catch {
            setSearchState('error');
            setError('API呼び出し制限に達しました。1分後に再試行してください。');
            return;
          }
        }
        throw new Error('ネットワークエラーが発生しました');
      }

      data = await response.json();

      if (data.status === 'OK') {
        setRestaurants(data.restaurants);
        setSearchState(data.restaurants.length > 0 ? 'success' : 'error');
        if (data.restaurants.length === 0) {
          setError('近くにレストランが見つかりませんでした');
        }
      } else {
        setSearchState('error');
        // APIエラーの詳細を表示
        let errorMessage = 'レストランの検索に失敗しました';
        if (data.status === 'REQUEST_DENIED') {
          errorMessage = 'Google Places APIキーが無効です。管理者にお問い合わせください。';
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          errorMessage = 'API利用制限に達しました。しばらく時間をおいてから再試行してください。';
        } else if (data.status === 'ZERO_RESULTS') {
          errorMessage = '近くにレストランが見つかりませんでした。';
        } else if (data.error_message) {
          // レート制限やその他のエラーメッセージをそのまま表示
          if (data.error_message.includes('API呼び出し制限') || data.error_message.includes('制限に達しました')) {
            errorMessage = data.error_message;
          } else {
            errorMessage = `APIエラー: ${data.error_message}`;
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setSearchState('error');
      setError('レストランの検索中にエラーが発生しました');
      console.error('Search error:', err);
    }
  };

  const handleLocationError = (locationError: LocationError) => {
    setSearchState('error');
    setError(locationError.message);
  };

  const handleRetry = () => {
    setSearchState('idle');
    setError('');
    setRestaurants([]);
    setUserLocation(null);
  };

  const sortedRestaurants = useMemo(() => {
    if (!restaurants.length) return [];
    
    const sorted = [...restaurants];
    
    switch (sortOption) {
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case 'distance':
        if (!userLocation) return sorted;
        return sorted.sort((a, b) => {
          const distA = a.geometry?.location ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.geometry.location.lat,
            a.geometry.location.lng
          ) : Infinity;
          const distB = b.geometry?.location ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.geometry.location.lat,
            b.geometry.location.lng
          ) : Infinity;
          return distA - distB;
        });
      
      case 'price-low':
        return sorted.sort((a, b) => (a.price_level || 0) - (b.price_level || 0));
      
      case 'price-high':
        return sorted.sort((a, b) => (b.price_level || 0) - (a.price_level || 0));
      
      default:
        return sorted;
    }
  }, [restaurants, sortOption, userLocation]);

  const renderContent = () => {
    switch (searchState) {
      case 'idle':
        return (
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                レストランを検索
              </h2>
              <p className="text-gray-600 text-sm">
                現在地から{searchRadius / 1000}km以内の レストランを検索します
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索範囲: {searchRadius / 1000}km
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5km</span>
                <span>5km</span>
              </div>
            </div>
            <LocationButton
              onLocationSuccess={handleLocationSuccess}
              onLocationError={handleLocationError}
            />
          </div>
        );

      case 'getting-location':
      case 'searching':
        return (
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {searchState === 'getting-location' ? '位置情報を取得中...' : 'レストランを検索中...'}
            </h2>
            <p className="text-gray-600 text-sm">
              しばらくお待ちください
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="w-full max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                近くのレストラン ({restaurants.length}件)
              </h2>
              <p className="text-gray-600">
                現在地から{searchRadius / 1000}km以内のレストラン
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                再検索
              </button>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  並び替え:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="default">デフォルト</option>
                  <option value="rating">評価が高い順</option>
                  <option value="distance">距離が近い順</option>
                  <option value="price-low">価格が安い順</option>
                  <option value="price-high">価格が高い順</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRestaurants.map((restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant}
                  userLocation={userLocation}
                />
              ))}
            </div>
          </div>
        );

      case 'error':
        const isRateLimit = error.includes('API呼び出し制限') || error.includes('制限に達しました');
        
        return (
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isRateLimit ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              {isRateLimit ? (
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isRateLimit ? 'API利用制限' : 'エラーが発生しました'}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {error}
            </p>
            {isRateLimit && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>しばらくお待ちいただいてから再試行してください</span>
                </div>
              </div>
            )}
            <button
              onClick={handleRetry}
              className={`px-6 py-3 text-white rounded-lg font-medium transition-colors duration-200 ${
                isRateLimit 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              もう一度試す
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Near-by Eats
          </h1>
          <p className="text-gray-600 text-lg">
            現在地から近くのレストランを見つけます
          </p>
        </div>

        <div className="flex flex-col items-center">
          {renderContent()}
        </div>
      </div>
    </main>
  );
}