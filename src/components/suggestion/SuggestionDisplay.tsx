'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Restaurant, SuggestionCriteria, SuggestionResult, LocationError } from '@/types';
import { RestaurantSuggestionEngine } from '@/lib/suggestion/suggestionEngine';
import SuggestionCard from './SuggestionCard';
import LoadingAnimation from './LoadingAnimation';

interface SuggestionDisplayProps {
  onRestaurantSelect?: (restaurant: Restaurant) => void;
}

export default function SuggestionDisplay({ onRestaurantSelect }: SuggestionDisplayProps) {
  const [suggestions, setSuggestions] = useState<Restaurant[]>([]);
  const [metadata, setMetadata] = useState<SuggestionResult['metadata'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const suggestionEngine = new RestaurantSuggestionEngine();

  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('位置情報がサポートされていません'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let message = '位置情報の取得に失敗しました';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '位置情報の取得が拒否されました。ブラウザの設定を確認してください。';
              break;
            case error.POSITION_UNAVAILABLE:
              message = '位置情報が取得できませんでした。';
              break;
            case error.TIMEOUT:
              message = '位置情報の取得がタイムアウトしました。';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5分間はキャッシュを使用
        }
      );
    });
  };

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // フェーズ1: 位置情報取得
      setLoadingPhase('位置情報を取得中...');
      const location = await getCurrentLocation();
      setUserLocation(location);
      
      // フェーズ2: おすすめ選定
      setLoadingPhase('おすすめを選定中...');
      
      const now = new Date();
      const criteria: SuggestionCriteria = {
        location,
        timeContext: {
          hour: now.getHours(),
          dayOfWeek: now.getDay(),
          isHoliday: now.getDay() === 0 || now.getDay() === 6, // 簡易的な休日判定
        },
        groupSize: 1, // 今後拡張予定
      };

      const result = await suggestionEngine.generateSmartSuggestions(criteria);
      
      if (result.restaurants.length === 0) {
        setError('近くにレストランが見つかりませんでした。範囲を広げて再検索することをお勧めします。');
      } else {
        setSuggestions(result.restaurants);
        setMetadata(result.metadata);
      }
    } catch (err) {
      console.error('Suggestion generation error:', err);
      setError(err instanceof Error ? err.message : '提案の生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const handleSelection = (restaurant: Restaurant) => {
    onRestaurantSelect?.(restaurant);
    // 将来的にここで学習データを記録
  };

  const handleRetry = () => {
    setError('');
    setSuggestions([]);
    setMetadata(null);
    setUserLocation(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* タイトル */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          今すぐ行ける3つの店
        </h1>
        <p className="text-gray-600 text-lg">
          AIが厳選した最適な選択肢
        </p>
        {metadata && (
          <p className="text-sm text-gray-500 mt-2">
            {metadata.totalSearched}件から選出 • 多様性スコア: {Math.round(metadata.diversityScore * 100)}%
          </p>
        )}
      </motion.div>
      
      {/* ローディング状態 */}
      {isLoading && (
        <LoadingAnimation phase={loadingPhase} />
      )}
      
      {/* エラー表示 */}
      {error && !isLoading && (
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            エラーが発生しました
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors duration-200"
          >
            再試行
          </button>
        </motion.div>
      )}
      
      {/* 提案結果表示 */}
      {suggestions.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {suggestions.map((restaurant, index) => (
              <SuggestionCard
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
                userLocation={userLocation}
                onSelect={() => handleSelection(restaurant)}
              />
            ))}
          </div>
          
          {/* 再提案ボタン */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <button
              onClick={generateSuggestions}
              className="px-8 py-3 bg-white border-2 border-gray-300 
                       rounded-full hover:bg-gray-50 hover:border-gray-400 
                       transition-all duration-200 font-medium text-gray-700 
                       shadow-sm hover:shadow-md"
            >
              <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              他の選択肢を見る
            </button>
            <p className="text-sm text-gray-500 mt-2">
              新しい3つの提案を生成します
            </p>
          </motion.div>
        </motion.div>
      )}
      
      {/* 初回表示（何もない状態） */}
      {suggestions.length === 0 && !isLoading && !error && (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            お昼どこにする？を解決
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
            位置情報をもとに、AIが最適な3つのレストランを提案します。<br />
            もう迷う必要はありません。
          </p>
          <button
            onClick={generateSuggestions}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 
                     hover:from-blue-700 hover:to-indigo-700 text-white rounded-full 
                     font-semibold text-lg transition-all duration-200 
                     shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            提案を受ける
          </button>
        </motion.div>
      )}
    </div>
  );
}