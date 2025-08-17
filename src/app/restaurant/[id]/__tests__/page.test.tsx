import { render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import RestaurantDetailPage from '../page';

// Next.js のモック
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// fetch のモック
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockPush = jest.fn();
const mockBack = jest.fn();

describe('RestaurantDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'demo-1' });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // 永続的にpending

    render(<RestaurantDetailPage />);

    expect(screen.getByText('レストラン詳細を読み込み中...')).toBeInTheDocument();
    expect(screen.getByText('しばらくお待ちください')).toBeInTheDocument();
  });

  it('should display restaurant details when data is loaded successfully', async () => {
    const mockRestaurant = {
      id: 'demo-1',
      name: '和食レストラン 花月',
      rating: 4.2,
      address: '東京都渋谷区渋谷1-1-1',
      opening_hours: {
        open_now: true,
        weekday_text: [
          '月曜日: 11:30～14:00, 17:30～22:00',
          '火曜日: 11:30～14:00, 17:30～22:00'
        ]
      },
      price_level: 2,
      formatted_phone_number: '03-1234-5678',
      website: 'https://example.com/kagetsu',
      reviews: [
        {
          author_name: '田中太郎',
          rating: 5,
          text: '素晴らしい和食レストランです。',
          time: 1703123456
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        restaurant: mockRestaurant
      }),
    } as Response);

    render(<RestaurantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('和食レストラン 花月')).toBeInTheDocument();
    });

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('東京都渋谷区渋谷1-1-1')).toBeInTheDocument();
    expect(screen.getByText('営業中')).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('公式サイトを開く')).toBeInTheDocument();
    expect(screen.getByText('営業時間')).toBeInTheDocument();
    expect(screen.getByText('レビュー')).toBeInTheDocument();
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('素晴らしい和食レストランです。')).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ERROR',
        error_message: 'レストラン詳細の取得に失敗しました'
      }),
    } as Response);

    render(<RestaurantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    expect(screen.getByText('レストラン詳細の取得に失敗しました')).toBeInTheDocument();
  });

  it('should display error message when network error occurs', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<RestaurantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    expect(screen.getByText('レストラン詳細の取得中にエラーが発生しました')).toBeInTheDocument();
  });

  it('should call router.back when back button is clicked', async () => {
    const mockRestaurant = {
      id: 'demo-1',
      name: '和食レストラン 花月',
      rating: 4.2,
      address: '東京都渋谷区渋谷1-1-1',
      opening_hours: { open_now: true },
      price_level: 2
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        restaurant: mockRestaurant
      }),
    } as Response);

    render(<RestaurantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('和食レストラン 花月')).toBeInTheDocument();
    });

    const backButton = screen.getByText('戻る');
    backButton.click();

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should handle restaurant without optional fields', async () => {
    const mockRestaurant = {
      id: 'demo-1',
      name: 'シンプルレストラン',
      address: '東京都渋谷区渋谷1-1-1'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        restaurant: mockRestaurant
      }),
    } as Response);

    render(<RestaurantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('シンプルレストラン')).toBeInTheDocument();
    });

    expect(screen.getByText('東京都渋谷区渋谷1-1-1')).toBeInTheDocument();
    // オプショナルフィールドが表示されないことを確認
    expect(screen.queryByText('営業時間')).not.toBeInTheDocument();
    expect(screen.queryByText('レビュー')).not.toBeInTheDocument();
  });
});