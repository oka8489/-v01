// Main App
const app = createApp({
  components:{OverviewTab,InputTab,R8InputTab,ImpactTab,TasksTab,RequirementsTab},
  setup() {
    const data = reactive(getDefaultData())
    const activeTab = ref('overview')

    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { try { const p = JSON.parse(saved); for (const k of Object.keys(p)) data[k] = p[k] } catch{} }

    // Auto-save to localStorage
    watch(data, ()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, {deep:true})

    async function loadR7Data() {
      try {
        const res = await fetch('data/r7_extracted.json')
        if (!res.ok) throw new Error('fetch failed: ' + res.status)
        const json = await res.json()
        if (!data.r6) data.r6 = {}
        // Merge r6 object
        if (json.r6) {
          const merged = {}
          for (const [k,v] of Object.entries(json.r6.toukei||{})) { if (!k.startsWith('_')) merged[k] = v }
          for (const [k,v] of Object.entries(json.r6.kasan||{})) { if (!k.startsWith('_')) merged[k] = v }
          data.r6 = merged
          // R8の初期値としてR7実績をコピー（R8がまだ空の場合）
          if (Object.keys(r8Data.r6).length === 0) {
            r8Data.r6 = JSON.parse(JSON.stringify(merged))
          }
        }
        // Merge pharmacy name and period
        if (json.pharmacyName) data.pharmacyName = json.pharmacyName
        console.log('実績データ読込完了:', json.pharmacyName, json.period)
      } catch (e) { console.error('実績データ読込失敗:', e.message) }
    }

    function clearR7Data() {
      if (!confirm('実績データをクリアしますか？')) return
      data.r6 = {}
      data.pharmacyName = ''
      localStorage.removeItem(STORAGE_KEY)
    }

    // R8用の独立したリアクティブオブジェクト（.r6にR8データを格納）
    const r8Data = reactive({ r6: {} })

    async function loadR8Data() {
      try {
        const res = await fetch('data/r7_extracted.json')
        if (!res.ok) throw new Error('fetch failed: ' + res.status)
        const json = await res.json()
        if (json.r6) {
          const merged = {}
          for (const [k,v] of Object.entries(json.r6.toukei||{})) { if (!k.startsWith('_')) merged[k] = v }
          for (const [k,v] of Object.entries(json.r6.kasan||{})) { if (!k.startsWith('_')) merged[k] = v }
          r8Data.r6 = merged
        }
        console.log('R8実績データ読込完了:', json.pharmacyName, json.period)
      } catch (e) { console.error('R8実績データ読込失敗:', e.message) }
    }

    function clearR8Data() {
      if (!confirm('R8予測データをクリアしますか？')) return
      r8Data.r6 = {}
    }

    provide('storage', { data })
    const activeSubTab = ref('r7')
    return { data, r8Data, activeTab, activeSubTab, loadR7Data, clearR7Data, loadR8Data, clearR8Data }
  },
  template: `<div class="container"><div class="hero"><div><h1>令和8年度 調剤報酬改定</h1><p>2026年6月施行 報酬改定管理システム</p></div></div><div class="tabs"><button class="tab" :class="{active:activeTab==='overview'}" @click="activeTab='overview'">概要</button><button class="tab" :class="{active:activeTab==='houshu'}" @click="activeTab='houshu'">シミュレータ</button><button class="tab" :class="{active:activeTab==='tasks'}" @click="activeTab='tasks'">事務タスク</button><button class="tab" :class="{active:activeTab==='requirements'}" @click="activeTab='requirements'">施設基準・要件</button></div><overview-tab v-if="activeTab==='overview'"/><div v-if="activeTab==='houshu'"><div class="sub-tabs"><button class="sub-tab" :class="{active:activeSubTab==='r7'}" @click="activeSubTab='r7'"><span class="era-pill era-r6">R6</span> R7実績</button><button class="sub-tab" :class="{active:activeSubTab==='r8'}" @click="activeSubTab='r8'"><span class="era-pill era-r8">R8</span> R8予測</button><button class="sub-tab" :class="{active:activeSubTab==='impact'}" @click="activeSubTab='impact'">経営影響</button></div><input-tab v-if="activeSubTab==='r7'" :data="data" :load-fn="loadR7Data" :clear-fn="clearR7Data"/><r8-input-tab v-if="activeSubTab==='r8'" :data="r8Data" :load-fn="loadR8Data" :clear-fn="clearR8Data"/><impact-tab v-if="activeSubTab==='impact'" :data="data" :r8-data="r8Data"/></div><tasks-tab v-if="activeTab==='tasks'" :data="data"/><requirements-tab v-if="activeTab==='requirements'" :data="data"/></div>`
})

app.mount('#app')
