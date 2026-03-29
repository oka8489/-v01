<script setup>
import { computed } from 'vue'
import { PREPARATION_FEES } from '../../data/fee-definitions.js'
import { POINT_TO_YEN } from '../../utils/constants.js'
import { formatYen } from '../../utils/formatters.js'

const props = defineProps({ data: Object, era: { type: String, default: 'r6' } })

function fmt(v) { return (v || 0).toLocaleString() }
function parseNum(s) { return Number(String(s).replace(/,/g, '')) || 0 }

// 薬剤調製料の主要項目（加算を除く）
const mainItems = computed(() => PREPARATION_FEES.filter(f => !f.id.startsWith('kaz_') && f.id !== 'zairyo'))
// 材料
const zairyoItem = computed(() => PREPARATION_FEES.find(f => f.id === 'zairyo'))

// 加算マトリクス定義
const kazanRows = [
  { id: 'nai', label: '内服' },
  { id: 'sin', label: '浸煎' },
  { id: 'yu', label: '湯薬' },
  { id: 'ton', label: '屯服' },
  { id: 'gai', label: '外用' },
  { id: 'chu', label: '注射' },
  { id: 'col', label: '内滴' },
  { id: 'mat', label: '材料' },
]
const kazanCols = [
  { id: 'mayaku', label: '麻薬' },
  { id: 'doku', label: '毒薬' },
  { id: 'kakusei', label: '覚醒剤' },
  { id: 'mukyoko', label: '向精神' },
  { id: 'keiryo', label: '計量' },
  { id: 'keiryo_yo', label: '計量予' },
  { id: 'jika', label: '自家' },
  { id: 'jika_yo', label: '自家予' },
  { id: 'mukin', label: '無菌' },
  { id: 'jikou', label: '時間外' },
]

function kazanRowTotal(rowId) {
  let sum = 0
  for (const kz of kazanCols) {
    sum += getRaw('kaz_' + rowId + '_' + kz.id)
  }
  return sum
}

function kazanColTotal(colId) {
  let sum = 0
  for (const row of kazanRows) {
    sum += getRaw('kaz_' + row.id + '_' + colId)
  }
  return sum
}

function kazanGrandTotal() {
  let sum = 0
  for (const row of kazanRows) {
    for (const kz of kazanCols) {
      sum += getRaw('kaz_' + row.id + '_' + kz.id)
    }
  }
  return sum
}

const unitLabels = {
  naifuku: '1剤につき（3剤まで）',
  sinsenn: '1調剤につき（3調剤まで）',
  yuyaku: '1調剤につき（3調剤まで）',
  tonpuku: '処方箋受付1回につき',
  gaiyou: '1調剤につき（3調剤まで）',
  chusya: '1処方箋につき',
  naiteki: '1調剤につき',
}

function getPoints(item) {
  const eraData = item[props.era]
  if (!eraData) return null
  if (eraData.fixedPoints != null) return eraData.fixedPoints
  return null
}

function getRaw(key) { return props.data[props.era]?.[key] || 0 }
function getVal(key) { return fmt(getRaw(key)) }
function setVal(key, v) {
  if (!props.data[props.era]) props.data[props.era] = {}
  props.data[props.era][key] = parseNum(v)
}

function getAmount(item) {
  const pts = getPoints(item)
  const cnt = getRaw(item.id + '_cnt')
  if (pts == null) return 0
  return cnt * pts * POINT_TO_YEN
}

// 合計行
const totals = computed(() => {
  let zaiSum = 0, yakuzaiSum = 0, cntSum = 0, amtSum = 0
  for (const item of mainItems.value) {
    zaiSum += getRaw(item.id + '_zai')
    yakuzaiSum += getRaw(item.id + '_yakuzai')
    cntSum += getRaw(item.id + '_cnt')
    amtSum += getAmount(item)
  }
  if (zairyoItem.value) {
    zaiSum += getRaw('zairyo_zai')
    yakuzaiSum += getRaw('zairyo_yakuzai')
  }
  return { zaiSum, yakuzaiSum, cntSum, amtSum }
})
</script>

<template>
  <div class="section">
    <div class="section-title">B. 薬剤調製料</div>
    <table class="fee-table">
      <thead>
        <tr>
          <th style="width:250px">剤種</th>
          <th>算定単位</th>
          <th style="width:200px;text-align:right">剤数（剤）</th>
          <th style="width:200px;text-align:right">薬剤料/材料料（円）</th>
          <th style="width:200px;text-align:right">件数（件）</th>
          <th style="width:200px;text-align:right">点数（点）</th>
          <th style="width:200px;text-align:right">薬剤調製料（円）</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in mainItems" :key="item.id">
          <td style="font-weight:600">{{ item.label }}</td>
          <td style="font-size:11px;color:var(--text-muted);white-space:nowrap">{{ unitLabels[item.id] || '' }}</td>
          <td style="text-align:right">
            <input type="text" class="fee-input" style="max-width:90px"
              :value="getVal(item.id + '_zai')"
              @change="setVal(item.id + '_zai', $event.target.value)">
          </td>
          <td style="text-align:right">
            <input type="text" class="fee-input" style="max-width:120px"
              :value="getVal(item.id + '_yakuzai')"
              @change="setVal(item.id + '_yakuzai', $event.target.value)">
          </td>
          <td style="text-align:right">
            <input type="text" class="fee-input" style="max-width:90px"
              :value="getVal(item.id + '_cnt')"
              @change="setVal(item.id + '_cnt', $event.target.value)">
          </td>
          <td class="num-cell">
            <span v-if="getPoints(item) != null">{{ getPoints(item) }}</span>
            <span v-else style="color:var(--text-faint)">※</span>
          </td>
          <td class="num-cell">{{ formatYen(getAmount(item)) }}</td>
        </tr>
        <!-- 材料 -->
        <tr v-if="zairyoItem">
          <td style="font-weight:600">材料</td>
          <td></td>
          <td style="text-align:right">
            <input type="text" class="fee-input" style="max-width:90px"
              :value="getVal('zairyo_zai')"
              @change="setVal('zairyo_zai', $event.target.value)">
          </td>
          <td style="text-align:right">
            <input type="text" class="fee-input" style="max-width:120px"
              :value="getVal('zairyo_yakuzai')"
              @change="setVal('zairyo_yakuzai', $event.target.value)">
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <!-- 合計 -->
        <tr class="total-row">
          <td colspan="2" style="font-weight:700">◆ 合計</td>
          <td class="num-cell" style="font-weight:700">{{ totals.zaiSum.toLocaleString() }}</td>
          <td class="num-cell" style="font-weight:700">{{ totals.yakuzaiSum.toLocaleString() }}</td>
          <td class="num-cell" style="font-weight:700">{{ totals.cntSum.toLocaleString() }}</td>
          <td></td>
          <td class="num-cell" style="font-weight:700">{{ formatYen(totals.amtSum) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 薬剤調製料加算（マトリクス） -->
    <div style="margin-top:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">薬剤調製料加算（円）</div>
      <table class="fee-table kazan-table">
        <thead>
          <tr>
            <th style="width:60px">剤種</th>
            <th v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:4px 2px;width:90px">{{ kz.label }}</th>
            <th style="text-align:right;padding:6px 4px">加算合計</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in kazanRows" :key="row.id">
            <td style="font-weight:600">{{ row.label }}</td>
            <td v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:6px 4px">
              <input type="text" class="fee-input kaz-input"
                :value="getVal('kaz_' + row.id + '_' + kz.id)"
                @change="setVal('kaz_' + row.id + '_' + kz.id, $event.target.value)">
            </td>
            <td class="num-cell" style="font-weight:600">{{ kazanRowTotal(row.id).toLocaleString() }}</td>
          </tr>
          <tr class="total-row">
            <td style="font-weight:700">合計</td>
            <td v-for="kz in kazanCols" :key="kz.id" class="num-cell" style="font-weight:700">{{ kazanColTotal(kz.id).toLocaleString() }}</td>
            <td class="num-cell" style="font-weight:700">{{ kazanGrandTotal().toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.total-row { background: #f0eef8; }
.total-row td { border-top: 1.5px solid var(--border-strong); }
.kazan-table { table-layout: fixed; width: 100%; font-size: 11px; }
.kazan-table th:first-child,
.kazan-table td:first-child { width: 45px; }
.kazan-table th:last-child,
.kazan-table td:last-child { width: 80px; }
.kaz-input { width: 100%; font-size: 11px; height: 28px; padding: 2px 3px; text-align: right; box-sizing: border-box; }
</style>
