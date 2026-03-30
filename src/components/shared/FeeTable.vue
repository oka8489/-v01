<script setup>
import BadgeLabel from './BadgeLabel.vue'
import { POINT_TO_YEN } from '../../utils/constants.js'
import { formatYen } from '../../utils/formatters.js'

const props = defineProps({
  items: Array,
  data: Object,
  showAmount: { type: Boolean, default: true },
  showTotal: { type: Boolean, default: false },
})

function getPoints(item) {
  if (item.linkedTo && item.linkedRate) {
    const parent = props.items.find(i => i.id === item.linkedTo)
    if (parent) {
      const parentPts = getPoints(parent)
      if (parentPts != null) return Math.floor(parentPts * item.linkedRate)
    }
  }
  const eraData = item.r6
  if (!eraData) return null
  if (eraData.fixedPoints != null) return eraData.fixedPoints
  const sel = props.data.r6?.[item.id]
  if (sel != null) return sel
  if (eraData.options?.length) return eraData.options[0].value
  return null
}

function getCount(item) {
  return props.data.r6?.[item.id + '_cnt'] || 0
}

function isMissing(item) {
  if (isDisabled(item)) return false
  if (item.inputType === 'count-only') {
    return (props.data.r6?.[item.id + '_amt'] ?? props.data.r6?.[item.id]) == null
  }
  return props.data.r6?.[item.id + '_cnt'] == null
}

// 青: 計算で求める値（点数×件数×10）またはDB対象外
function isComputed(item) {
  if (isDisabled(item)) return false
  if (item.inputType === 'count-only' || item.unit === '単位') return false
  // 点数があり件数もある = 計算で出している
  return getPoints(item) != null && !isMissing(item)
}

function getAmount(item) {
  if (item.inputType === 'count-only' || item.unit === '単位') {
    return props.data.r6?.[item.id + '_amt'] ?? props.data.r6?.[item.id] ?? 0
  }
  const pts = getPoints(item)
  const cnt = getCount(item)
  if (pts == null || cnt == null) return 0
  return cnt * pts * POINT_TO_YEN
}

function updateSelect(item, value) {
  if (!props.data.r6) props.data.r6 = {}
  props.data.r6[item.id] = Number(value)
}

function updateCount(item, value) {
  if (!props.data.r6) props.data.r6 = {}
  props.data.r6[item.id + '_cnt'] = value ? Number(String(value).replace(/,/g, '')) : 0
}

function fmtCount(v) {
  return (v || 0).toLocaleString()
}

function isDisabled(item) {
  return item.r6 === null
}

function totalCount() {
  return props.items.filter(i => !isDisabled(i)).reduce((sum, i) => sum + getCount(i), 0)
}

function totalAmount() {
  return props.items.filter(i => !isDisabled(i)).reduce((sum, i) => sum + getAmount(i), 0)
}
</script>

<template>
  <table class="fee-table">
    <thead>
      <tr>
        <th style="width:240px">項目</th>
        <th style="width:140px">点数</th>
        <th v-if="showAmount" style="width:90px;text-align:right">件数</th>
        <th v-if="showAmount" style="width:110px;text-align:right">金額（円）</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in items"
        :key="item.id"
        :class="{
          'abolished-row': isDisabled(item),
          'sub-row': item.isDetail,
        }"
      >
        <td class="label-cell" :style="item.isSub ? 'padding-left:24px' : (item.isDetail ? 'padding-left:32px;color:var(--text-muted)' : '')">
          <span v-if="item.isDetail">┗ {{ item.label }}</span>
          <span v-else>{{ item.label }}</span>
          <BadgeLabel :type="item.changeType" :item="item" />
          <div v-if="item.description" style="font-size:10px;color:var(--text-faint)">{{ item.description }}</div>
          <div v-else-if="item.r6?.frequency" style="font-size:10px;color:var(--text-faint)">{{ item.r6.frequency }}</div>
        </td>
        <td>
          <select
            v-if="item.inputType === 'select' && item.r6?.options"
            class="fee-select"
            :value="getPoints(item)"
            @change="updateSelect(item, $event.target.value)"
          >
            <option v-for="opt in item.r6.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <span v-else-if="item.linkedTo" style="font-family:'IBM Plex Mono',monospace;font-size:13px">
            {{ getPoints(item) }} 点
          </span>
          <span v-else-if="item.r6?.fixedPoints != null" style="font-family:'IBM Plex Mono',monospace;font-size:13px">
            {{ item.r6.fixedPoints }} 点
          </span>
          <span v-else style="font-size:12px;color:var(--text-faint)">-</span>
        </td>
        <td v-if="showAmount" style="text-align:right">
          <input
            v-if="!isDisabled(item)"
            type="text"
            class="fee-input"
            :class="{ 'empty-input': isMissing(item) }"
            style="max-width:90px;text-align:right"
            :value="fmtCount(getCount(item))"
            @change="updateCount(item, $event.target.value)"
          >
          <span v-else style="color:var(--text-faint)">-</span>
        </td>
        <td v-if="showAmount" class="num-cell">
          <span v-if="isDisabled(item)" style="color:var(--text-faint)">-</span>
          <span v-else-if="isMissing(item)" class="amt-missing">{{ formatYen(getAmount(item)) }}</span>
          <span v-else-if="isComputed(item)" class="amt-computed">{{ formatYen(getAmount(item)) }}</span>
          <span v-else>{{ formatYen(getAmount(item)) }}</span>
        </td>
      </tr>
      <tr v-if="showTotal" class="total-row">
        <td style="font-weight:700">合計</td>
        <td></td>
        <td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{ fmtCount(totalCount()) }}</span></td>
        <td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{ formatYen(totalAmount()) }}</span></td>
      </tr>
    </tbody>
  </table>
</template>
