<script setup>
import { inject, computed } from 'vue'
import { REQUIREMENT_DEFINITIONS } from '../../data/requirement-definitions.js'

const { data } = inject('storage')

function toggle(id) {
  data.requirements[id] = !data.requirements[id]
}

function groupProgress(group) {
  const total = group.items.length
  const done = group.items.filter(i => data.requirements[i.id]).length
  return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 }
}
</script>

<template>
  <div>
    <div v-for="group in REQUIREMENT_DEFINITIONS" :key="group.id" class="section">
      <div class="section-title">
        {{ group.label }}
        <span style="font-size:12px;color:var(--text-muted);font-weight:400;margin-left:8px">
          {{ groupProgress(group).done }}/{{ groupProgress(group).total }}
        </span>
      </div>
      <div class="req-progress" style="margin-bottom:12px">
        <div class="req-progress-bar" :style="{ width: groupProgress(group).pct + '%' }"></div>
      </div>
      <div v-for="item in group.items" :key="item.id" class="req-item">
        <input
          type="checkbox"
          class="req-check"
          :checked="data.requirements[item.id]"
          @change="toggle(item.id)"
        >
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>
