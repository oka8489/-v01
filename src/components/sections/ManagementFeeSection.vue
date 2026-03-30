<script setup>
import { MANAGEMENT_FEES } from '../../data/fee-definitions.js'
import FeeTable from '../shared/FeeTable.vue'

defineProps({ data: Object })
</script>

<template>
  <div class="section">
    <div class="section-title">C. 薬学管理料</div>
    <FeeTable :items="MANAGEMENT_FEES" :data="data" era="r6" showTotal />
  </div>
</template>
