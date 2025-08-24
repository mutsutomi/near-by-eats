export interface Restaurant {
  id: string;
  name: string;
  rating?: number;
  address: string;
  vicinity?: string;
  place_id?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  opening_hours?: {
    open_now: boolean;
  };
  price_level?: number;
}

export interface PlacesApiRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  language?: string;
  query?: string; // フリーワード検索クエリ
}

export interface PlacesApiResponse {
  restaurants: Restaurant[];
  status: 'OK' | 'ZERO_RESULTS' | 'ERROR' | 'REQUEST_DENIED' | 'OVER_QUERY_LIMIT' | 'INVALID_REQUEST' | 'NOT_FOUND';
  error_message?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

// Suggestion Engine Types
export interface SuggestionCriteria {
  location: { lat: number; lng: number };
  timeContext: {
    hour: number;
    dayOfWeek: number;
    isHoliday: boolean;
  };
  userPreferences?: {
    recentVisits?: string[];
    avoidCategories?: string[];
  };
  groupSize?: number;
}

export interface ScoredRestaurant extends Restaurant {
  score: number;
  distances?: {
    physical: number;
    walking: number;
  };
  scoreBreakdown?: {
    distance: number;
    rating: number;
    timeRelevance: number;
    diversity: number;
  };
}

export interface SuggestionResult {
  restaurants: Restaurant[];
  metadata: {
    totalSearched: number;
    diversityScore: number;
    averageDistance: number;
    generatedAt: number;
  };
}