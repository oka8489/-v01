<script setup>
import { inject, computed } from 'vue'
import { BASIC_FEES, PREPARATION_FEES, MANAGEMENT_FEES, HOMECARE_FEES, LONGTERM_FEES } from '../../data/fee-definitions.js'
import { CHANGE_TYPES } from '../../utils/constants.js'
import BadgeLabel from '../shared/BadgeLabel.vue'

const { data } = inject('storage')

const allCategories = [
  { label: 'A. 調剤基本料・体制加算', items: BASIC_FEES },
  { label: 'B. 薬剤調製料', items: PREPARATION_FEES },
  { label: 'C. 薬学管理料', items: MANAGEMENT_FEES },
  { label: 'D. 在宅等', items: HOMECARE_FEES },
  { label: 'E. 介護', items: LONGTERM_FEES },
]

function getR6Points(item) {
  if (!item.r6) return null
  if (item.r6.fixedPoints != null) return item.r6.fixedPoints
  const sel = data.r6[item.id]
  if (sel != null) return sel
  if (item.r6.options?.length) return item.r6.options[0].value
  return null
}

function getR8Points(item) {
  if (!item.r8) return null
  if (item.r8.fixedPoints != null) return item.r8.fixedPoints
  const sel = data.r8[item.id]
  if (sel != null) return sel
  if (item.r8.options?.length) return item.r8.options[0].value
  return null
}

function diffClass(r6, r8) {
  if (r6 == null || r8 == null) return ''
  if (r8 > r6) return 'diff-pos'
  if (r8 < r6) return 'diff-neg'
  return 'diff-zero'
}

function formatDiff(r6, r8) {
  if (r6 == null && r8 != null) return '+' + r8
  if (r8 == null && r6 != null) return '-' + r6
  if (r6 == null && r8 == null) return '-'
  const d = r8 - r6
  if (d > 0) return '+' + d
  if (d < 0) return '' + d
  return '0'
}
</script>

<template>
  <div>
    <div class="section">
      <div class="section-title">R6 → R8 点数比較一覧</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
        点数設定タブで選択した区分に基づき、全項目の改定前後の点数を比較します。
      </p>

      <table class="compare-table">
        <thead>
          <tr>
            <th style="width:280px">項目</th>
            <th style="width:100px">R6（現行）</th>
            <th style="width:100px">R8（改定後）</th>
            <th style="width:80px">増減</th>
            <th style="width:80px">変更区分</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="cat in allCategories" :key="cat.label">
            <tr class="cat-header">
              <td colspan="5">{{ cat.label }}</td>
            </tr>
            <tr
              v-for="item in cat.items"
              :key="item.id"
              :class="{
                'new-row': item.changeType === 'new',
                'abolished-row': item.changeType === 'abolished'
              }"
            >
              <td class="label-cell">
                {{ item.label }}
                <BadgeLabel :type="item.changeType" />
              </td>
              <td style="text-align:center;font-family:'IBM Plex Mono',monospace">
                {{ getR6Points(item) ?? '-' }}
              </td>
              <td style="text-align:center;font-family:'IBM Plex Mono',monospace">
                {{ getR8Points(item) ?? '-' }}
              </td>
              <td :class="diffClass(getR6Points(item), getR8Points(item))" style="text-align:center;font-family:'IBM Plex Mono',monospace">
                {{ formatDiff(getR6Points(item), getR8Points(item)) }}
              </td>
              <td style="text-align:center">
                <BadgeLabel :type="item.changeType" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
