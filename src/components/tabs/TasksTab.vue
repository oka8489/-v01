<script setup>
import { inject, computed } from 'vue'
import { TASK_DEFINITIONS } from '../../data/task-definitions.js'

const { data } = inject('storage')

const categories = [
  { label: '届出の変更・新規・取り下げ', ids: ['t01','t02','t03','t04','t05','t06','t07','t08'] },
  { label: '施設基準・要件の確認', ids: ['t10','t11','t12','t13','t14','t15'] },
  { label: '事務・システム対応', ids: ['t20','t21','t22','t23','t24','t25','t26','t27'] },
  { label: '経過措置の期限管理', ids: ['t30','t31'] },
]

const progress = computed(() => {
  const total = Object.keys(TASK_DEFINITIONS).length
  const done = Object.values(data.tasks).filter(Boolean).length
  return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 }
})

function toggle(id) {
  data.tasks[id] = !data.tasks[id]
}
</script>

<template>
  <div>
    <div class="section">
      <div class="section-title">事務タスク進捗</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="font-size:13px;font-weight:600">{{ progress.done }} / {{ progress.total }} 完了</div>
        <div style="font-size:13px;color:var(--text-muted)">（{{ progress.pct }}%）</div>
      </div>
      <div class="req-progress">
        <div class="req-progress-bar" :style="{ width: progress.pct + '%' }"></div>
      </div>
    </div>

    <div v-for="cat in categories" :key="cat.label" class="section">
      <div class="section-title">{{ cat.label }}</div>
      <ul class="task-list">
        <li
          v-for="id in cat.ids"
          :key="id"
          class="task-item"
          :class="{ done: data.tasks[id] }"
        >
          <input
            type="checkbox"
            class="task-check"
            :checked="data.tasks[id]"
            @change="toggle(id)"
          >
          <div class="task-content">
            <div class="task-title">{{ TASK_DEFINITIONS[id]?.title }}</div>
            <div class="task-detail" v-if="TASK_DEFINITIONS[id]?.detail">{{ TASK_DEFINITIONS[id].detail }}</div>
            <div v-if="TASK_DEFINITIONS[id]?.deadline" style="font-size:11px;color:var(--neg);margin-top:2px">
              期限: {{ TASK_DEFINITIONS[id].deadline }}
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
