<script setup>
import { inject, computed } from 'vue'
import BasicFeeSection from '../sections/BasicFeeSection.vue'
import PreparationFeeSection from '../sections/PreparationFeeSection.vue'
import ManagementFeeSection from '../sections/ManagementFeeSection.vue'
import HomeCareSection from '../sections/HomeCareSection.vue'
import LongTermCareSection from '../sections/LongTermCareSection.vue'
import { ALL_FEES } from '../../data/fee-definitions.js'

const { data } = inject('storage')

// --- データ充足状況 ---
const dataStatus = computed(() => {
  const r6 = data.r6 || {}
  const r6Items = ALL_FEES.filter(f => f.r6 !== null)
  const filled = []
  const missing = []
  for (const item of r6Items) {
    const cntKey = `${item.id}_cnt`
    const val = r6[cntKey]
    if (val != null) {
      filled.push({ id: item.id, label: item.label, value: val, category: item.category })
    } else {
      missing.push({ id: item.id, label: item.label, category: item.category })
    }
  }
  const hasAnnual = !!(data.annualReward || data.annualDrugCost)
  const totalItems = r6Items.length
  const filledCount = filled.length
  const pct = totalItems > 0 ? Math.round((filledCount / totalItems) * 100) : 0
  return { filled, missing, hasAnnual, totalItems, filledCount, pct }
})

const categoryLabels = {
  basic: 'A. 基本料・体制加算',
  preparation: 'B. 薬剤調製料',
  management: 'C. 薬学管理料',
  homecare: 'D. 在宅',
  longterm: 'E. 介護',
}

function missingByCategory(cat) {
  return dataStatus.value.missing.filter(m => m.category === cat)
}

const hasAnyData = computed(() => {
  return dataStatus.value.filledCount > 0 || dataStatus.value.hasAnnual
})
</script>

<template>
  <div>
    <!-- データ充足状況 -->
    <div v-if="hasAnyData" class="section">
      <div class="section-title">データ充足状況</div>

      <div class="progress-container">
        <div class="progress-header">
          <span>R6 実績件数</span>
          <span :class="dataStatus.pct >= 80 ? 'text-pos' : dataStatus.pct >= 50 ? 'text-warn' : 'text-neg'">
            {{ dataStatus.filledCount }} / {{ dataStatus.totalItems }} 項目（{{ dataStatus.pct }}%）
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :class="{
            good: dataStatus.pct >= 80,
            mid: dataStatus.pct >= 50 && dataStatus.pct < 80,
            low: dataStatus.pct < 50,
          }" :style="{ width: dataStatus.pct + '%' }"></div>
        </div>
      </div>

      <div class="progress-container" style="margin-top:10px">
        <div class="progress-header">
          <span>年間実績データ</span>
          <span :class="dataStatus.hasAnnual ? 'text-pos' : 'text-neg'">
            {{ dataStatus.hasAnnual ? '取得済み' : '未設定' }}
          </span>
        </div>
      </div>

      <!-- 不足項目 -->
      <div v-if="dataStatus.missing.length > 0" class="missing-section">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-muted)">
          不足している項目（手入力が必要）
        </div>
        <div v-for="(cat, catKey) in categoryLabels" :key="catKey">
          <template v-if="missingByCategory(catKey).length > 0">
            <div class="missing-category">{{ cat }}</div>
            <div class="missing-items">
              <span v-for="item in missingByCategory(catKey)" :key="item.id" class="missing-tag">
                {{ item.label }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- 取得済み項目 -->
      <details style="margin-top:12px">
        <summary style="font-size:12px;color:var(--text-muted);cursor:pointer">
          取得済み {{ dataStatus.filledCount }} 項目を表示
        </summary>
        <div class="filled-grid">
          <div v-for="item in dataStatus.filled" :key="item.id" class="filled-item">
            <span class="filled-label">{{ item.label }}</span>
            <span class="filled-value">{{ item.value.toLocaleString() }}</span>
          </div>
        </div>
      </details>
    </div>

    <BasicFeeSection :data="data" era="r6" />
    <PreparationFeeSection :data="data" era="r6" />
    <ManagementFeeSection :data="data" era="r6" />
    <HomeCareSection :data="data" era="r6" />
    <LongTermCareSection :data="data" era="r6" />
  </div>
</template>

<style scoped>
.progress-container { margin-bottom: 4px; }
.progress-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.progress-bar { height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width .3s ease; }
.progress-fill.good { background: var(--pos); }
.progress-fill.mid { background: #e0a020; }
.progress-fill.low { background: var(--neg); }
.text-pos { color: var(--pos); }
.text-warn { color: #e0a020; }
.text-neg { color: var(--neg); }
.missing-section { margin-top: 14px; padding: 12px; background: #fff8f0; border: 1px solid #f0d8b0; border-radius: var(--radius); }
.missing-category { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 6px; margin-bottom: 4px; }
.missing-items { display: flex; flex-wrap: wrap; gap: 4px; }
.missing-tag { font-size: 11px; padding: 2px 8px; background: #fff0e0; border: 1px solid #e8c8a0; border-radius: 12px; color: #a06000; white-space: nowrap; }
.filled-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px; margin-top: 8px; }
.filled-item { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 8px; background: var(--surface2); border-radius: 4px; }
.filled-label { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filled-value { font-weight: 600; color: var(--pos); margin-left: 8px; flex-shrink: 0; }
</style>
