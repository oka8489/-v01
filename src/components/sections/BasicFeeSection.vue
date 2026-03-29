<script setup>
import { BASIC_FEES } from '../../data/fee-definitions.js'
import FeeTable from '../shared/FeeTable.vue'

defineProps({ data: Object, era: { type: String, default: 'r6' } })
</script>

<template>
  <div class="section">
    <div class="section-title">A. 調剤基本料・体制加算</div>
    <FeeTable :items="BASIC_FEES" :data="data" :era="era" showTotal />
  </div>
</template>
