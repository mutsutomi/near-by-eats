'use client';

import { useState } from 'react';
import { LocationError } from '@/types';

interface LocationButtonProps {
  onLocationSuccess: (latitude: number, longitude: number) => void;
  onLocationError: (error: LocationError) => void;
  disabled?: boolean;
}

const LocationButton = ({ onLocationSuccess, onLocationError, disabled = false }: LocationButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      onLocationError({
        code: -1,
        message: 'このブラウザは位置情報をサポートしていません'
      });
      return;
    }

    setIsLoading(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        const { latitude, longitude } = position.coords;
        onLocationSuccess(latitude, longitude);
      },
      (error) => {
        setIsLoading(false);
        let message: string;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '位置情報の取得が拒否されました。ブラウザの設定で位置情報を許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置情報を取得できませんでした。';
            break;
          case error.TIMEOUT:
            message = '位置情報の取得がタイムアウトしました。';
            break;
          default:
            message = '位置情報の取得中にエラーが発生しました。';
            break;
        }
        
        onLocationError({
          code: error.code,
          message
        });
      },
      options
    );
  };

  return (
    <button
      onClick={getCurrentLocation}
      disabled={disabled || isLoading}
      className={`
        w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200
        ${isLoading || disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      aria-label="現在地から近くのレストランを検索"
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          位置情報を取得中...
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          現在地から検索
        </div>
      )}
    </button>
  );
};

export default LocationButton;