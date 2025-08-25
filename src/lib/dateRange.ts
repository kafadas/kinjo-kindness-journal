import { startOfDay, endOfDay, subDays, subYears } from 'date-fns'

export type DateRangeLabel = 'all' | '7d' | '30d' | '90d' | '365d'

export interface DateRange {
  start: Date
  end: Date
}

export const getRange = (label: DateRangeLabel, timezone: string = 'UTC'): DateRange | null => {
  // Return null for "all" to indicate no date filter
  if (label === 'all') {
    return null
  }
  
  // Get current date in user's timezone
  const now = new Date()
  const end = endOfDay(now)
  
  let start: Date
  
  switch (label) {
    case '7d':
      start = startOfDay(subDays(now, 7))
      break
    case '30d':
      start = startOfDay(subDays(now, 30))
      break
    case '90d':
      start = startOfDay(subDays(now, 90))
      break
    case '365d':
      start = startOfDay(subDays(now, 365))
      break
    default:
      throw new Error(`Invalid date range label: ${label}`)
  }
  
  return { start, end }
}

export const RANGE_OPTIONS = [
  { label: 'all' as DateRangeLabel, display: 'All' },
  { label: '7d' as DateRangeLabel, display: '7 days' },
  { label: '30d' as DateRangeLabel, display: '30 days' },
  { label: '90d' as DateRangeLabel, display: '90 days' },
  { label: '365d' as DateRangeLabel, display: '1 year' }
]