import { reactive, watch } from 'vue'

const STORAGE_KEY = 'houshu-kaitei-data'

function getDefaultData() {
  return {
    version: '1.0',
    pharmacyName: '',
    r6: {},
    r8: {},
    annualReward: 0,
    annualDrugCost: 0,
    tasks: {},
    requirements: {},
    drugPriceRate: 4.02,
    drugPriceEnabled: true,
  }
}

export function useStorage() {
  const data = reactive(getDefaultData())
  let apiLoaded = false

  // APIからロード（優先）、失敗時はlocalStorage
  fetch('/api/data')
    .then(r => {
      console.log('[useStorage] API status:', r.status)
      return r.json()
    })
    .then(serverData => {
      if (serverData && serverData.version) {
        Object.keys(getDefaultData()).forEach(k => delete data[k])
        Object.assign(data, serverData)
        apiLoaded = true
        startWatch()
      }
    })
    .catch(() => {
      // API不通→localStorageからロード
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          for (const key of Object.keys(parsed)) {
            data[key] = parsed[key]
          }
        } catch {}
      }
      startWatch()
    })

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          && target[key] && typeof target[key] === 'object') {
        deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  // debounce付き保存（APIロード完了後に開始）
  let saveTimer = null
  function startWatch() {
    watch(data, () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        }).catch(() => {})
      }, 500)
    }, { deep: true })
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `houshu-kaitei-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        Object.assign(data, { ...getDefaultData(), ...imported })
      } catch (err) {
        alert('JSONファイルの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
  }

  function reset() {
    Object.assign(data, getDefaultData())
  }

  return { data, exportJSON, importJSON, reset }
}
