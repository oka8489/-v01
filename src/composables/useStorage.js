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
  const saved = localStorage.getItem(STORAGE_KEY)
  const data = reactive(saved ? { ...getDefaultData(), ...JSON.parse(saved) } : getDefaultData())

  watch(data, () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, { deep: true })

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
