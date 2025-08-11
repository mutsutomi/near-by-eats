import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationButton from '../LocationButton'
import { LocationError } from '@/types'

// Mock functions for testing
const mockOnLocationSuccess = jest.fn()
const mockOnLocationError = jest.fn()

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

// Setup geolocation mock
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

describe('LocationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGeolocation.getCurrentPosition.mockClear()
  })

  describe('基本的な表示とアクセシビリティ', () => {
    it('初期状態で正しく表示される', () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button', { name: '現在地から近くのレストランを検索' })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
      expect(screen.getByText('現在地から検索')).toBeInTheDocument()
      
      // SVGアイコンが表示されていることを確認
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('適切なaria-labelが設定されている', () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      expect(screen.getByLabelText('現在地から近くのレストランを検索')).toBeInTheDocument()
    })

    it('disabled propがtrueの場合、ボタンが無効化される', () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
          disabled={true}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed')
    })
  })

  describe('位置情報取得成功時の動作', () => {
    it('位置情報取得成功時にonLocationSuccessが呼ばれる', async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        success(mockPosition)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )

      expect(mockOnLocationSuccess).toHaveBeenCalledWith(35.6762, 139.6503)
      expect(mockOnLocationError).not.toHaveBeenCalled()
    })

    it('位置情報取得中はローディング状態を表示する', async () => {
      let resolvePosition: (position: any) => void

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        return new Promise((resolve) => {
          resolvePosition = () => {
            success({
              coords: { latitude: 35.6762, longitude: 139.6503 }
            })
            resolve(undefined)
          }
        })
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      // ローディング状態の確認
      expect(screen.getByText('位置情報を取得中...')).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed')
      
      // スピナーアイコンが表示されていることを確認
      const spinner = button.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()

      // 位置情報取得完了後の状態確認
      resolvePosition!()
      
      await waitFor(() => {
        expect(screen.queryByText('位置情報を取得中...')).not.toBeInTheDocument()
        expect(screen.getByText('現在地から検索')).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('位置情報エラーケースの処理', () => {
    it('位置情報がサポートされていない場合のエラー処理', async () => {
      // geolocationを一時的にundefinedに設定
      const originalGeolocation = global.navigator.geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockOnLocationError).toHaveBeenCalledWith({
        code: -1,
        message: 'このブラウザは位置情報をサポートしていません'
      })
      expect(mockOnLocationSuccess).not.toHaveBeenCalled()

      // geolocationを復元
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      })
    })

    it('位置情報の取得が拒否された場合のエラー処理', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockOnLocationError).toHaveBeenCalledWith({
        code: 1,
        message: '位置情報の取得が拒否されました。ブラウザの設定で位置情報を許可してください。'
      })
      expect(mockOnLocationSuccess).not.toHaveBeenCalled()
    })

    it('位置情報が利用できない場合のエラー処理', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockOnLocationError).toHaveBeenCalledWith({
        code: 2,
        message: '位置情報を取得できませんでした。'
      })
    })

    it('位置情報取得がタイムアウトした場合のエラー処理', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockOnLocationError).toHaveBeenCalledWith({
        code: 3,
        message: '位置情報の取得がタイムアウトしました。'
      })
    })

    it('不明なエラーの場合のエラー処理', async () => {
      const mockError = {
        code: 999, // 不明なエラーコード
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(mockOnLocationError).toHaveBeenCalledWith({
        code: 999,
        message: '位置情報の取得中にエラーが発生しました。'
      })
    })

    it('エラー発生後にローディング状態が解除される', async () => {
      const mockError = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError)
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      // エラー後にローディング状態が解除されることを確認
      await waitFor(() => {
        expect(screen.queryByText('位置情報を取得中...')).not.toBeInTheDocument()
        expect(screen.getByText('現在地から検索')).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('ローディング状態とボタン無効化', () => {
    it('ローディング中はボタンが無効化される', async () => {
      let resolvePosition: (position: any) => void

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        return new Promise((resolve) => {
          resolvePosition = () => {
            success({
              coords: { latitude: 35.6762, longitude: 139.6503 }
            })
            resolve(undefined)
          }
        })
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      
      // 初期状態では有効
      expect(button).not.toBeDisabled()
      
      // クリック後は無効化
      await userEvent.click(button)
      expect(button).toBeDisabled()
      
      // 完了後は再び有効化
      resolvePosition!()
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('disabled propとローディング状態が両方適用される', async () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
          disabled={true}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed')
    })

    it('ローディング中に複数回クリックしても1回だけ処理される', async () => {
      let resolvePosition: (position: any) => void

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
        return new Promise((resolve) => {
          resolvePosition = () => {
            success({
              coords: { latitude: 35.6762, longitude: 139.6503 }
            })
            resolve(undefined)
          }
        })
      })

      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      
      // 複数回クリック
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)

      // getCurrentPositionは1回だけ呼ばれる
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1)

      resolvePosition!()
      await waitFor(() => {
        expect(mockOnLocationSuccess).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('キーボードアクセシビリティ', () => {
    it('フォーカス可能で適切なフォーカススタイルが適用される', () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      // ボタンはデフォルトでフォーカス可能
      expect(button.tabIndex).not.toBe(-1)
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2')
    })

    it('ボタンとしてスクリーンリーダーに認識される', () => {
      render(
        <LocationButton
          onLocationSuccess={mockOnLocationSuccess}
          onLocationError={mockOnLocationError}
        />
      )

      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('aria-label', '現在地から近くのレストランを検索')
    })
  })
})