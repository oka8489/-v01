<script setup>
import { inject, computed } from 'vue'
import BasicFeeSection from '../sections/BasicFeeSection.vue'
import PreparationFeeSection from '../sections/PreparationFeeSection.vue'
import ManagementFeeSection from '../sections/ManagementFeeSection.vue'
import HomeCareSection from '../sections/HomeCareSection.vue'
import LongTermCareSection from '../sections/LongTermCareSection.vue'
import { useCalculation } from '../../composables/useCalculation.js'

const { data } = inject('storage')
const calc = useCalculation(data)

// 医療保険合計 = 報酬項目の計算結果（A+B+C+D）
const ikaTotal = computed(() =>
  calc.r6BasicTotal.value + calc.r6PrepTotal.value + calc.r6MgmtTotal.value + calc.r6HomeTotal.value
)
// F. 患者負担合計 = 保険分 + 自費分 + 保険外
const futanTotal = computed(() =>
  (data.r6.hoken_futan || 0) + (data.r6.jihi_futan || 0) + (data.r6.hokengai_futan || 0)
)
// 総売上 = 医療保険(計算値) + 介護(計算値) + 患者負担
const grandTotal = computed(() =>
  ikaTotal.value + calc.r6LtcTotal.value + futanTotal.value
)

// カンマ付き数値入力ヘルパー
function fmt(v) {
  if (v == null || v === '') return '0'
  const n = Number(v)
  return isNaN(n) ? '0' : n.toLocaleString()
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

</script>

<template>
  <div>
    <!-- 年間合計 -->
    <div class="section">
      <div class="section-title">年間合計</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;min-width:0">
        <div class="summary-card" style="border-color:var(--teal)">
          <div class="summary-label">医療保険（A+B+C+D）</div>
          <div class="summary-row">
            <span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{ fmt(ikaTotal) }}</span>
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--green)">
          <div class="summary-label">介護保険（E）</div>
          <div class="summary-row">
            <span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{ fmt(calc.r6LtcTotal.value) }}</span>
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--amber)">
          <div class="summary-label">患者負担</div>
          <div class="summary-row">
            <span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{ fmt(futanTotal) }}</span>
            <span class="summary-unit">円</span>
          </div>
        </div>
        <div class="summary-card" style="border-color:var(--purple)">
          <div class="summary-label">総売上</div>
          <div class="summary-row">
            <span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{ fmt(grandTotal) }}</span>
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
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.rx_count == null }" :value="fmt(data.r6.rx_count)" @change="data.r6.rx_count = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋受付枚数</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.rx_sheets == null }" :value="fmt(data.r6.rx_sheets)" @change="data.r6.rx_sheets = parseNum($event.target.value)"></td>
            <td style="text-align:right">枚</td>
          </tr>
          <tr>
            <td class="label-cell">後発調剤率</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.ge_rate == null }" :value="fmt(data.r6.ge_rate)" @change="data.r6.ge_rate = parseNum($event.target.value)"></td>
            <td style="text-align:right">%</td>
          </tr>
          <tr>
            <td class="label-cell">剤数</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.zai_count == null }" :value="fmt(data.r6.zai_count)" @change="data.r6.zai_count = parseNum($event.target.value)"></td>
            <td style="text-align:right">剤</td>
          </tr>
          <tr>
            <td class="label-cell">平均剤数</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.avg_zai == null }" :value="fmt(data.r6.avg_zai)" @change="data.r6.avg_zai = parseNum($event.target.value)"></td>
            <td style="text-align:right">剤</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋報酬金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.total_reward == null }" :value="fmt(data.r6.total_reward)" @change="data.r6.total_reward = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">処方箋単価</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.rx_price == null }" :value="fmt(data.r6.rx_price)" @change="data.r6.rx_price = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">手帳活用実績（持参率）</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.techo_rate == null }" :value="fmt(data.r6.techo_rate)" @change="data.r6.techo_rate = parseNum($event.target.value)"></td>
            <td style="text-align:right">%</td>
          </tr>
          <tr>
            <td class="label-cell">3月以内受付回数</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.rx_3month == null }" :value="fmt(data.r6.rx_3month)" @change="data.r6.rx_3month = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
          <tr>
            <td class="label-cell">うち手帳持参有り</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.rx_3month_techo == null }" :value="fmt(data.r6.rx_3month_techo)" @change="data.r6.rx_3month_techo = parseNum($event.target.value)"></td>
            <td style="text-align:right">回</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BasicFeeSection :data="data" />
    <PreparationFeeSection :data="data" />
    <ManagementFeeSection :data="data" />
    <HomeCareSection :data="data" />
    <LongTermCareSection :data="data" />

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
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.hoken_futan == null }" :value="fmt(data.r6.hoken_futan)" @change="data.r6.hoken_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">自費分・患者負担金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.jihi_futan == null }" :value="fmt(data.r6.jihi_futan)" @change="data.r6.jihi_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr>
            <td class="label-cell">保険外・患者負担金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.hokengai_futan == null }" :value="fmt(data.r6.hokengai_futan)" @change="data.r6.hokengai_futan = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ その他金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.sonota_kingaku == null }" :value="fmt(data.r6.sonota_kingaku)" @change="data.r6.sonota_kingaku = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ OTC金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.otc_kingaku == null }" :value="fmt(data.r6.otc_kingaku)" @change="data.r6.otc_kingaku = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ 選定療養金額</td>
            <td><input type="text" class="fee-input" :class="{ 'empty-input': data.r6.sentei_ryoyo == null }" :value="fmt(data.r6.sentei_ryoyo)" @change="data.r6.sentei_ryoyo = parseNum($event.target.value)"></td>
            <td style="text-align:right">円</td>
          </tr>
          <tr class="total-row">
            <td style="font-weight:700">合計</td>
            <td class="num-cell" style="font-weight:700"><span class="amt-computed">{{ fmt((data.r6.hoken_futan || 0) + (data.r6.jihi_futan || 0) + (data.r6.hokengai_futan || 0)) }}</span></td>
            <td style="text-align:right">円</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.summary-card { background: var(--surface2); border: 1.5px solid; border-radius: var(--radius); padding: 12px; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; min-width: 0; }
.summary-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.summary-row { display: flex; align-items: baseline; gap: 4px; }
.summary-input { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; background: transparent; border: none; color: var(--text); padding: 0; font-family: 'IBM Plex Mono', monospace; }
.summary-input:focus { outline: none; }
.summary-unit { font-size: 13px; color: var(--text-muted); flex-shrink: 0; }
</style>
