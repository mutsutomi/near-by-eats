import { Restaurant, SuggestionCriteria, ScoredRestaurant, SuggestionResult } from '@/types';
import { calculateDistance } from '@/utils/distance';

export class RestaurantSuggestionEngine {
  private readonly SUGGESTION_COUNT = 3;
  private readonly SEARCH_RADIUS = 1500; // 既存の1.5km維持
  private readonly MAX_RETRIES = 3;

  async generateSmartSuggestions(
    criteria: SuggestionCriteria
  ): Promise<SuggestionResult> {
    // 1. 既存のPlaces API検索を活用
    const nearbyRestaurants = await this.searchNearby(criteria.location);
    
    if (nearbyRestaurants.length === 0) {
      return {
        restaurants: [],
        metadata: {
          totalSearched: 0,
          diversityScore: 0,
          averageDistance: 0,
          generatedAt: Date.now(),
        },
      };
    }

    // 2. スコアリングアルゴリズム
    const scored = this.calculateScores(nearbyRestaurants, criteria);
    
    // 3. 多様性を考慮した3店舗選択
    const selected = this.selectDiverseTop3(scored);
    
    // 4. メタデータ計算
    const metadata = this.calculateMetadata(selected, nearbyRestaurants, criteria.location);

    return {
      restaurants: selected,
      metadata,
    };
  }

  private async searchNearby(location: { lat: number; lng: number }): Promise<Restaurant[]> {
    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          language: 'ja',
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.restaurants || [];
      } else {
        console.error('Places API error:', data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Search nearby error:', error);
      return [];
    }
  }

  private calculateScores(
    restaurants: Restaurant[],
    criteria: SuggestionCriteria
  ): ScoredRestaurant[] {
    return restaurants.map(restaurant => {
      const scoreBreakdown = {
        distance: this.distanceScore(restaurant, criteria.location),
        rating: this.normalizeRating(restaurant.rating),
        timeRelevance: this.timeScore(restaurant, criteria.timeContext),
        diversity: this.categoryDiversityScore(restaurant),
      };

      const score = this.calculateCompositeScore(scoreBreakdown);

      return {
        ...restaurant,
        score,
        scoreBreakdown,
        distances: this.calculateDistances(restaurant, criteria.location),
      };
    });
  }

  private distanceScore(restaurant: Restaurant, userLocation: { lat: number; lng: number }): number {
    if (!restaurant.geometry?.location) return 0;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      restaurant.geometry.location.lat,
      restaurant.geometry.location.lng
    );

    // 距離スコア: 近いほど高得点 (0-1)
    // 1.5km以内で線形減少
    return Math.max(0, 1 - (distance / this.SEARCH_RADIUS));
  }

  private normalizeRating(rating?: number): number {
    if (!rating) return 0.5; // デフォルト値
    // Googleの評価を0-1に正規化 (5点満点)
    return Math.min(1, rating / 5);
  }

  private timeScore(restaurant: Restaurant, timeContext: SuggestionCriteria['timeContext']): number {
    // 営業時間チェック
    if (restaurant.opening_hours && !restaurant.opening_hours.open_now) {
      return 0.1; // 営業時間外は大幅減点
    }

    // 時間帯による重み付け
    const { hour, dayOfWeek, isHoliday } = timeContext;
    let timeRelevance = 0.8; // ベーススコア

    // ランチタイム(11-14時)の重み付け
    if (hour >= 11 && hour <= 14) {
      timeRelevance += 0.2;
    }

    // ディナータイム(18-21時)の重み付け
    if (hour >= 18 && hour <= 21) {
      timeRelevance += 0.1;
    }

    // 平日・休日による調整
    if (isHoliday && dayOfWeek === 0) { // 日曜日
      timeRelevance *= 0.9;
    }

    return Math.min(1, timeRelevance);
  }

  private categoryDiversityScore(restaurant: Restaurant): number {
    if (!restaurant.types || restaurant.types.length === 0) return 0.5;
    
    // 特定カテゴリに高スコア
    const premiumCategories = ['restaurant', 'meal_takeaway', 'food'];
    const hasGoodCategory = restaurant.types.some(type => 
      premiumCategories.includes(type)
    );

    return hasGoodCategory ? 0.8 : 0.6;
  }

  private calculateCompositeScore(breakdown: {
    distance: number;
    rating: number;
    timeRelevance: number;
    diversity: number;
  }): number {
    // 重み付けした総合スコア
    const weights = {
      distance: 0.35,     // 距離が最重要
      rating: 0.25,       // 評価も重要
      timeRelevance: 0.25, // 時間的関連性
      diversity: 0.15,    // カテゴリ多様性
    };

    return (
      breakdown.distance * weights.distance +
      breakdown.rating * weights.rating +
      breakdown.timeRelevance * weights.timeRelevance +
      breakdown.diversity * weights.diversity
    );
  }

  private selectDiverseTop3(scored: ScoredRestaurant[]): Restaurant[] {
    // 異なるカテゴリから選択するロジック
    const selected: Restaurant[] = [];
    const usedCategories = new Set<string>();
    
    // スコア順にソート
    const sortedByScore = scored.sort((a, b) => b.score - a.score);

    for (const restaurant of sortedByScore) {
      if (selected.length >= this.SUGGESTION_COUNT) break;
      
      const category = this.getMainCategory(restaurant);
      
      // 最初の2つは多様性を重視、3つ目はスコア重視
      if (selected.length < 2) {
        if (!usedCategories.has(category)) {
          selected.push(restaurant);
          usedCategories.add(category);
        }
      } else {
        // 3つ目は純粋にスコアで選択
        selected.push(restaurant);
        break;
      }
    }

    // 3つ揃わなかった場合は、スコア順で補完
    while (selected.length < this.SUGGESTION_COUNT && selected.length < sortedByScore.length) {
      for (const restaurant of sortedByScore) {
        if (!selected.find(s => s.id === restaurant.id)) {
          selected.push(restaurant);
          break;
        }
      }
    }

    return selected;
  }

  private getMainCategory(restaurant: Restaurant): string {
    if (!restaurant.types || restaurant.types.length === 0) return 'unknown';
    
    // カテゴリの優先順位
    const categoryPriority = [
      'restaurant',
      'meal_takeaway',
      'food',
      'cafe',
      'bakery',
      'meal_delivery',
    ];

    for (const priority of categoryPriority) {
      if (restaurant.types.includes(priority)) {
        return priority;
      }
    }

    return restaurant.types[0] || 'unknown';
  }

  private calculateDistances(restaurant: Restaurant, userLocation: { lat: number; lng: number }): {
    physical: number;
    walking: number;
  } {
    if (!restaurant.geometry?.location) {
      return { physical: 0, walking: 0 };
    }

    const physical = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      restaurant.geometry.location.lat,
      restaurant.geometry.location.lng
    );

    // 徒歩時間は直線距離の約1.3倍として計算
    const walking = physical * 1.3;

    return { physical, walking };
  }

  private calculateMetadata(
    selected: Restaurant[],
    allRestaurants: Restaurant[],
    userLocation: { lat: number; lng: number }
  ): SuggestionResult['metadata'] {
    const totalSearched = allRestaurants.length;
    
    // 多様性スコア（異なるカテゴリ数 / 選択数）
    const categories = new Set(
      selected.map(r => this.getMainCategory(r))
    );
    const diversityScore = categories.size / Math.min(selected.length, this.SUGGESTION_COUNT);
    
    // 平均距離
    const averageDistance = selected.reduce((sum, restaurant) => {
      if (!restaurant.geometry?.location) return sum;
      return sum + calculateDistance(
        userLocation.lat,
        userLocation.lng,
        restaurant.geometry.location.lat,
        restaurant.geometry.location.lng
      );
    }, 0) / selected.length;

    return {
      totalSearched,
      diversityScore: Math.round(diversityScore * 100) / 100,
      averageDistance: Math.round(averageDistance),
      generatedAt: Date.now(),
    };
  }
}