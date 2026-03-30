<script setup>
import { LONGTERM_FEES } from '../../data/fee-definitions.js'
import FeeTable from '../shared/FeeTable.vue'

defineProps({ data: Object })
</script>

<template>
  <div class="section">
    <div class="section-title">E. 介護（単位制）</div>
    <FeeTable :items="LONGTERM_FEES" :data="data" era="r6" showTotal />
  </div>
</template>
