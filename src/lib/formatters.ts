import { formatDistanceToNow, differenceInDays, startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const formatPct1 = (n: number) => 
  new Intl.NumberFormat(undefined, {
    style: 'percent', 
    maximumFractionDigits: 1, 
    minimumFractionDigits: 1
  }).format(n)

export const formatNum = new Intl.NumberFormat()

export const formatDelta = (delta: number) => {
  const sign = delta > 0 ? '▲' : delta < 0 ? '▼' : ''
  return `${sign} ${formatPct1(Math.abs(delta))}`
}

// Timezone-aware relative date formatting for consistent "days ago" calculations
export const formatRelativeDate = (date: Date | string, timezone: string = 'UTC'): string => {
  const momentDate = typeof date === 'string' ? new Date(date) : date
  
  // Convert both the moment date and current time to the user's timezone
  const momentInUserTz = toZonedTime(momentDate, timezone)
  const nowInUserTz = toZonedTime(new Date(), timezone)
  
  // Calculate difference in days using start of day for consistent results
  const daysDiff = differenceInDays(startOfDay(nowInUserTz), startOfDay(momentInUserTz))
  
  if (daysDiff === 0) {
    return 'Today'
  } else if (daysDiff === 1) {
    return '1 day ago'
  } else if (daysDiff < 7) {
    return `${daysDiff} days ago`
  } else if (daysDiff < 30) {
    const weeks = Math.floor(daysDiff / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else if (daysDiff < 365) {
    const months = Math.floor(daysDiff / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  } else {
    const years = Math.floor(daysDiff / 365)
    return years === 1 ? '1 year ago' : `${years} years ago`
  }
}