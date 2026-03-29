export function formatYen(value) {
  if (value == null || isNaN(value)) return '-'
  return Math.round(value).toLocaleString('ja-JP')
}

export function formatPoints(value) {
  if (value == null || isNaN(value)) return '-'
  return Math.round(value).toLocaleString('ja-JP')
}

export function formatPercent(value, digits = 2) {
  if (value == null || isNaN(value)) return '-'
  return value.toFixed(digits)
}

export function formatDiff(value) {
  if (value == null || isNaN(value)) return '-'
  const v = Math.round(value)
  if (v > 0) return '+' + v.toLocaleString('ja-JP')
  if (v < 0) return v.toLocaleString('ja-JP')
  return '0'
}

export function formatDiffPercent(value) {
  if (value == null || isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return sign + value.toFixed(2) + '%'
}
