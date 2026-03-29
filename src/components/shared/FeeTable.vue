<script setup>
import BadgeLabel from './BadgeLabel.vue'
import { POINT_TO_YEN } from '../../utils/constants.js'
import { formatYen } from '../../utils/formatters.js'

const props = defineProps({
  items: Array,
  data: Object,
  era: { type: String, default: 'r8' }, // 'r6' or 'r8'
  showAmount: { type: Boolean, default: true },
  showTotal: { type: Boolean, default: false },
})

function getPoints(item) {
  const eraData = item[props.era]
  if (!eraData) return null
  if (eraData.fixedPoints != null) return eraData.fixedPoints
  const sel = props.data[props.era]?.[item.id]
  if (sel != null) return sel
  if (eraData.options?.length) return eraData.options[0].value
  return null
}

function getCount(item) {
  return props.data[props.era]?.[item.id + '_cnt'] || 0
}

function getAmount(item) {
  // count-only: _amt フィールドから直接金額を取得
  if (item.inputType === 'count-only') {
    return props.data[props.era]?.[item.id + '_amt'] || 0
  }
  const pts = getPoints(item)
  const cnt = getCount(item)
  if (pts == null || cnt == null) return 0
  return cnt * pts * POINT_TO_YEN
}

function updateSelect(item, value) {
  if (!props.data[props.era]) props.data[props.era] = {}
  props.data[props.era][item.id] = Number(value)
}

function updateCount(item, value) {
  if (!props.data[props.era]) props.data[props.era] = {}
  props.data[props.era][item.id + '_cnt'] = value ? Number(String(value).replace(/,/g, '')) : 0
}

function fmtCount(v) {
  return (v || 0).toLocaleString()
}

function isDisabled(item) {
  return item[props.era] === null
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
          'new-row': item.changeType === 'new' && era === 'r8',
          'abolished-row': isDisabled(item),
          'sub-row': item.isDetail,
        }"
      >
        <td class="label-cell" :style="item.isSub ? 'padding-left:24px' : (item.isDetail ? 'padding-left:32px;color:var(--text-muted)' : '')">
          <span v-if="item.isDetail">┗ {{ item.label }}</span>
          <span v-else>{{ item.label }}</span>
          <BadgeLabel :type="item.changeType" />
          <div v-if="item.description" style="font-size:10px;color:var(--text-faint)">{{ item.description }}</div>
          <div v-else-if="item[era]?.frequency" style="font-size:10px;color:var(--text-faint)">{{ item[era].frequency }}</div>
        </td>
        <td>
          <!-- select型 -->
          <select
            v-if="item.inputType === 'select' && item[era]?.options"
            class="fee-select"
            :value="getPoints(item)"
            @change="updateSelect(item, $event.target.value)"
          >
            <option v-for="opt in item[era].options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <!-- fixed型 -->
          <span v-else-if="item[era]?.fixedPoints != null" style="font-family:'IBM Plex Mono',monospace;font-size:13px">
            {{ item[era].fixedPoints }} 点
          </span>
          <!-- 存在しない -->
          <span v-else style="font-size:12px;color:var(--text-faint)">-</span>
        </td>
        <td v-if="showAmount" style="text-align:right">
          <input
            v-if="!isDisabled(item)"
            type="text"
            class="fee-input"
            :class="{ 'empty-input': item.isDetail && !getCount(item) }"
            style="max-width:90px;text-align:right"
            :value="fmtCount(getCount(item))"
            @change="updateCount(item, $event.target.value)"
          >
          <span v-else style="color:var(--text-faint)">-</span>
        </td>
        <td v-if="showAmount" class="num-cell">
          <span v-if="!isDisabled(item)">{{ formatYen(getAmount(item)) }}</span>
          <span v-else style="color:var(--text-faint)">-</span>
        </td>
      </tr>
      <tr v-if="showTotal" class="total-row">
        <td style="font-weight:700">合計</td>
        <td></td>
        <td v-if="showAmount" class="num-cell" style="font-weight:700">{{ fmtCount(totalCount()) }}</td>
        <td v-if="showAmount" class="num-cell" style="font-weight:700">{{ formatYen(totalAmount()) }}</td>
      </tr>
    </tbody>
  </table>
</template>
