<script setup>
import { inject, computed } from 'vue'
import BasicFeeSection from '../sections/BasicFeeSection.vue'
import PreparationFeeSection from '../sections/PreparationFeeSection.vue'
import ManagementFeeSection from '../sections/ManagementFeeSection.vue'
import HomeCareSection from '../sections/HomeCareSection.vue'
import LongTermCareSection from '../sections/LongTermCareSection.vue'
import { ALL_FEES } from '../../data/fee-definitions.js'

const { data } = inject('storage')

// 患者負担合計 = 保険分 + 自費分 + 保険外
const futanTotal = computed(() =>
  (data.r6.hoken_futan || 0) + (data.r6.jihi_futan || 0) + (data.r6.hokengai_futan || 0)
)
// 総売上 = 医療保険 + 介護 + その他(患者負担)
const grandTotal = computed(() =>
  (data.r6.ika_total || 0) + (data.r6.kaigo_total || 0) + futanTotal.value
)

// カンマ付き数値入力ヘルパー
function fmt(v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  return isNaN(n) ? '' : n.toLocaleString()
}
function parseNum(s) {
  return Number(String(s).replace(/,/g, '')) || 0
}

// 基本指標の定義
const BASIC_INDICATORS = [
  { id: 'rx_count', label: '処方箋受付回数', unit: '回' },
  { id: 'rx_sheets', label: '処方箋受付枚数', unit: '枚' },
  { id: 'ge_rate', label: '後発調剤率', unit: '%' },
  { id: 'zai_count', label: '剤数', unit: '剤' },
  { id: 'avg_zai', label: '平均剤数', unit: '剤' },
  { id: 'total_reward', label: '処方箋報酬金額', unit: '円' },
  { id: 'rx_price', label: '処方箋単価', unit: '円' },
  { id: 'techo_rate', label: '手帳活用実績（持参率）', unit: '%' },
  { id: 'rx_3month', label: '3月以内受付回数', unit: '回' },
  { id: 'rx_3month_techo', label: 'うち手帳持参有り', unit: '回' },
  { id: 'hoken_futan', label: '保険分・患者負担金額', unit: '円' },
  { id: 'jihi_futan', label: '自費分・患者負担金額', unit: '円' },
  { id: 'hokengai_futan', label: '保険外・患者負担金額', unit: '円' },
  { id: 'sonota_kingaku', label: 'その他金額', unit: '円' },
  { id: 'otc_kingaku', label: 'OTC金額', unit: '円' },
  { id: 'sentei_ryoyo', label: '選定療養金額', unit: '円' },
]

// --- データ充足状況 ---
const dataStatus = computed(() => {
  const r6 = data.r6 || {}
  const r6Items = ALL_FEES.filter(f => f.r6 !== null)
  const sources = data.sources || {}
  const filled = []
  const missing = []

  // 基本指標
  for (const ind of BASIC_INDICATORS) {
    const val = r6[ind.id]
    if (val != null) {
      filled.push({ id: ind.id, label: ind.label, value: val, category: 'indicator', source: sources[ind.id] || '手入力' })
    } else {
      missing.push({ id: ind.id, label: ind.label, category: 'indicator' })
    }
  }

  // 報酬項目
  for (const item of r6Items) {
    const cntKey = `${item.id}_cnt`
    const val = r6[cntKey]
    if (val != null) {
      filled.push({ id: item.id, label: item.label, value: val, category: item.category, source: sources[cntKey] || '手入力' })
    } else {
      missing.push({ id: item.id, label: item.label, category: item.category })
    }
  }
  const hasAnnual = !!(data.annualReward || data.annualDrugCost)
  const totalItems = BASIC_INDICATORS.length + r6Items.length
  const filledCount = filled.length
  const pct = totalItems > 0 ? Math.round((filledCount / totalItems) * 100) : 0
  return { filled, missing, hasAnnual, totalItems, filledCount, pct }
})

const categoryLabels = {
  indicator: '基本指標',
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
            <span class="filled-label">
              <span class="source-badge" :class="'src-' + (item.source === '統' ? 'tokei' : item.source === '加' ? 'kazan' : 'manual')">{{ item.source === '統' ? '統' : item.source === '加' ? '加' : '手' }}</span>
              {{ item.label }}
            </span>
            <span class="filled-value">{{ item.value.toLocaleString() }}</span>
          </div>
        </div>
      </details>
    </div>

    <!-- 年間合計 -->
    <div class="section">
      <div class="section-title">年間合計</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;min-width:0">
        <div class="summary-card" style="border-color:var(--teal)">
          <div class="summary-label">医療保険</div>
          <div class="summary-row">
            <input type="text" class="summary-input" :value="fmt(data.r6.ika_total)" @change="data.r6.ika_total = parseNum($event.target.value)">
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--green)">
          <div class="summary-label">介護保険</div>
          <div class="summary-row">
            <input type="text" class="summary-input" :value="fmt(data.r6.kaigo_total || data.r6.kaisan_kaigo_total)" @change="data.r6.kaigo_total = parseNum($event.target.value)">
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--amber)">
          <div class="summary-label">患者負担</div>
          <div class="summary-row">
            <span class="summary-input" style="background:none;border:none;font-weight:700">{{ fmt(futanTotal) }}</span>
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--purple)">
          <div class="summary-label">総売上</div>
          <div class="summary-row">
            <span class="summary-input" style="background:none;border:none;font-weight:700;color:var(--purple)">{{ fmt(grandTotal) }}</span>
            <span class="summary-unit">円</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 基本指標 -->
    <div class="section">
      <div class="section-title">基本指標</div>
      <table class="fee-table">
        <thead>
          <tr>
            <th style="width:240px">項目</th>
            <th>年間値</th>
            <th style="width:60px;text-align:right">単位</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label-cell">処方箋受付回数</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.rx_count)" @change="data.r6.rx_count = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋受付枚数</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.rx_sheets)" @change="data.r6.rx_sheets = parseNum($event.target.value)"></td>
            <td style="text-align:right">枚</td>
          </tr>
          <tr>
            <td class="label-cell">後発調剤率</td>
            <td><input type="text" class="fee-input" :value="data.r6.ge_rate || 0" @change="data.r6.ge_rate = parseNum($event.target.value)"></td>
            <td style="text-align:right">%</td>
          </tr>
          <tr>
            <td class="label-cell">剤数</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.zai_count)" @change="data.r6.zai_count = parseNum($event.target.value)"></td>
            <td style="text-align:right">剤</td>
          </tr>
          <tr>
            <td class="label-cell">平均剤数</td>
            <td><input type="text" class="fee-input" :value="data.r6.avg_zai || 0" @change="data.r6.avg_zai = parseNum($event.target.value)"></td>
            <td style="text-align:right">剤</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋報酬金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.total_reward)" @change="data.r6.total_reward = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋単価</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.rx_price)" @change="data.r6.rx_price = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">手帳活用実績（持参率）</td>
            <td><input type="text" class="fee-input" :value="data.r6.techo_rate || 0" @change="data.r6.techo_rate = parseNum($event.target.value)"></td>
            <td style="text-align:right">%</td>
          </tr>
          <tr>
            <td class="label-cell">3月以内受付回数</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.rx_3month)" @change="data.r6.rx_3month = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
          <tr>
            <td class="label-cell">うち手帳持参有り</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.rx_3month_techo)" @change="data.r6.rx_3month_techo = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BasicFeeSection :data="data" era="r6" />
    <PreparationFeeSection :data="data" era="r6" />
    <ManagementFeeSection :data="data" era="r6" />
    <HomeCareSection :data="data" era="r6" />
    <LongTermCareSection :data="data" era="r6" />

    <!-- F. 患者負担 -->
    <div class="section">
      <div class="section-title">F. 患者負担</div>
      <table class="fee-table">
        <thead>
          <tr>
            <th style="width:240px">項目</th>
            <th>年間値</th>
            <th style="width:60px;text-align:right">単位</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label-cell">保険分・患者負担金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.hoken_futan)" @change="data.r6.hoken_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">自費分・患者負担金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.jihi_futan)" @change="data.r6.jihi_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">保険外・患者負担金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.hokengai_futan)" @change="data.r6.hokengai_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ その他金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.sonota_kingaku)" @change="data.r6.sonota_kingaku = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ OTC金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.otc_kingaku)" @change="data.r6.otc_kingaku = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ 選定療養金額</td>
            <td><input type="text" class="fee-input" :value="fmt(data.r6.sentei_ryoyo)" @change="data.r6.sentei_ryoyo = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr class="total-row">
            <td style="font-weight:700">合計</td>
            <td class="num-cell" style="font-weight:700">{{ fmt((data.r6.hoken_futan || 0) + (data.r6.jihi_futan || 0) + (data.r6.hokengai_futan || 0)) }}</td>
            <td style="text-align:right">円</td>
          </tr>
        </tbody>
      </table>
    </div>
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
.source-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; margin-left: 4px; font-weight: 600; vertical-align: middle; }
.src-tokei { background: #e8f0fe; color: #1a73e8; }
.src-kazan { background: #e6f4ea; color: #1e8e3e; }
.src-manual { background: #fff3e0; color: #e65100; }
.summary-card { background: var(--surface2); border: 1.5px solid; border-radius: var(--radius); padding: 12px; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; min-width: 0; }
.summary-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.summary-row { display: flex; align-items: baseline; gap: 4px; }
.summary-input { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; background: transparent; border: none; color: var(--text); padding: 0; font-family: 'IBM Plex Mono', monospace; }
.summary-input:focus { outline: none; }
.summary-unit { font-size: 13px; color: var(--text-muted); flex-shrink: 0; }
</style>
