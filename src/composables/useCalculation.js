import { computed } from 'vue'
import { BASIC_FEES, PREPARATION_FEES, MANAGEMENT_FEES, HOMECARE_FEES, LONGTERM_FEES, ALL_FEES } from '../data/fee-definitions.js'
import { POINT_TO_YEN } from '../utils/constants.js'

export function useCalculation(data) {

  // 指定eraの選択点数を取得
  function getPoints(item, era) {
    const eraData = item[era]
    if (!eraData) return 0
    if (eraData.fixedPoints != null) return eraData.fixedPoints
    const sel = data[era]?.[item.id]
    if (sel != null) return sel
    if (eraData.options?.length) return eraData.options[0].value
    return 0
  }

  // 指定eraの件数を取得
  function getCount(item, era) {
    return data[era]?.[item.id + '_cnt'] || 0
  }

  // カテゴリ小計（年間ベース）
  function categoryTotal(items, era) {
    let total = 0
    for (const item of items) {
      const pts = getPoints(item, era)
      const cnt = getCount(item, era)
      total += cnt * pts * POINT_TO_YEN
    }
    return total
  }

  // R6合計
  const r6BasicTotal = computed(() => categoryTotal(BASIC_FEES, 'r6'))
  const r6PrepTotal = computed(() => categoryTotal(PREPARATION_FEES, 'r6'))
  const r6MgmtTotal = computed(() => categoryTotal(MANAGEMENT_FEES, 'r6'))
  const r6HomeTotal = computed(() => categoryTotal(HOMECARE_FEES, 'r6'))
  const r6LtcTotal = computed(() => categoryTotal(LONGTERM_FEES, 'r6'))
  const r6Total = computed(() =>
    r6BasicTotal.value + r6PrepTotal.value + r6MgmtTotal.value +
    r6HomeTotal.value + r6LtcTotal.value
  )

  // R8合計
  const r8BasicTotal = computed(() => categoryTotal(BASIC_FEES, 'r8'))
  const r8PrepTotal = computed(() => categoryTotal(PREPARATION_FEES, 'r8'))
  const r8MgmtTotal = computed(() => categoryTotal(MANAGEMENT_FEES, 'r8'))
  const r8HomeTotal = computed(() => categoryTotal(HOMECARE_FEES, 'r8'))
  const r8LtcTotal = computed(() => categoryTotal(LONGTERM_FEES, 'r8'))
  const r8Total = computed(() =>
    r8BasicTotal.value + r8PrepTotal.value + r8MgmtTotal.value +
    r8HomeTotal.value + r8LtcTotal.value
  )

  // 年間実績（累計ベース）
  const annualStats = computed(() => {
    const annualReward = data.annualReward || 0
    const annualDrugCost = data.annualDrugCost || 0
    return { annualReward, annualDrugCost }
  })

  // 薬価改定影響
  const drugPriceImpact = computed(() => {
    if (!data.drugPriceEnabled) return 0
    return Math.round(annualStats.value.annualDrugCost * -data.drugPriceRate / 100)
  })

  // 技術料増減（点数設定ベース）
  const gijutsuDiff = computed(() => r8Total.value - r6Total.value)

  // R8年間売上予測
  const r8AnnualForecast = computed(() => {
    return annualStats.value.annualReward + gijutsuDiff.value + drugPriceImpact.value
  })

  // 全体の差額
  const totalDiff = computed(() => r8AnnualForecast.value - annualStats.value.annualReward)
  const totalDiffPct = computed(() => {
    if (annualStats.value.annualReward === 0) return 0
    return (totalDiff.value / annualStats.value.annualReward) * 100
  })

  // 新設加算による増収見込み
  const newFeeImpact = computed(() => {
    let total = 0
    for (const item of ALL_FEES) {
      if (item.changeType === 'new' && item.r8) {
        total += getCount(item, 'r8') * getPoints(item, 'r8') * POINT_TO_YEN
      }
    }
    return total
  })

  // 廃止加算による減収見込み
  const abolishedFeeImpact = computed(() => {
    let total = 0
    for (const item of ALL_FEES) {
      if (item.changeType === 'abolished' && item.r6) {
        total -= getCount(item, 'r6') * getPoints(item, 'r6') * POINT_TO_YEN
      }
    }
    return total
  })

  return {
    getPoints,
    getCount,
    r6BasicTotal, r6PrepTotal, r6MgmtTotal, r6HomeTotal, r6LtcTotal, r6Total,
    r8BasicTotal, r8PrepTotal, r8MgmtTotal, r8HomeTotal, r8LtcTotal, r8Total,
    annualStats,
    drugPriceImpact,
    gijutsuDiff,
    r8AnnualForecast,
    totalDiff,
    totalDiffPct,
    newFeeImpact,
    abolishedFeeImpact,
  }
}
