#!/usr/bin/env node

/**
 * Google Places API の動作確認スクリプト
 * 実際のAPIキーを使用してレストラン検索と詳細取得をテストします
 */

require('dotenv').config({ path: '.env.local' });

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY が設定されていません');
  console.log('📝 .env.local ファイルに実際のAPIキーを設定してください');
  process.exit(1);
}

console.log('🔑 Google Maps API Key:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');

// テスト用の座標（東京駅周辺）
const TEST_LOCATION = {
  latitude: 35.6812,
  longitude: 139.7671,
  radius: 1500
};

async function testNearbySearch() {
  console.log('\n🔍 Nearby Search API をテスト中...');
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${TEST_LOCATION.latitude},${TEST_LOCATION.longitude}&radius=${TEST_LOCATION.radius}&type=restaurant&language=ja&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 API Response Status:', data.status);
    
    if (data.status === 'OK') {
      console.log('✅ Nearby Search API: 成功');
      console.log(`📍 見つかったレストラン数: ${data.results.length}`);
      
      if (data.results.length > 0) {
        const firstRestaurant = data.results[0];
        console.log('\n📋 最初のレストラン情報:');
        console.log(`   名前: ${firstRestaurant.name}`);
        console.log(`   評価: ${firstRestaurant.rating || 'なし'}`);
        console.log(`   住所: ${firstRestaurant.vicinity}`);
        console.log(`   Place ID: ${firstRestaurant.place_id}`);
        
        return firstRestaurant.place_id;
      }
    } else {
      console.error('❌ Nearby Search API エラー:', data.status);
      if (data.error_message) {
        console.error('   エラーメッセージ:', data.error_message);
      }
      
      // よくあるエラーの対処法を表示
      if (data.status === 'REQUEST_DENIED') {
        console.log('\n💡 対処法:');
        console.log('   1. APIキーが正しいか確認してください');
        console.log('   2. Places API が有効化されているか確認してください');
        console.log('   3. APIキーの制限設定を確認してください');
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.log('\n💡 対処法:');
        console.log('   1. API利用制限に達しています');
        console.log('   2. しばらく時間をおいてから再試行してください');
      }
    }
  } catch (error) {
    console.error('❌ ネットワークエラー:', error.message);
  }
  
  return null;
}

async function testPlaceDetails(placeId) {
  if (!placeId) {
    console.log('\n⚠️  Place Details API のテストをスキップ（Place ID がありません）');
    return;
  }
  
  console.log('\n🔍 Place Details API をテスト中...');
  
  const fields = [
    'place_id',
    'name',
    'rating',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'price_level',
    'geometry',
    'types',
    'reviews'
  ].join(',');
  
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ja&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 API Response Status:', data.status);
    
    if (data.status === 'OK') {
      console.log('✅ Place Details API: 成功');
      
      const place = data.result;
      console.log('\n📋 詳細情報:');
      console.log(`   名前: ${place.name}`);
      console.log(`   評価: ${place.rating || 'なし'}`);
      console.log(`   住所: ${place.formatted_address}`);
      console.log(`   電話番号: ${place.formatted_phone_number || 'なし'}`);
      console.log(`   ウェブサイト: ${place.website || 'なし'}`);
      console.log(`   価格帯: ${place.price_level || 'なし'}`);
      
      if (place.opening_hours) {
        console.log(`   営業状況: ${place.opening_hours.open_now ? '営業中' : '営業時間外'}`);
        if (place.opening_hours.weekday_text) {
          console.log('   営業時間:');
          place.opening_hours.weekday_text.forEach(day => {
            console.log(`     ${day}`);
          });
        }
      }
      
      if (place.reviews && place.reviews.length > 0) {
        console.log(`   レビュー数: ${place.reviews.length}`);
        console.log('   最新レビュー:');
        const latestReview = place.reviews[0];
        console.log(`     評価: ${latestReview.rating}/5`);
        console.log(`     投稿者: ${latestReview.author_name}`);
        console.log(`     内容: ${latestReview.text.substring(0, 100)}...`);
      }
      
    } else {
      console.error('❌ Place Details API エラー:', data.status);
      if (data.error_message) {
        console.error('   エラーメッセージ:', data.error_message);
      }
    }
  } catch (error) {
    console.error('❌ ネットワークエラー:', error.message);
  }
}

async function testAPIQuota() {
  console.log('\n🔍 API利用制限をテスト中...');
  
  // 複数回のリクエストで制限をテスト
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(testNearbySearch());
  }
  
  try {
    await Promise.all(promises);
    console.log('✅ API利用制限: 正常');
  } catch (error) {
    console.error('❌ API利用制限エラー:', error.message);
  }
}

async function main() {
  console.log('🚀 Google Places API 動作確認を開始します...');
  console.log(`📍 テスト位置: 東京駅周辺 (${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude})`);
  
  // 1. Nearby Search API のテスト
  const placeId = await testNearbySearch();
  
  // 2. Place Details API のテスト
  await testPlaceDetails(placeId);
  
  // 3. API利用制限のテスト
  // await testAPIQuota();
  
  console.log('\n✨ テスト完了');
  
  if (placeId) {
    console.log('\n🎉 Google Places API は正常に動作しています！');
    console.log('💡 アプリケーションで実際のデータを使用できます');
  } else {
    console.log('\n⚠️  Google Places API の設定に問題があります');
    console.log('💡 APIキーと設定を確認してください');
  }
}

// スクリプト実行
main().catch(console.error);