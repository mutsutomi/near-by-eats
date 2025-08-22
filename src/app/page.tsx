'use client';

import { useState, useMemo } from 'react';
import LocationButton from '@/components/LocationButton';
import RestaurantCard from '@/components/RestaurantCard';
import { Restaurant, LocationError, PlacesApiResponse } from '@/types';
import { calculateDistance } from '@/utils/distance';
import { getDisplayGenres } from '@/utils/genre';

type SearchState = 'idle' | 'getting-location' | 'searching' | 'success' | 'error';
type SortOption = 'default' | 'rating' | 'distance' | 'price-low' | 'price-high';

export default function Home() {
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

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
          language: 'ja',
          query: searchKeyword
        }),
      });

      let data: PlacesApiResponse;
      
      if (!response.ok) {
        if (response.status === 429) {
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
        let errorMessage = 'レストランの検索に失敗しました';
        if (data.status === 'REQUEST_DENIED') {
          errorMessage = 'Google Places APIキーが無効です。管理者にお問い合わせください。';
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          errorMessage = 'API利用制限に達しました。しばらく時間をおいてから再試行してください。';
        } else if (data.status === 'ZERO_RESULTS') {
          errorMessage = '近くにレストランが見つかりませんでした。';
        } else if (data.error_message) {
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
    setError('');
    if (userLocation) {
      handleLocationSuccess(userLocation.latitude, userLocation.longitude);
    } else {
      setSearchState('idle');
      setRestaurants([]);
    }
  };

  const sortedAndFilteredRestaurants = useMemo(() => {
    if (!restaurants.length) return [];
    
    // キーワードフィルタリングを適用
    let filtered = [...restaurants];
    if (filterKeyword.trim()) {
      const keyword = filterKeyword.toLowerCase();
      filtered = restaurants.filter(restaurant => {
        // レストラン名、住所、ジャンル名で検索
        const searchText = [
          restaurant.name,
          restaurant.address,
          restaurant.vicinity,
          ...(restaurant.types?.map(type => getDisplayGenres([type], 10)).flat() || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(keyword);
      });
    }
    
    // 次にソートを適用
    switch (sortOption) {
      case 'rating':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case 'distance':
        if (!userLocation) return filtered;
        return filtered.sort((a, b) => {
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
        return filtered.sort((a, b) => (a.price_level || 0) - (b.price_level || 0));
      
      case 'price-high':
        return filtered.sort((a, b) => (b.price_level || 0) - (a.price_level || 0));
      
      default:
        return filtered;
    }
  }, [restaurants, sortOption, userLocation, filterKeyword]);

  const isLoading = searchState === 'getting-location' || searchState === 'searching';
  const hasResults = searchState === 'success' && restaurants.length > 0;
  const hasError = searchState === 'error';

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Near-by Eats
          </h1>
          <p className="text-gray-600 text-lg">
            現在地から近くのレストランを見つけます
          </p>
        </div>

        {/* 検索フォーム（常に表示） */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* キーワード入力 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="例: ラーメン、イタリアン、寿司"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={isLoading}
                />
              </div>
              
              {/* 検索ボタン */}
              <LocationButton
                onLocationSuccess={handleLocationSuccess}
                onLocationError={handleLocationError}
                className="sm:w-auto px-6 py-3"
                disabled={isLoading}
              />
            </div>
            
            {searchKeyword && (
              <p className="text-sm text-gray-500 mt-2">
                &quot;{searchKeyword}&quot; で検索します。空白の場合は全てのレストランを検索します。
              </p>
            )}
          </div>

          {/* ローディング状態 */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {searchState === 'getting-location' ? '位置情報を取得中...' : 'レストランを検索中...'}
              </h2>
              <p className="text-gray-600">
                しばらくお待ちください
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {hasError && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  エラーが発生しました
                </h3>
                <p className="text-gray-600 mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  再試行
                </button>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {hasResults && (
            <div>
              {/* 結果ヘッダーと絞り込み・ソート */}
              <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      近くのレストラン ({sortedAndFilteredRestaurants.length}件
                      {filterKeyword.trim() && ` / ${restaurants.length}件中`})
                    </h2>
                    {searchKeyword.trim() && (
                      <p className="text-gray-600 text-sm">
                        検索: &quot;{searchKeyword}&quot;
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                    {/* 絞り込み */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="filter-keyword" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        絞り込み:
                      </label>
                      <input
                        id="filter-keyword"
                        type="text"
                        placeholder="キーワード"
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        style={{ minWidth: '140px' }}
                      />
                    </div>
                    
                    {/* ソート */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        並び替え:
                      </label>
                      <select
                        id="sort"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm appearance-none cursor-pointer"
                        style={{ minWidth: '140px' }}
                      >
                        <option value="default">デフォルト</option>
                        <option value="rating">評価が高い順</option>
                        <option value="distance">距離が近い順</option>
                        <option value="price-low">価格が安い順</option>
                        <option value="price-high">価格が高い順</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* レストランカード */}
              {sortedAndFilteredRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedAndFilteredRestaurants.map((restaurant) => (
                    <RestaurantCard 
                      key={restaurant.id} 
                      restaurant={restaurant}
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <p className="text-gray-600">
                    絞り込み条件に一致するレストランが見つかりませんでした。
                  </p>
                  <button
                    onClick={() => setFilterKeyword('')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    絞り込みをクリア
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}