<script setup>
import { PREPARATION_FEES } from '../../data/fee-definitions.js'
import FeeTable from '../shared/FeeTable.vue'

defineProps({ data: Object, era: { type: String, default: 'r6' } })
</script>

<template>
  <div class="section">
    <div class="section-title">B. 薬剤調製料</div>
    <FeeTable :items="PREPARATION_FEES" :data="data" :era="era" />
  </div>
</template>
