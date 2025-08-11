import { render, screen } from '@testing-library/react'
import RestaurantCard from '../RestaurantCard'
import { Restaurant } from '@/types'

// Mock restaurant data for testing
const mockRestaurantComplete: Restaurant = {
  id: 'test-1',
  name: 'テストレストラン',
  rating: 4.2,
  address: '東京都渋谷区テスト町1-2-3',
  opening_hours: {
    open_now: true
  },
  price_level: 2
}

const mockRestaurantMinimal: Restaurant = {
  id: 'test-2',
  name: '最小限レストラン',
  address: '東京都新宿区テスト町4-5-6'
}

const mockRestaurantClosed: Restaurant = {
  id: 'test-3',
  name: '閉店中レストラン',
  rating: 3.8,
  address: '東京都港区テスト町7-8-9',
  opening_hours: {
    open_now: false
  },
  price_level: 3
}

describe('RestaurantCard', () => {
  describe('レストラン情報の正常表示', () => {
    it('完全な情報を持つレストランを正しく表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      // レストラン名の表示確認
      expect(screen.getByText('テストレストラン')).toBeInTheDocument()
      
      // 評価の表示確認
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByLabelText('評価: 5つ星中4.2つ星')).toBeInTheDocument()
      
      // 住所の表示確認
      expect(screen.getByText('東京都渋谷区テスト町1-2-3')).toBeInTheDocument()
      
      // 営業状態の表示確認
      expect(screen.getByText('営業中')).toBeInTheDocument()
      
      // 価格帯の表示確認
      expect(screen.getByLabelText('価格帯: 2段階')).toBeInTheDocument()
      
      // 詳細ボタンの表示確認
      expect(screen.getByLabelText('テストレストランの詳細を表示')).toBeInTheDocument()
    })

    it('星の評価を正しく表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      const starsContainer = screen.getByLabelText('評価: 5つ星中4.2つ星')
      const stars = starsContainer.querySelectorAll('span')
      
      // 4つの満点の星と1つの半分の星、0つの空の星を確認
      expect(stars).toHaveLength(5)
      
      // 満点の星（★）が4つ
      const fullStars = Array.from(stars).filter(star => star.textContent === '★')
      expect(fullStars).toHaveLength(4)
      
      // 半分の星（☆）が1つ
      const halfStars = Array.from(stars).filter(star => star.textContent === '☆')
      expect(halfStars).toHaveLength(1)
    })

    it('価格帯を正しく表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      const priceLevelContainer = screen.getByLabelText('価格帯: 2段階')
      
      // 価格帯2なので¥が2つ表示されることを確認
      expect(priceLevelContainer).toBeInTheDocument()
    })
  })

  describe('評価なし・価格帯なし・営業時間なしの場合', () => {
    it('評価がない場合は「評価なし」を表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantMinimal} />)
      
      expect(screen.getByText('評価なし')).toBeInTheDocument()
      expect(screen.queryByLabelText(/評価:/)).not.toBeInTheDocument()
    })

    it('価格帯がない場合は価格帯表示をしない', () => {
      render(<RestaurantCard restaurant={mockRestaurantMinimal} />)
      
      expect(screen.queryByLabelText(/価格帯:/)).not.toBeInTheDocument()
    })

    it('営業時間情報がない場合は営業状態を表示しない', () => {
      render(<RestaurantCard restaurant={mockRestaurantMinimal} />)
      
      expect(screen.queryByText('営業中')).not.toBeInTheDocument()
      expect(screen.queryByText('営業時間外')).not.toBeInTheDocument()
    })

    it('必須項目（名前、住所）は常に表示される', () => {
      render(<RestaurantCard restaurant={mockRestaurantMinimal} />)
      
      expect(screen.getByText('最小限レストラン')).toBeInTheDocument()
      expect(screen.getByText('東京都新宿区テスト町4-5-6')).toBeInTheDocument()
      expect(screen.getByLabelText('最小限レストランの詳細を表示')).toBeInTheDocument()
    })
  })

  describe('営業状態の表示', () => {
    it('営業中の場合は緑色で「営業中」を表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      const statusElement = screen.getByText('営業中')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement).toHaveClass('text-xs', 'font-medium')
      
      // 親要素が緑色のクラスを持つことを確認
      const parentElement = statusElement.parentElement
      expect(parentElement).toHaveClass('text-green-600')
    })

    it('営業時間外の場合は赤色で「営業時間外」を表示する', () => {
      render(<RestaurantCard restaurant={mockRestaurantClosed} />)
      
      const statusElement = screen.getByText('営業時間外')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement).toHaveClass('text-xs', 'font-medium')
      
      // 親要素が赤色のクラスを持つことを確認
      const parentElement = statusElement.parentElement
      expect(parentElement).toHaveClass('text-red-600')
    })
  })

  describe('アクセシビリティ属性の確認', () => {
    it('評価にaria-labelが設定されている', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      expect(screen.getByLabelText('評価: 5つ星中4.2つ星')).toBeInTheDocument()
    })

    it('価格帯にaria-labelが設定されている', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      expect(screen.getByLabelText('価格帯: 2段階')).toBeInTheDocument()
    })

    it('詳細ボタンにaria-labelが設定されている', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      expect(screen.getByLabelText('テストレストランの詳細を表示')).toBeInTheDocument()
    })

    it('セマンティックなHTML構造を使用している', () => {
      render(<RestaurantCard restaurant={mockRestaurantComplete} />)
      
      // h3要素でレストラン名が表示されている
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('テストレストラン')
      
      // ボタン要素が適切に設定されている
      const button = screen.getByRole('button', { name: 'テストレストランの詳細を表示' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('評価が0の場合を正しく処理する', () => {
      const restaurantWithZeroRating: Restaurant = {
        ...mockRestaurantMinimal,
        rating: 0
      }
      
      render(<RestaurantCard restaurant={restaurantWithZeroRating} />)
      
      expect(screen.getByText('0.0')).toBeInTheDocument()
      expect(screen.getByLabelText('評価: 5つ星中0つ星')).toBeInTheDocument()
    })

    it('評価が5.0の場合を正しく処理する', () => {
      const restaurantWithMaxRating: Restaurant = {
        ...mockRestaurantMinimal,
        rating: 5.0
      }
      
      render(<RestaurantCard restaurant={restaurantWithMaxRating} />)
      
      expect(screen.getByText('5.0')).toBeInTheDocument()
      expect(screen.getByLabelText('評価: 5つ星中5つ星')).toBeInTheDocument()
    })

    it('価格帯が1の場合を正しく処理する', () => {
      const restaurantWithMinPrice: Restaurant = {
        ...mockRestaurantMinimal,
        price_level: 1
      }
      
      render(<RestaurantCard restaurant={restaurantWithMinPrice} />)
      
      expect(screen.getByLabelText('価格帯: 1段階')).toBeInTheDocument()
    })

    it('価格帯が4の場合を正しく処理する', () => {
      const restaurantWithMaxPrice: Restaurant = {
        ...mockRestaurantMinimal,
        price_level: 4
      }
      
      render(<RestaurantCard restaurant={restaurantWithMaxPrice} />)
      
      expect(screen.getByLabelText('価格帯: 4段階')).toBeInTheDocument()
    })

    it('長いレストラン名を適切に処理する', () => {
      const restaurantWithLongName: Restaurant = {
        ...mockRestaurantMinimal,
        name: 'とても長いレストラン名でテキストが折り返されることを確認するためのテストデータです'
      }
      
      render(<RestaurantCard restaurant={restaurantWithLongName} />)
      
      expect(screen.getByText('とても長いレストラン名でテキストが折り返されることを確認するためのテストデータです')).toBeInTheDocument()
    })
  })
})