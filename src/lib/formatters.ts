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