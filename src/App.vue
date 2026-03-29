<script setup>
import { ref, provide } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import TabNavigation from './components/layout/TabNavigation.vue'
import OverviewTab from './components/tabs/OverviewTab.vue'
import InputTab from './components/tabs/InputTab.vue'
import R8Tab from './components/tabs/R8Tab.vue'
import ImpactTab from './components/tabs/ImpactTab.vue'
import TasksTab from './components/tabs/TasksTab.vue'
import RequirementsTab from './components/tabs/RequirementsTab.vue'
import { useStorage } from './composables/useStorage.js'

const tabs = [
  { id: 'overview', label: '概要' },
  { id: 'houshu', label: '報酬改定' },
  { id: 'impact', label: '経営影響' },
  { id: 'tasks', label: '事務タスク' },
  { id: 'requirements', label: '施設基準' },
]

const activeTab = ref('overview')
const activeSubTab = ref('r7')

const storage = useStorage()
provide('storage', storage)
</script>

<template>
  <div class="container">
    <AppHeader :storage="storage" />
    <TabNavigation :tabs="tabs" v-model="activeTab" />

    <OverviewTab v-if="activeTab === 'overview'" />

    <div v-if="activeTab === 'houshu'">
      <div class="sub-tabs">
        <button class="sub-tab" :class="{ active: activeSubTab === 'r7' }" @click="activeSubTab = 'r7'">
          <span class="era-pill era-r6">R6</span> R7実績
        </button>
        <button class="sub-tab" :class="{ active: activeSubTab === 'r8' }" @click="activeSubTab = 'r8'">
          <span class="era-pill era-r8">R8</span> R8予測
        </button>
      </div>
      <InputTab v-if="activeSubTab === 'r7'" />
      <R8Tab v-if="activeSubTab === 'r8'" />
    </div>

    <ImpactTab v-if="activeTab === 'impact'" />
    <TasksTab v-if="activeTab === 'tasks'" />
    <RequirementsTab v-if="activeTab === 'requirements'" />
  </div>
</template>

<style>
.sub-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 4px;
}
.sub-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius);
  color: var(--text-muted);
  transition: all .15s;
  font-family: inherit;
}
.sub-tab:hover { background: var(--surface2); color: var(--text); }
.sub-tab.active[class*="r7"] { background: var(--r6-bg); color: var(--r6); border: 1px solid var(--r6-border); }
.sub-tab.active[class*="r8"] { background: var(--r8-bg); color: var(--r8); border: 1px solid var(--r8-border); }

/* activeクラスの色分け - ボタンの内容で判定 */
.sub-tab.active:first-child { background: var(--r6-bg); color: var(--r6); border: 1px solid var(--r6-border); }
.sub-tab.active:last-child { background: var(--r8-bg); color: var(--r8); border: 1px solid var(--r8-border); }
</style>
