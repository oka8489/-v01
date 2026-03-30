import { computed } from 'vue'
import { BASIC_FEES, PREPARATION_FEES, MANAGEMENT_FEES, HOMECARE_FEES, LONGTERM_FEES, ALL_FEES } from '../data/fee-definitions.js'
import { POINT_TO_YEN } from '../utils/constants.js'

export function useCalculation(data) {

  // 点数を取得
  function getPoints(item) {
    if (item.linkedTo && item.linkedRate) {
      const parent = ALL_FEES.find(i => i.id === item.linkedTo)
      if (parent) return Math.floor(getPoints(parent) * item.linkedRate)
    }
    const eraData = item.r6
    if (!eraData) return 0
    if (eraData.fixedPoints != null) return eraData.fixedPoints
    const sel = data.r6?.[item.id]
    if (sel != null) return sel
    if (eraData.options?.length) return eraData.options[0].value
    return 0
  }

  // 件数を取得
  function getCount(item) {
    return data.r6?.[item.id + '_cnt'] || 0
  }

  // count-only項目の金額を取得
  function getAmountDirect(item) {
    return data.r6?.[item.id + '_amt'] ?? data.r6?.[item.id] ?? 0
  }

  // カテゴリ小計
  function categoryTotal(items) {
    let total = 0
    for (const item of items) {
      if (item.inputType === 'count-only' || item.unit === '単位') {
        total += getAmountDirect(item)
      } else {
        total += getCount(item) * getPoints(item) * POINT_TO_YEN
      }
    }
    return total
  }

  const r6BasicTotal = computed(() => categoryTotal(BASIC_FEES))
  const r6PrepTotal = computed(() => categoryTotal(PREPARATION_FEES))
  const r6MgmtTotal = computed(() => categoryTotal(MANAGEMENT_FEES))
  const r6HomeTotal = computed(() => categoryTotal(HOMECARE_FEES))
  const r6LtcTotal = computed(() => categoryTotal(LONGTERM_FEES))
  const r6Total = computed(() =>
    r6BasicTotal.value + r6PrepTotal.value + r6MgmtTotal.value +
    r6HomeTotal.value + r6LtcTotal.value
  )

  return {
    getPoints,
    getCount,
    getAmountDirect,
    categoryTotal,
    r6BasicTotal, r6PrepTotal, r6MgmtTotal, r6HomeTotal, r6LtcTotal, r6Total,
  }
}
