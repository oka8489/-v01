<script setup>
import { inject } from 'vue'
import { useCalculation } from '../../composables/useCalculation.js'
import { formatYen, formatDiff, formatDiffPercent } from '../../utils/formatters.js'

const { data } = inject('storage')
const calc = useCalculation(data)
</script>

<template>
  <div>
    <div class="section">
      <div class="section-title">R7→R8 年間売上予測</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
        実績管理タブに月次データを入力し、点数設定タブで件数を入力すると、年間ベースの影響を試算します。
      </p>

      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi-card info">
          <div class="kpi-label">R7 年間売上（実績ベース）</div>
          <div class="kpi-value" style="font-size:18px">{{ formatYen(calc.annualStats.value.annualReward) }}</div>
          <div class="kpi-unit">円（年間実績）</div>
        </div>
        <div class="kpi-card" :class="calc.totalDiff.value >= 0 ? 'positive' : 'negative'">
          <div class="kpi-label">R8 年間売上（予測）</div>
          <div class="kpi-value" style="font-size:18px">{{ formatYen(calc.r8AnnualForecast.value) }}</div>
          <div class="kpi-unit">円</div>
        </div>
        <div class="kpi-card" :class="calc.totalDiff.value >= 0 ? 'positive' : 'negative'">
          <div class="kpi-label">増減額（増減率）</div>
          <div class="kpi-value" style="font-size:18px">{{ formatDiff(calc.totalDiff.value) }}</div>
          <div class="kpi-unit">{{ formatDiffPercent(calc.totalDiffPct.value) }}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">影響内訳</div>
      <div class="kpi-grid">
        <div class="kpi-card" :class="calc.gijutsuDiff.value >= 0 ? 'positive' : 'negative'">
          <div class="kpi-label">技術料 増減（点数設定ベース）</div>
          <div class="kpi-value" style="font-size:16px">{{ formatDiff(calc.gijutsuDiff.value) }}</div>
          <div class="kpi-unit">R8合計 − R6合計</div>
        </div>
        <div class="kpi-card" :class="calc.drugPriceImpact.value >= 0 ? 'positive' : 'negative'">
          <div class="kpi-label">薬価改定 影響</div>
          <div class="kpi-value" style="font-size:16px">{{ formatDiff(calc.drugPriceImpact.value) }}</div>
          <div class="kpi-unit">薬剤費ベース ▲{{ data.drugPriceRate }}%</div>
        </div>
        <div class="kpi-card" :class="calc.newFeeImpact.value > 0 ? 'positive' : ''">
          <div class="kpi-label">新設加算 増収見込み</div>
          <div class="kpi-value" style="font-size:16px">{{ formatDiff(calc.newFeeImpact.value) }}</div>
          <div class="kpi-unit">物価対応料＋ベースアップ＋バイオ等</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">カテゴリ別 R6 vs R8 比較</div>
      <table class="compare-table">
        <thead>
          <tr>
            <th style="text-align:left">カテゴリ</th>
            <th>R6 合計</th>
            <th>R8 合計</th>
            <th>増減</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:left;font-family:inherit">A. 調剤基本料・体制加算</td>
            <td>{{ formatYen(calc.r6BasicTotal.value) }}</td>
            <td>{{ formatYen(calc.r8BasicTotal.value) }}</td>
            <td :class="calc.r8BasicTotal.value - calc.r6BasicTotal.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.r8BasicTotal.value - calc.r6BasicTotal.value) }}
            </td>
          </tr>
          <tr>
            <td style="text-align:left;font-family:inherit">B. 薬剤調製料</td>
            <td>{{ formatYen(calc.r6PrepTotal.value) }}</td>
            <td>{{ formatYen(calc.r8PrepTotal.value) }}</td>
            <td :class="calc.r8PrepTotal.value - calc.r6PrepTotal.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.r8PrepTotal.value - calc.r6PrepTotal.value) }}
            </td>
          </tr>
          <tr>
            <td style="text-align:left;font-family:inherit">C. 薬学管理料</td>
            <td>{{ formatYen(calc.r6MgmtTotal.value) }}</td>
            <td>{{ formatYen(calc.r8MgmtTotal.value) }}</td>
            <td :class="calc.r8MgmtTotal.value - calc.r6MgmtTotal.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.r8MgmtTotal.value - calc.r6MgmtTotal.value) }}
            </td>
          </tr>
          <tr>
            <td style="text-align:left;font-family:inherit">D. 在宅等</td>
            <td>{{ formatYen(calc.r6HomeTotal.value) }}</td>
            <td>{{ formatYen(calc.r8HomeTotal.value) }}</td>
            <td :class="calc.r8HomeTotal.value - calc.r6HomeTotal.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.r8HomeTotal.value - calc.r6HomeTotal.value) }}
            </td>
          </tr>
          <tr>
            <td style="text-align:left;font-family:inherit">E. 介護</td>
            <td>{{ formatYen(calc.r6LtcTotal.value) }}</td>
            <td>{{ formatYen(calc.r8LtcTotal.value) }}</td>
            <td :class="calc.r8LtcTotal.value - calc.r6LtcTotal.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.r8LtcTotal.value - calc.r6LtcTotal.value) }}
            </td>
          </tr>
          <tr class="total-row" style="font-weight:700">
            <td style="text-align:left;font-family:inherit">合計</td>
            <td>{{ formatYen(calc.r6Total.value) }}</td>
            <td>{{ formatYen(calc.r8Total.value) }}</td>
            <td :class="calc.gijutsuDiff.value >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ formatDiff(calc.gijutsuDiff.value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">薬価改定設定</div>
      <div style="display:flex;align-items:center;gap:12px;font-size:13px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="data.drugPriceEnabled" style="accent-color:var(--pos)">
          薬価引き下げを反映
        </label>
        <div style="display:flex;align-items:center;gap:4px">
          ▲
          <input
            type="number"
            v-model.number="data.drugPriceRate"
            step="0.01"
            min="0"
            max="20"
            class="fee-input"
            style="max-width:80px"
          >
          %
        </div>
      </div>
    </div>
  </div>
</template>
