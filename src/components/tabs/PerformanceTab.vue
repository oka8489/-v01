<script setup>
import { inject, computed } from 'vue'
import { MONTHS_R7, MONTH_LABELS } from '../../utils/constants.js'
import { formatYen } from '../../utils/formatters.js'

const { data } = inject('storage')

function ensureMonth(ym) {
  if (!data.monthly[ym]) {
    data.monthly[ym] = {
      rxCount: null,
      rxSheets: null,
      geRate: null,
      zaiCount: null,
      avgZai: null,
      totalReward: null,
      rxPrice: null,
      techoRate: null,
      drugCost: null,
    }
  }
  return data.monthly[ym]
}

const fields = [
  { key: 'rxCount', label: '処方箋受付回数', unit: '回' },
  { key: 'rxSheets', label: '処方箋受付枚数', unit: '枚' },
  { key: 'geRate', label: '後発調剤率', unit: '%' },
  { key: 'zaiCount', label: '剤数', unit: '剤' },
  { key: 'avgZai', label: '平均剤数', unit: '剤' },
  { key: 'totalReward', label: '処方箋報酬金額', unit: '円' },
  { key: 'rxPrice', label: '処方箋単価', unit: '円' },
  { key: 'techoRate', label: '手帳持参率', unit: '%' },
  { key: 'drugCost', label: '薬剤費合計', unit: '円' },
]

const totalReward = computed(() => {
  let sum = 0
  for (const ym of MONTHS_R7) {
    const m = data.monthly[ym]
    if (m?.totalReward) sum += m.totalReward
  }
  return sum
})

const monthsWithData = computed(() => {
  return MONTHS_R7.filter(ym => data.monthly[ym]?.totalReward).length
})
</script>

<template>
  <div>
    <div class="section">
      <div class="section-title">月次実績入力（R7.5〜R8.4）</div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <div class="kpi-card info" style="flex:1">
          <div class="kpi-label">入力済み月数</div>
          <div class="kpi-value" style="font-size:18px">{{ monthsWithData }} / 12</div>
        </div>
        <div class="kpi-card" style="flex:1">
          <div class="kpi-label">累計報酬額</div>
          <div class="kpi-value" style="font-size:18px">{{ formatYen(totalReward) }}</div>
          <div class="kpi-unit">円</div>
        </div>
      </div>
    </div>

    <div class="section" style="overflow-x:auto">
      <div class="section-title">月別データ</div>
      <table class="fee-table" style="min-width:900px">
        <thead>
          <tr>
            <th style="width:140px">項目</th>
            <th v-for="ym in MONTHS_R7" :key="ym" style="width:90px;text-align:center;font-size:10px">
              {{ MONTH_LABELS[ym] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in fields" :key="f.key">
            <td class="label-cell" style="font-size:11px;white-space:nowrap">{{ f.label }}<br><span style="color:var(--text-faint);font-size:10px">{{ f.unit }}</span></td>
            <td v-for="ym in MONTHS_R7" :key="ym" style="padding:2px 3px">
              <input
                type="number"
                class="fee-input"
                style="max-width:80px;font-size:11px;height:26px"
                :value="ensureMonth(ym)[f.key]"
                @input="ensureMonth(ym)[f.key] = $event.target.value ? Number($event.target.value) : null"
                :step="f.unit === '%' ? 0.01 : 1"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
