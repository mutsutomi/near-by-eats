import { Restaurant } from '@/types';
import { calculateDistance, formatDistance } from '@/utils/distance';

interface RestaurantCardProps {
  restaurant: Restaurant;
  userLocation?: { latitude: number; longitude: number } | null;
}

const RestaurantCard = ({ restaurant, userLocation }: RestaurantCardProps) => {
  const { name, rating, address, opening_hours, price_level, geometry } = restaurant;

  const getDistance = () => {
    if (!userLocation || !geometry?.location) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      geometry.location.lat,
      geometry.location.lng
    );
    
    return formatDistance(distance);
  };

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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {name}
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {rating !== undefined && rating !== null ? (
                <>
                  <div className="flex items-center" aria-label={`評価: 5つ星中${rating}つ星`}>
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {rating.toFixed(1)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">評価なし</span>
              )}
            </div>
            
            {price_level && (
              <div className="flex items-center" aria-label={`価格帯: ${price_level}段階`}>
                <span className="text-sm font-medium text-green-600">
                  {renderPriceLevel(price_level)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 mb-3">
            <p className="text-gray-600 text-sm line-clamp-2">
              {address}
            </p>
            {getDistance() && (
              <div className="flex items-center gap-1 text-blue-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {getDistance()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {opening_hours && (
            <div className={`flex items-center gap-1 ${
              opening_hours.open_now ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                opening_hours.open_now ? 'bg-green-600' : 'bg-red-600'
              }`} />
              <span className="text-xs font-medium">
                {opening_hours.open_now ? '営業中' : '営業時間外'}
              </span>
            </div>
          )}
          
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
            aria-label={`${name}の詳細を表示`}
          >
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;