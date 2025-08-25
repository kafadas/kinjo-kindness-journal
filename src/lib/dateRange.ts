export type Period = '7d' | '30d' | '90d' | '365d';

export function getRange(period: Period, tz: string) {
  // end = today in user's tz, inclusive end-of-day
  const now = new Date(); // js local; server must pass tz separately to SQL
  const end = new Date(now); // label only; SQL will do the real tz-boundary
  const days = period==='7d'?7:period==='30d'?30:period==='90d'?90:365;
  const start = new Date(end); start.setDate(start.getDate()-(days-1));
  return { start, end, period };
}

// Legacy support for existing code
export type DateRangeLabel = 'all' | '7d' | '30d' | '90d' | '365d'

export interface DateRange {
  start: Date
  end: Date
}

// Legacy function that wraps the new one
export const getRangeLegacy = (label: DateRangeLabel, timezone: string = 'UTC'): DateRange | null => {
  if (label === 'all') {
    return null
  }
  
  const result = getRange(label as Period, timezone)
  return { start: result.start, end: result.end }
}

export const RANGE_OPTIONS = [
  { label: 'all' as DateRangeLabel, display: 'All' },
  { label: '7d' as DateRangeLabel, display: '7 days' },
  { label: '30d' as DateRangeLabel, display: '30 days' },
  { label: '90d' as DateRangeLabel, display: '90 days' },
  { label: '365d' as DateRangeLabel, display: '1 year' }
]