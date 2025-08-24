import { useSearchParams } from 'react-router-dom'
import { type DateRangeLabel } from '@/lib/dateRange'

export interface TrendsUrlState {
  range: DateRangeLabel
  action: 'given' | 'received' | 'both'
  significant: boolean
}

export const useTrendsUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const getUrlState = (): TrendsUrlState => {
    const range = searchParams.get('range') as DateRangeLabel || '30d'
    const action = searchParams.get('action') as 'given' | 'received' | 'both' || 'both'
    const significant = searchParams.get('significant') === '1'

    return { range, action, significant }
  }

  const setUrlState = (state: Partial<TrendsUrlState>) => {
    const current = getUrlState()
    const newState = { ...current, ...state }
    
    const params = new URLSearchParams()
    if (newState.range !== '30d') params.set('range', newState.range)
    if (newState.action !== 'both') params.set('action', newState.action)
    if (newState.significant) params.set('significant', '1')
    
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return {
    urlState: getUrlState(),
    setUrlState,
    clearFilters
  }
}