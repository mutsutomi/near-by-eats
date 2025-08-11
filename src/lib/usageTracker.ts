interface DailyUsage {
  date: string;
  count: number;
  resetTime: number;
}

// メモリ内ストレージ（本番では Redis や Database を推奨）
let dailyUsage: DailyUsage | null = null;

export function getDailyUsage(): DailyUsage {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 新しい日または初回の場合
  if (!dailyUsage || dailyUsage.date !== today) {
    dailyUsage = {
      date: today,
      count: 0,
      resetTime: todayEnd.getTime()
    };
  }

  return dailyUsage;
}

export function incrementDailyUsage(): number {
  const usage = getDailyUsage();
  usage.count++;
  return usage.count;
}

export function checkDailyLimit(maxDailyRequests: number = 100): {
  allowed: boolean;
  current: number;
  limit: number;
  resetTime: number;
} {
  const usage = getDailyUsage();
  
  return {
    allowed: usage.count < maxDailyRequests,
    current: usage.count,
    limit: maxDailyRequests,
    resetTime: usage.resetTime
  };
}