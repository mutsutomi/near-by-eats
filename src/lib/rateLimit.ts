interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1分
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const userLimit = store[identifier];

  // 初回リクエストまたはリセット時間を過ぎた場合
  if (!userLimit || now > userLimit.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs
    };
    return { allowed: true, remaining: maxRequests - 1, resetTime: store[identifier].resetTime };
  }

  // リクエスト数がまだ上限に達していない場合
  if (userLimit.count < maxRequests) {
    userLimit.count++;
    return { allowed: true, remaining: maxRequests - userLimit.count, resetTime: userLimit.resetTime };
  }

  // レート制限に達した場合
  return { allowed: false, remaining: 0, resetTime: userLimit.resetTime };
}

// 古いエントリをクリーンアップ（メモリリーク防止）
export function cleanupRateLimitStore() {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// 定期的にクリーンアップを実行
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000); // 5分ごと
}