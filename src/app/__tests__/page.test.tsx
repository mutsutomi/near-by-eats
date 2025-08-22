import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../page'
import { PlacesApiResponse, Restaurant } from '@/types'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console.error to avoid noise in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock restaurant data for testing
const mockRestaurants: Restaurant[] = [
  {
    id: 'test-1',
    name: 'テストレストラン1',
    rating: 4.2,
    address: '東京都渋谷区テスト町1-1-1',
    vicinity: '渋谷区',
    place_id: 'test-place-1',
    geometry: {
      location: { lat: 35.6762, lng: 139.6503 }
    },
    types: ['restaurant', 'food'],
    opening_hours: { open_now: true },
    price_level: 2
  },
  {
    id: 'test-2',
    name: 'テストレストラン2',
    rating: 3.8,
    address: '東京都新宿区テスト町2-2-2',
    vicinity: '新宿区',
    place_id: 'test-place-2',
    geometry: {
      location: { lat: 35.6895, lng: 139.6917 }
    },
    types: ['restaurant', 'food'],
    opening_hours: { open_now: false },
    price_level: 1
  }
]

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('初期表示', () => {
    it('初期状態で正しく表示される', () => {
      render(<Home />)

      // タイトルとサブタイトルの確認
      expect(screen.getByText('Near-by Eats')).toBeInTheDocument()
      expect(screen.getByText('現在地から近くのレストランを見つけます')).toBeInTheDocument()

      // 初期状態のコンテンツ確認
      expect(screen.getByText('レストランを検索')).toBeInTheDocument()
      expect(screen.getByText('現在地から近くのレストランを検索します')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '現在地から近くのレストランを検索' })).toBeInTheDocument()
      
      // キーワード検索フィールドの確認
      expect(screen.getByText('キーワード検索（ジャンル・料理名など）')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('例: ラーメン、イタリアン、寿司')).toBeInTheDocument()
    })

    it('LocationButtonが正しく表示される', () => {
      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      expect(locationButton).toBeInTheDocument()
      expect(locationButton).not.toBeDisabled()
      expect(screen.getByText('現在地から検索')).toBeInTheDocument()
    })
  })

  describe('位置情報取得からレストラン表示までの完全フロー', () => {
    it('成功フロー: 位置情報取得 → API呼び出し → レストラン表示', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock successful API response
      const mockApiResponse: PlacesApiResponse = {
        restaurants: mockRestaurants,
        status: 'OK'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      // 位置情報取得ボタンをクリック
      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // API呼び出しが正しく行われることを確認
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/places', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.6762,
            longitude: 139.6503,
            language: 'ja',
            query: ''
          }),
        })
      })

      // レストラン表示の確認
      await waitFor(() => {
        expect(screen.getByText('近くのレストラン (2件)')).toBeInTheDocument()
        expect(screen.getByText('現在地から近くのレストラン')).toBeInTheDocument()
      })

      // 各レストランカードの表示確認
      expect(screen.getByText('テストレストラン1')).toBeInTheDocument()
      expect(screen.getByText('テストレストラン2')).toBeInTheDocument()
      expect(screen.getByText('東京都渋谷区テスト町1-1-1')).toBeInTheDocument()
      expect(screen.getByText('東京都新宿区テスト町2-2-2')).toBeInTheDocument()

      // 再検索ボタンの表示確認
      expect(screen.getByRole('button', { name: '再検索' })).toBeInTheDocument()
    })

    it('レストランが0件の場合の処理', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock API response with no restaurants
      const mockApiResponse: PlacesApiResponse = {
        restaurants: [],
        status: 'OK'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // エラー状態の表示確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('近くにレストランが見つかりませんでした')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })
    })
  })

  describe('エラー状態とリトライ機能', () => {
    it('位置情報取得エラーの処理', async () => {
      // Mock geolocation error
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => error(mockError))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // エラー状態の表示確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('位置情報の取得が拒否されました。ブラウザの設定で位置情報を許可してください。')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })
    })

    it('API呼び出しエラーの処理', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock API error response
      const mockApiResponse: PlacesApiResponse = {
        restaurants: [],
        status: 'ERROR',
        error_message: 'APIエラーが発生しました'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // エラー状態の表示確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('APIエラー: APIエラーが発生しました')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })
    })

    it('ネットワークエラーの処理', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // エラー状態の表示確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('レストランの検索中にエラーが発生しました')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })

      // console.errorが呼ばれることを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('Search error:', expect.any(Error))
    })

    it('HTTPエラーレスポンスの処理', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock HTTP error response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // エラー状態の表示確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('レストランの検索中にエラーが発生しました')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })
    })

    it('リトライ機能が正しく動作する', async () => {
      // Mock geolocation error first
      const mockError = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => error(mockError))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      render(<Home />)

      // 最初のエラー
      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      })

      // リトライボタンをクリック
      const retryButton = screen.getByRole('button', { name: 'もう一度試す' })
      await userEvent.click(retryButton)

      // 初期状態に戻ることを確認
      expect(screen.getByText('レストランを検索')).toBeInTheDocument()
      expect(screen.getByText('現在地から近くのレストランを検索します')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '現在地から近くのレストランを検索' })).toBeInTheDocument()
    })

    it('成功状態からのリトライ機能', async () => {
      // Mock successful flow first
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      const mockApiResponse: PlacesApiResponse = {
        restaurants: mockRestaurants,
        status: 'OK'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      // 成功フローを実行
      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      await waitFor(() => {
        expect(screen.getByText('近くのレストラン (2件)')).toBeInTheDocument()
      })

      // 再検索ボタンをクリック
      const retryButton = screen.getByRole('button', { name: '再検索' })
      await userEvent.click(retryButton)

      // 初期状態に戻ることを確認
      expect(screen.getByText('レストランを検索')).toBeInTheDocument()
      expect(screen.getByText('現在地から近くのレストランを検索します')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '現在地から近くのレストランを検索' })).toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    it('レストラン検索中のローディング表示', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock delayed API response
      let resolveApiCall: (value: any) => void
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValueOnce(apiPromise)

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // ローディング状態の確認
      await waitFor(() => {
        expect(screen.getByText('レストランを検索中...')).toBeInTheDocument()
        expect(screen.getByText('しばらくお待ちください')).toBeInTheDocument()
      })

      // スピナーの確認
      const spinner = screen.getByText('レストランを検索中...').parentElement?.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()

      // API呼び出しを完了
      resolveApiCall!({
        ok: true,
        json: () => Promise.resolve({
          restaurants: mockRestaurants,
          status: 'OK'
        })
      })

      // ローディングが終了してレストランが表示されることを確認
      await waitFor(() => {
        expect(screen.queryByText('レストランを検索中...')).not.toBeInTheDocument()
        expect(screen.getByText('近くのレストラン (2件)')).toBeInTheDocument()
      })
    })
  })

  describe('レスポンシブレイアウト', () => {
    it('レストランカードがグリッドレイアウトで表示される', async () => {
      // Mock successful flow
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      const mockApiResponse: PlacesApiResponse = {
        restaurants: mockRestaurants,
        status: 'OK'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      await waitFor(() => {
        expect(screen.getByText('近くのレストラン (2件)')).toBeInTheDocument()
      })

      // グリッドコンテナの確認
      const gridContainer = screen.getByText('テストレストラン1').closest('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')
    })

    it('メインコンテナが適切な最大幅を持つ', async () => {
      // Mock successful flow
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      const mockApiResponse: PlacesApiResponse = {
        restaurants: mockRestaurants,
        status: 'OK'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      await waitFor(() => {
        expect(screen.getByText('近くのレストラン (2件)')).toBeInTheDocument()
      })

      // メインコンテナの最大幅確認
      const mainContainer = screen.getByText('近くのレストラン (2件)').closest('.max-w-6xl')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なheading構造を持つ', () => {
      render(<Home />)

      // h1要素の確認
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Near-by Eats')

      // h2要素の確認
      const subHeading = screen.getByRole('heading', { level: 2 })
      expect(subHeading).toHaveTextContent('レストランを検索')
    })

    it('ボタンに適切なaria-labelが設定されている', () => {
      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      expect(locationButton).toHaveAttribute('aria-label', '現在地から近くのレストランを検索')
    })

    it('エラー状態でも適切なheading構造を維持する', async () => {
      // Mock geolocation error
      const mockError = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => error(mockError))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      })

      // エラー状態でもh1とh2が存在することを確認
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Near-by Eats')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('エラーが発生しました')
    })

    it('Google Places API REQUEST_DENIED エラーの処理', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition))
      }
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      })

      // Mock API error response for REQUEST_DENIED
      const mockApiResponse: PlacesApiResponse = {
        restaurants: [],
        status: 'REQUEST_DENIED',
        error_message: 'The provided API key is invalid.'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      render(<Home />)

      const locationButton = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      await userEvent.click(locationButton)

      // REQUEST_DENIED専用のエラーメッセージを確認
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('Google Places APIキーが無効です。管理者にお問い合わせください。')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument()
      })
    })
  })
})