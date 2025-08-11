'use client';

import { useState } from 'react';
import LocationButton from '@/components/LocationButton';
import RestaurantCard from '@/components/RestaurantCard';
import { Restaurant, LocationError, PlacesApiResponse } from '@/types';

type SearchState = 'idle' | 'getting-location' | 'searching' | 'success' | 'error';

export default function Home() {
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string>('');

  const handleLocationSuccess = async (latitude: number, longitude: number) => {
    setSearchState('searching');
    setError('');

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius: 1500,
          type: 'restaurant',
          language: 'ja'
        }),
      });

      if (!response.ok) {
        throw new Error('ネットワークエラーが発生しました');
      }

      const data: PlacesApiResponse = await response.json();

      if (data.status === 'OK') {
        setRestaurants(data.restaurants);
        setSearchState(data.restaurants.length > 0 ? 'success' : 'error');
        if (data.restaurants.length === 0) {
          setError('近くにレストランが見つかりませんでした');
        }
      } else {
        setSearchState('error');
        setError(data.error_message || 'レストランの検索に失敗しました');
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
  };

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
                現在地から1.5km以内の レストランを検索します
              </p>
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
                現在地から1.5km以内のレストラン
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                再検索
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
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
              onClick={handleRetry}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
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