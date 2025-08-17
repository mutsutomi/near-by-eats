import { GET } from './route';
import { NextRequest } from 'next/server';

// NextResponse のモック
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

// モックの設定
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// NextRequest のヘルパー関数
const createMockRequest = (url: string) => {
  return {
    url,
    method: 'GET',
    headers: new Headers(),
  } as NextRequest;
};

describe('/api/places/[id] API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 環境変数をクリア
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  describe('GET /api/places/[id]', () => {
    it('should return demo data when API key is not set', async () => {
      const request = createMockRequest('http://localhost:3000/api/places/demo-1');
      const params = { id: 'demo-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('OK');
      expect(data.restaurant).toBeDefined();
      expect(data.restaurant.id).toBe('demo-1');
      expect(data.restaurant.name).toBe('和食レストラン 花月');
      expect(data.restaurant.reviews).toBeDefined();
      expect(data.restaurant.opening_hours.weekday_text).toBeDefined();
    });

    it('should return NOT_FOUND for invalid demo place ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/places/invalid-id');
      const params = { id: 'invalid-id' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('NOT_FOUND');
      expect(data.restaurant).toBeNull();
      expect(data.error_message).toBe('レストランが見つかりませんでした');
    });

    it('should return error when place ID is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/places/');
      const params = { id: '' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('ERROR');
      expect(data.error_message).toBe('プレイスIDが必要です');
    });

    it('should call Google Places API when API key is set', async () => {
      // 環境変数を設定する前にモジュールを再読み込み
      jest.resetModules();
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
      const { GET } = require('./route');
      
      const mockApiResponse = {
        status: 'OK',
        result: {
          place_id: 'test-place-id',
          name: 'Test Restaurant',
          rating: 4.5,
          formatted_address: 'Test Address',
          formatted_phone_number: '03-1234-5678',
          website: 'https://example.com',
          opening_hours: {
            open_now: true,
            weekday_text: ['月曜日: 11:00～22:00']
          },
          price_level: 2,
          geometry: {
            location: { lat: 35.658584, lng: 139.701334 }
          },
          types: ['restaurant'],
          photos: [],
          reviews: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const request = createMockRequest('http://localhost:3000/api/places/test-place-id');
      const params = { id: 'test-place-id' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://maps.googleapis.com/maps/api/place/details/json')
      );
      expect(response.status).toBe(200);
      expect(data.status).toBe('OK');
      expect(data.restaurant.name).toBe('Test Restaurant');
    });

    it('should handle Google Places API errors', async () => {
      jest.resetModules();
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
      const { GET } = require('./route');
      
      const mockApiResponse = {
        status: 'NOT_FOUND',
        error_message: 'Place not found'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const request = createMockRequest('http://localhost:3000/api/places/invalid-place-id');
      const params = { id: 'invalid-place-id' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('NOT_FOUND');
      expect(data.restaurant).toBeNull();
      expect(data.error_message).toBe('Place not found');
    });

    it('should handle network errors', async () => {
      jest.resetModules();
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
      const { GET } = require('./route');
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = createMockRequest('http://localhost:3000/api/places/test-place-id');
      const params = { id: 'test-place-id' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('ERROR');
      expect(data.error_message).toBe('サーバーエラーが発生しました');
    });
  });
});