import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// デモ画像の代替
const DEMO_PHOTOS: Record<string, string> = {
  'demo_photo_1_japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format',
  'demo_photo_2_japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format',
  'demo_photo_3_japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format',
  
  'demo_photo_1_italian': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&auto=format',
  'demo_photo_2_italian': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop&auto=format',
  
  'demo_photo_1_cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&auto=format',
  'demo_photo_2_cafe': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop&auto=format',
  'demo_photo_3_cafe': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop&auto=format',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;
    const { searchParams } = new URL(request.url);
    const maxwidth = searchParams.get('maxwidth') || '800';

    console.log('Photo request for reference:', reference);

    // デモモードまたはAPIキー未設定の場合
    if (!GOOGLE_MAPS_API_KEY || reference.startsWith('demo_')) {
      console.log('Using demo photo for reference:', reference);
      
      const demoImageUrl = DEMO_PHOTOS[reference];
      if (demoImageUrl) {
        // Unsplash画像にリダイレクト
        return NextResponse.redirect(demoImageUrl);
      } else {
        // フォールバック画像
        const fallbackUrl = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&auto=format';
        return NextResponse.redirect(fallbackUrl);
      }
    }

    // 実際のGoogle Places Photo API呼び出し
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${reference}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Fetching photo from:', photoUrl);

    const photoResponse = await fetch(photoUrl);
    
    if (!photoResponse.ok) {
      console.error('Photo API error:', photoResponse.status, photoResponse.statusText);
      // エラー時はフォールバック画像
      const fallbackUrl = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&auto=format';
      return NextResponse.redirect(fallbackUrl);
    }

    // 画像データをそのまま返す
    const imageData = await photoResponse.arrayBuffer();
    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
      },
    });

  } catch (error) {
    console.error('Photo fetch error:', error);
    
    // エラー時はフォールバック画像にリダイレクト
    const fallbackUrl = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&auto=format';
    return NextResponse.redirect(fallbackUrl);
  }
}