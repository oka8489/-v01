<script setup>
import { CHANGE_TYPES } from '../../utils/constants.js'
const props = defineProps({ type: String })
</script>

<template>
  <span v-if="type && type !== 'same' && CHANGE_TYPES[type]" class="badge" :class="CHANGE_TYPES[type].class">
    {{ CHANGE_TYPES[type].label }}
  </span>
</template>
