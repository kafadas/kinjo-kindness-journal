// Utility functions for trends calculations and formatting

export interface Balance {
  givenPct: number
  receivedPct: number
}

/**
 * Compute given vs received balance percentages
 */
export const computeBalance = ({ given, received }: { given: number; received: number }): Balance => {
  const total = given + received
  
  if (total === 0) {
    return { givenPct: 0, receivedPct: 0 }
  }
  
  return {
    givenPct: (given / total) * 100,
    receivedPct: (received / total) * 100
  }
}

/**
 * Format percentage with 1 decimal place, clamped to [0-100]
 */
export const formatPct = (x: number): string => {
  const clamped = Math.max(0, Math.min(100, x))
  return `${clamped.toFixed(1)}%`
}

/**
 * Calculate daily average for a given dataset
 */
export const calculateDailyAverage = (dailyData: Array<{ total: number }>): number => {
  const daysWithMoments = dailyData.filter(d => d.total > 0).length
  const totalMoments = dailyData.reduce((sum, d) => sum + d.total, 0)
  
  return daysWithMoments > 0 ? totalMoments / daysWithMoments : 0
}

/**
 * Count active categories from category share data
 */
export const countActiveCategories = (categoryData: Array<{ pct: number } | { cnt: number }>): number => {
  return categoryData.filter(c => 
    ('cnt' in c && c.cnt > 0) || ('pct' in c && c.pct > 0)
  ).length
}

/**
 * Generate supportive balance message based on giving/receiving ratio
 */
export const getBalanceMessage = (givenPct: number, receivedPct: number): string => {
  if (givenPct === 0 && receivedPct === 0) {
    return "Every small act of kindness counts 💜"
  }
  
  if (givenPct > 70) {
    return "You're a natural giver — remember to receive kindness too 💜"
  } else if (receivedPct > 70) {
    return "You're open to receiving — consider sharing kindness forward 💜"
  } else if (Math.abs(givenPct - receivedPct) < 10) {
    return "Beautiful balance — kindness flows both ways 💜"
  } else if (givenPct > receivedPct) {
    return "Your generous spirit shines through 💜"
  } else {
    return "You're blessed with kindness from others 💜"
  }
}