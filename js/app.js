// Main App
const app = createApp({
  components:{OverviewTab,InputTab,R8InputTab,ImpactTab,TasksTab,RequirementsTab,TodoTab},
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
          // 服薬管理指導料2: b(手帳なし) + c(3月超) を合算して1行に
          const fukuBr7 = merged.t_fukuyaku_b_cnt || merged.k_fukuyaku_b_cnt || 0
          const fukuCr7 = merged.t_fukuyaku_c_cnt || merged.k_fukuyaku_c_cnt || 0
          merged.t_fukuyaku_c_cnt = fukuBr7 + fukuCr7
          merged.k_fukuyaku_c_cnt = fukuBr7 + fukuCr7
          // 在宅患者重複投薬等管理料: 旧単一ID→残薬/残薬以外に振り分け
          if (merged.t_zaitaku_boushi_cnt && !merged.t_zaitaku_boushi_zan_cnt && !merged.t_zaitaku_boushi_other_cnt) {
            const cnt = merged.t_zaitaku_boushi_cnt
            const amt = merged.t_zaitaku_boushi_amt || 0
            const ptsPerCase = cnt > 0 ? Math.round(amt / cnt / 10) : 0
            if (ptsPerCase <= 20) {
              // 全件が残薬(20点)
              merged.t_zaitaku_boushi_zan_cnt = cnt
              merged.t_zaitaku_boushi_zan_amt = amt
            } else if (ptsPerCase >= 40) {
              // 全件が残薬以外(40点)
              merged.t_zaitaku_boushi_other_cnt = cnt
              merged.t_zaitaku_boushi_other_amt = amt
            } else {
              // 混在: 連立方程式で按分 (20x + 40y = amt/10, x + y = cnt)
              const otherCnt = Math.round((amt / 10 - cnt * 20) / 20)
              const zanCnt = cnt - otherCnt
              merged.t_zaitaku_boushi_other_cnt = otherCnt
              merged.t_zaitaku_boushi_other_amt = otherCnt * 40 * 10
              merged.t_zaitaku_boushi_zan_cnt = zanCnt
              merged.t_zaitaku_boushi_zan_amt = zanCnt * 20 * 10
            }
          }
          data.r6 = merged
          // R8にも件数・統計値を反映（プルダウン選択値は保持）
          const r7selects = {}
          for (const [k,v] of Object.entries(r8Data.r6)) {
            if (!k.endsWith('_cnt') && !k.endsWith('_amt') && !k.startsWith('t_')) r7selects[k] = v
          }
          const r8fromR7 = {}
          for (const [k,v] of Object.entries(merged)) {
            if (k.includes('mukin')) continue  // 無菌はR8で手入力
            if (k.endsWith('_cnt') || k.endsWith('_amt') || k.startsWith('t_')) r8fromR7[k] = v
          }
          if (merged.t_rx_count) {
            r8fromR7.k_baseup_cnt = merged.t_rx_count
          }
          // 賃上げ充当分（控除）: ベースアップ評価料の収入を全額マイナス
          // ※実際のR8データでk_baseupの点数が決まってから再計算するためここでは仮設定
          // かかりつけ薬剤師の件数（複数ブロックで使用）
          const kakaShido = merged.t_kakaritsuke_shido_cnt || merged.k_kakaritsuke_shido_cnt || 0
          const kakaHokatsu = merged.t_kakaritsuke_hokatsu_cnt || merged.k_kakaritsuke_hokatsu_cnt || 0
          const kakaTotal = kakaShido + kakaHokatsu
          // 包括管理料廃止 → 調剤基本料・薬剤調製料（内服）・調剤管理料に件数加算
          r8fromR7.k_kihon_cnt = (merged.k_kihon_cnt || 0) + kakaHokatsu
          r8fromR7.k_naifuku_cnt = (merged.k_naifuku_cnt || 0) + kakaHokatsu
          r8fromR7.t_kanri_nai_cnt = (merged.t_kanri_nai_cnt || 0) + kakaHokatsu
          // 重複防止加算・在宅重複投薬管理料 → 有害事象等防止加算・残薬調整加算
          // R8イロハ = 在宅 又は かかりつけ薬剤師 → 外来分からかかりつけ比率で按分
          const jufukuOther = merged.t_jufuku_other_cnt || 0
          const jufukuZan = merged.t_jufuku_zan_cnt || 0
          const zaitakuOther = merged.t_zaitaku_boushi_other_cnt || 0
          const zaitakuZan = merged.t_zaitaku_boushi_zan_cnt || merged.t_zaitaku_boushi_cnt || 0
          const kakaRatio = merged.t_rx_count ? kakaTotal / merged.t_rx_count : 0
          const yugaiKaka = Math.round(jufukuOther * kakaRatio)
          const zanyakuKaka = Math.round(jufukuZan * kakaRatio)
          // ニ（その他）= 外来 − かかりつけ分
          r8fromR7.t_yugai1_cnt = jufukuOther - yugaiKaka
          r8fromR7.t_zanyaku1_cnt = jufukuZan - zanyakuKaka
          // イロハ（在宅又はかかりつけ）= 在宅 + かかりつけ分
          r8fromR7.t_yugai2_cnt = zaitakuOther + yugaiKaka
          r8fromR7.t_zanyaku2_cnt = zaitakuZan + zanyakuKaka
          // 親（count-only）の金額を算出
          r8fromR7.t_yugai_amt = (r8fromR7.t_yugai1_cnt * 30 + r8fromR7.t_yugai2_cnt * 50) * 10
          r8fromR7.t_zanyaku_amt = (r8fromR7.t_zanyaku1_cnt * 30 + r8fromR7.t_zanyaku2_cnt * 50) * 10
          // 廃止項目をクリア
          delete r8fromR7.t_zaitaku_boushi_cnt
          delete r8fromR7.t_zaitaku_boushi_amt
          // 電子的調剤情報連携体制整備加算 = DX8 + DX6 + DX10 の合算
          r8fromR7.k_dx8_cnt = (merged.k_dx8_cnt || 0) + (merged.k_dx6_cnt || 0) + (merged.k_dx10_cnt || 0)
          // 服薬管理指導料4: R7→R8マッピング
          // R7の4イ(3月以内) → R8の4イ（そのまま）
          r8fromR7.t_fukuyaku_online_i_cnt = merged.t_fukuyaku_online_cnt || merged.k_fukuyaku_online_cnt || 0
          // R7の4ロ(4イ以外) → R8の4ニ（その他）
          r8fromR7.t_fukuyaku_online_ni_cnt = merged.t_fukuyaku_online_ro_r6_cnt || merged.k_fukuyaku_online_ro_r6_cnt || 0
          // 在宅患者オンライン薬剤管理指導料 → R8の4ロ
          r8fromR7.t_fukuyaku_online_ro_cnt = merged.t_zaitaku_online_cnt || 0
          // 在宅患者緊急オンライン薬剤管理指導料 → R8の4ハ
          r8fromR7.t_fukuyaku_online_ha_cnt = merged.t_zaitaku_kinkyu_online_cnt || 0
          // 在宅薬学総合体制加算2 イ・ロ
          r8fromR7.k_zaitaku_taisei2i_cnt = merged.k_zaitaku_houmon_1_cnt || 0  // 単一1人
          r8fromR7.k_zaitaku_taisei2ro_cnt = merged.k_zaitaku_houmon_other_cnt || 0  // 1人以外
          // 服薬管理指導料: R7→R8マッピング
          const techoRate = (merged.t_techo_rate || 91) / 100  // 手帳持参率
          const renkei = merged.t_fukuyaku_renkei_cnt || merged.k_fukuyaku_renkei_cnt || merged.k_renkei_cnt || 0  // 連携薬剤師特例
          // 指導料+包括管理料 → 1イ・2イ（手帳持参率で按分）
          r8fromR7.t_fukuyaku_a_i_cnt = Math.round(kakaTotal * techoRate)
          r8fromR7.t_fukuyaku_c_i_cnt = Math.round(kakaTotal * (1 - techoRate))
          // 連携薬剤師特例 → 1ロ・2ロに加算（手帳持参率で按分）
          const renkei1ro = Math.round(renkei * techoRate)
          const renkei2ro = Math.round(renkei * (1 - techoRate))
          // R7の通常分（かかりつけ以外）→ R8の1ロ・2ロ
          r8fromR7.t_fukuyaku_a_ro_cnt = (merged.t_fukuyaku_a_cnt || merged.k_fukuyaku_a_cnt || 0) + renkei1ro
          // merged.t_fukuyaku_c_cnt は既にB+C合算済み（line 29）
          const fukuBC = merged.t_fukuyaku_c_cnt || merged.k_fukuyaku_c_cnt || 0
          r8fromR7.t_fukuyaku_c_cnt = fukuBC
          r8fromR7.t_fukuyaku_c_ro_cnt = fukuBC + renkei2ro
          Object.assign(r8fromR7, r7selects)
          r8Data.r6 = r8fromR7
        }
        // Merge pharmacy name and period
        if (json.pharmacyName) data.pharmacyName = json.pharmacyName
        if (json.period) data.period = json.period
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
    // R8データをlocalStorageから復元
    const r8Saved = localStorage.getItem('houshu-r8-data')
    if (r8Saved) { try { const p = JSON.parse(r8Saved); if (p.r6) r8Data.r6 = p.r6 } catch{} }
    // R8データをlocalStorageに自動保存
    watch(r8Data, ()=>{ localStorage.setItem('houshu-r8-data', JSON.stringify(r8Data)) }, {deep:true})

    async function loadR8Data() {
      try {
        const res = await fetch('data/r7_extracted.json')
        if (!res.ok) throw new Error('fetch failed: ' + res.status)
        const json = await res.json()
        if (json.r6) {
          const merged = {}
          for (const [k,v] of Object.entries(json.r6.toukei||{})) { if (!k.startsWith('_')) merged[k] = v }
          for (const [k,v] of Object.entries(json.r6.kasan||{})) { if (!k.startsWith('_')) merged[k] = v }
          // 既存のプルダウン選択値を退避
          const selects = {}
          for (const [k,v] of Object.entries(r8Data.r6)) {
            if (!k.endsWith('_cnt') && !k.endsWith('_amt') && !k.startsWith('t_')) selects[k] = v
          }
          // mergedから件数・金額・統計値をコピー
          const r8new = {}
          for (const [k,v] of Object.entries(merged)) {
            if (k.includes('mukin')) continue  // 無菌はR8で手入力
            if (k.endsWith('_cnt') || k.endsWith('_amt') || k.startsWith('t_')) r8new[k] = v
          }
          // 新設項目の件数をR7統計値から推定
          if (merged.t_rx_count) {
            r8new.k_baseup_cnt = merged.t_rx_count
          }
          // 重複防止加算・在宅重複投薬管理料 → 有害事象等防止加算・残薬調整加算
          const kakaShido2 = merged.t_kakaritsuke_shido_cnt || merged.k_kakaritsuke_shido_cnt || 0
          const kakaHokatsu2 = merged.t_kakaritsuke_hokatsu_cnt || merged.k_kakaritsuke_hokatsu_cnt || 0
          const kakaTotal2 = kakaShido2 + kakaHokatsu2
          // 包括管理料廃止 → 調剤基本料・薬剤調製料（内服）・調剤管理料に件数加算
          r8new.k_kihon_cnt = (merged.k_kihon_cnt || 0) + kakaHokatsu2
          r8new.k_naifuku_cnt = (merged.k_naifuku_cnt || 0) + kakaHokatsu2
          r8new.t_kanri_nai_cnt = (merged.t_kanri_nai_cnt || 0) + kakaHokatsu2
          const jufukuOther2 = merged.t_jufuku_other_cnt || 0
          const jufukuZan2 = merged.t_jufuku_zan_cnt || 0
          const zaitakuOther2 = merged.t_zaitaku_boushi_other_cnt || 0
          const zaitakuZan2 = merged.t_zaitaku_boushi_zan_cnt || merged.t_zaitaku_boushi_cnt || 0
          const kakaRatio2 = merged.t_rx_count ? kakaTotal2 / merged.t_rx_count : 0
          const yugaiKaka2 = Math.round(jufukuOther2 * kakaRatio2)
          const zanyakuKaka2 = Math.round(jufukuZan2 * kakaRatio2)
          r8new.t_yugai1_cnt = jufukuOther2 - yugaiKaka2
          r8new.t_zanyaku1_cnt = jufukuZan2 - zanyakuKaka2
          r8new.t_yugai2_cnt = zaitakuOther2 + yugaiKaka2
          r8new.t_zanyaku2_cnt = zaitakuZan2 + zanyakuKaka2
          r8new.t_yugai_amt = (r8new.t_yugai1_cnt * 30 + r8new.t_yugai2_cnt * 50) * 10
          r8new.t_zanyaku_amt = (r8new.t_zanyaku1_cnt * 30 + r8new.t_zanyaku2_cnt * 50) * 10
          delete r8new.t_zaitaku_boushi_cnt
          delete r8new.t_zaitaku_boushi_amt
          // 電子的調剤情報連携体制整備加算 = DX8 + DX6 + DX10 の合算
          r8new.k_dx8_cnt = (merged.k_dx8_cnt || 0) + (merged.k_dx6_cnt || 0) + (merged.k_dx10_cnt || 0)
          // 服薬管理指導料4: R7→R8マッピング
          r8new.t_fukuyaku_online_i_cnt = merged.t_fukuyaku_online_cnt || merged.k_fukuyaku_online_cnt || 0  // R7の4イ → R8の4イ
          r8new.t_fukuyaku_online_ni_cnt = merged.t_fukuyaku_online_ro_r6_cnt || merged.k_fukuyaku_online_ro_r6_cnt || 0  // R7の4ロ → R8の4ニ
          r8new.t_fukuyaku_online_ro_cnt = merged.t_zaitaku_online_cnt || 0  // 在宅オンライン → R8の4ロ
          r8new.t_fukuyaku_online_ha_cnt = merged.t_zaitaku_kinkyu_online_cnt || 0  // 緊急オンライン → R8の4ハ
          r8new.k_zaitaku_taisei2i_cnt = merged.k_zaitaku_houmon_1_cnt || 0
          r8new.k_zaitaku_taisei2ro_cnt = merged.k_zaitaku_houmon_other_cnt || 0
          // 服薬管理指導料: R7→R8マッピング
          const techoRate2 = (merged.t_techo_rate || 91) / 100
          const renkei2 = merged.t_fukuyaku_renkei_cnt || merged.k_fukuyaku_renkei_cnt || merged.k_renkei_cnt || 0
          r8new.t_fukuyaku_a_i_cnt = Math.round(kakaTotal2 * techoRate2)
          r8new.t_fukuyaku_c_i_cnt = Math.round(kakaTotal2 * (1 - techoRate2))
          const renkei1ro2 = Math.round(renkei2 * techoRate2)
          const renkei2ro2 = Math.round(renkei2 * (1 - techoRate2))
          r8new.t_fukuyaku_a_ro_cnt = (merged.t_fukuyaku_a_cnt || merged.k_fukuyaku_a_cnt || 0) + renkei1ro2
          const fukuB2 = merged.t_fukuyaku_b_cnt || merged.k_fukuyaku_b_cnt || 0
          const fukuC2 = merged.t_fukuyaku_c_cnt || merged.k_fukuyaku_c_cnt || 0
          r8new.t_fukuyaku_c_cnt = fukuB2 + fukuC2
          r8new.t_fukuyaku_c_ro_cnt = fukuB2 + fukuC2 + renkei2ro2
          // プルダウン値を戻してからr6を丸ごと置き換え（reactivity確保）
          Object.assign(r8new, selects)
          r8Data.r6 = r8new
          console.log('R8セット完了:', 'baseup_cnt='+r8new.k_baseup_cnt, 'bukka_cnt='+r8new.k_bukka_cnt, 'yakan_cnt='+r8new.k_yakan_cnt, 'jikangai_amt='+r8new.k_jikangai_amt)
        }
        console.log('R8実績データ読込完了:', json.pharmacyName, json.period)
      } catch (e) { console.error('R8実績データ読込失敗:', e.message) }
    }

    function clearR8Data() {
      if (!confirm('R8予測データをクリアしますか？')) return
      r8Data.r6 = {}
      localStorage.removeItem('houshu-r8-data')
    }

    provide('storage', { data })
    const activeSubTab = ref('r7')
    const reqSubTab = ref('checklist')
    const todokeSubTab = ref('r8')
    const todokeReqMap = { chinage: 'k_baseup', taisei: 'k_kihon', chozai: 'ot_chozai', yakugaku: 'yg_kanri', zaitaku: 'yg_zaitaku' }
    const taskSubTab = ref('kanban')
    function goToJudge(feeId) { activeTab.value = 'requirements'; reqSubTab.value = feeId || 'judge' }
    return { data, r8Data, activeTab, activeSubTab, reqSubTab, todokeSubTab, todokeReqMap, taskSubTab, loadR7Data, clearR7Data, loadR8Data, clearR8Data, goToJudge }
  },
  template: `<div class="container"><div class="hero"><div><h1>令和8年度 調剤報酬改定</h1><p>2026年6月施行 報酬改定管理システム</p></div></div><div class="tabs"><button class="tab" :class="{active:activeTab==='overview'}" @click="activeTab='overview'">改定の概要</button><button class="tab" :class="{active:activeTab==='houshu'}" @click="activeTab='houshu'">シミュレータ</button><button class="tab" :class="{active:activeTab==='requirements'}" @click="activeTab='requirements'">加算</button><button class="tab" :class="{active:activeTab==='todoke'}" @click="activeTab='todoke'">届出等</button><button class="tab" :class="{active:activeTab==='tasks'}" @click="activeTab='tasks'">事務タスク</button><button class="tab" :class="{active:activeTab==='todo'}" @click="activeTab='todo'">TO DO</button></div><overview-tab v-if="activeTab==='overview'"/><div v-if="activeTab==='houshu'"><div class="sub-tabs"><button class="sub-tab" :class="{active:activeSubTab==='r7'}" @click="activeSubTab='r7'"><span class="era-pill era-r6">R6</span> R7実績</button><button class="sub-tab" :class="{active:activeSubTab==='r8'}" @click="activeSubTab='r8'"><span class="era-pill era-r8">R8</span> R8予測</button><button class="sub-tab" :class="{active:activeSubTab==='impact'}" @click="activeSubTab='impact'">経営コンサル</button></div><input-tab v-if="activeSubTab==='r7'" :data="data" :load-fn="loadR7Data" :clear-fn="clearR7Data"/><r8-input-tab v-if="activeSubTab==='r8'" :data="r8Data" :load-fn="loadR8Data" :clear-fn="clearR8Data" :go-to-judge="goToJudge"/><impact-tab v-if="activeSubTab==='impact'" :data="data" :r8-data="r8Data"/></div><div v-if="activeTab==='todoke'"><div class="sub-tabs"><button class="sub-tab" :class="{active:todokeSubTab==='r8'}" @click="todokeSubTab='r8'">R8改定</button><button class="sub-tab" :class="{active:todokeSubTab==='chinage'}" @click="todokeSubTab='chinage'">賃上げ</button><button class="sub-tab" :class="{active:todokeSubTab==='taisei'}" @click="todokeSubTab='taisei'">体制加算</button><button class="sub-tab" :class="{active:todokeSubTab==='chozai'}" @click="todokeSubTab='chozai'">薬剤調製料・薬剤料</button><button class="sub-tab" :class="{active:todokeSubTab==='yakugaku'}" @click="todokeSubTab='yakugaku'">薬学管理料</button><button class="sub-tab" :class="{active:todokeSubTab==='zaitaku'}" @click="todokeSubTab='zaitaku'">在宅</button><button class="sub-tab" :class="{active:todokeSubTab==='kaigo'}" @click="todokeSubTab='kaigo'">介護</button></div><tasks-tab :data="data" :force-view="'todoke'" :todoke-category="todokeSubTab" :go-to-judge="goToJudge"/></div><tasks-tab v-if="activeTab==='tasks'" :data="data"/><requirements-tab v-if="activeTab==='requirements'" :data="data" :r8-data="r8Data" :active-sub="reqSubTab" @update:active-sub="reqSubTab=$event"/><todo-tab v-if="activeTab==='todo'"/></div>`
})

app.mount('#app')
