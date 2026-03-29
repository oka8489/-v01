<script setup>
const props = defineProps({ storage: Object })

function handleExport() {
  props.storage.exportJSON()
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) props.storage.importJSON(file)
  }
  input.click()
}
</script>

<template>
  <div class="hero">
    <div>
      <h1>令和8年度 調剤報酬改定</h1>
      <p>2026年6月施行 報酬改定管理システム</p>
    </div>
    <div class="hero-actions">
      <button class="btn" style="color:white;border-color:rgba(255,255,255,0.3);background:transparent" @click="handleExport">
        JSON保存
      </button>
      <button class="btn" style="color:white;border-color:rgba(255,255,255,0.3);background:transparent" @click="handleImport">
        JSON読込
      </button>
    </div>
  </div>
</template>
