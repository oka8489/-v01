<script setup>
import { HOMECARE_FEES } from '../../data/fee-definitions.js'
import FeeTable from '../shared/FeeTable.vue'

defineProps({ data: Object, era: { type: String, default: 'r6' } })
</script>

<template>
  <div class="section">
    <div class="section-title">D. 在宅等</div>
    <FeeTable :items="HOMECARE_FEES" :data="data" :era="era" showTotal />
  </div>
</template>
