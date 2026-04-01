// ====================================================================
// Storage
// ====================================================================
const STORAGE_KEY = 'houshu-kaitei-data'
function getDefaultData() {
  return { version:'1.0', pharmacyName:'', r6:{}, r8:{}, annualReward:0, annualDrugCost:0, tasks:{}, requirements:{}, drugPriceRate:4.02, drugPriceEnabled:true }
}

// ====================================================================
// Calculation helpers
// ====================================================================
function calcGetPoints(data, item) {
  if (item.linkedTo && item.linkedRate) {
    const parent = ALL_FEES.find(i => i.id === item.linkedTo)
    if (parent) return Math.floor(calcGetPoints(data, parent) * item.linkedRate)
  }
  const e = item.r6; if (!e) return 0
  if (e.fixedPoints != null) return e.fixedPoints
  const sel = data.r6?.[item.id] ?? data.r6?.[item.id + '_pts'] ?? data.r6?.['k_' + item.id] ?? data.r6?.['t_' + item.id]; if (sel != null) return sel
  if (e.options?.length) return e.options[0].value; return 0
}
function calcGetCount(data, item) {
  const id = item.id
  return data.r6?.[id + '_cnt'] ?? data.r6?.['k_' + id + '_cnt'] ?? data.r6?.['t_' + id + '_cnt'] ?? 0
}
function calcGetAmountDirect(data, item) {
  const id = item.id
  return data.r6?.[id + '_amt'] ?? data.r6?.['k_' + id + '_amt'] ?? data.r6?.['t_' + id + '_amt'] ?? data.r6?.[id] ?? data.r6?.['k_' + id] ?? data.r6?.['t_' + id] ?? 0
}
function calcCategoryTotal(data, items) {
  let total = 0
  for (const item of items) {
    if (item.id.startsWith('kaz_')) continue
    if (item.inputType === 'count-only' || item.unit === '単位') total += calcGetAmountDirect(data, item)
    else total += calcGetCount(data, item) * calcGetPoints(data, item) * POINT_TO_YEN
  }
  if (items === PREPARATION_FEES) {
    total += data.r6?.['k_kazan_grand_total'] ?? data.r6?.['t_kazan_total'] ?? 0
  }
  return total
}

// ====================================================================
// Vue App
// ====================================================================
const { createApp, ref, reactive, computed, watch, provide, inject } = Vue

const BadgeLabel = {
  props: ['type'],
  template: '<span v-if="type && type !== \'same\' && ct[type]" class="badge" :class="ct[type].class">{{ ct[type].label }}</span>',
  setup() { return { ct: CHANGE_TYPES } }
}

const FeeTable = {
  props: { items: Array, data: Object, showAmount: { type: Boolean, default: true }, showTotal: { type: Boolean, default: false } },
  components: { BadgeLabel },
  setup(props) {
    function getPoints(item) {
      if (item.linkedTo && item.linkedRate) { const p = props.items.find(i => i.id === item.linkedTo); if (p) { const pp = getPoints(p); if (pp != null) return Math.floor(pp * item.linkedRate) } }
      const e = item.r6; if (!e) return null; if (e.fixedPoints != null) return e.fixedPoints
      const sel = props.data.r6?.[item.id] ?? props.data.r6?.[item.id + '_pts']; if (sel != null) return sel; if (e.options?.length) return e.options[0].value; return null
    }
    function getCount(item) { return props.data.r6?.[item.id + '_cnt'] || 0 }
    function isDisabled(item) { return item.r6 === null }
    function isMissing(item) { if (isDisabled(item)) return false; if (item.inputType==='count-only') return (props.data.r6?.[item.id+'_amt'] ?? props.data.r6?.[item.id]) == null; return props.data.r6?.[item.id+'_cnt'] == null }
    function isComputed(item) { if (isDisabled(item)) return false; if (item.inputType==='count-only'||item.unit==='単位') return false; return getPoints(item) != null && !isMissing(item) }
    function getAmount(item) { if (item.inputType==='count-only'||item.unit==='単位') return props.data.r6?.[item.id+'_amt'] ?? props.data.r6?.[item.id] ?? 0; const p=getPoints(item),c=getCount(item); if(p==null||c==null) return 0; return c*p*POINT_TO_YEN }
    function updateSelect(item,v) { if(!props.data.r6) props.data.r6={}; props.data.r6[item.id]=Number(v) }
    function updateCount(item,v) { if(!props.data.r6) props.data.r6={}; props.data.r6[item.id+'_cnt']=v?Number(String(v).replace(/,/g,'')):0 }
    function fmtC(v) { return (v||0).toLocaleString() }
    function totalCount() { return props.items.filter(i=>!isDisabled(i)).reduce((s,i)=>s+getCount(i),0) }
    function totalAmount() { return props.items.filter(i=>!isDisabled(i)).reduce((s,i)=>s+getAmount(i),0) }
    return { getPoints,getCount,isDisabled,isMissing,isComputed,getAmount,updateSelect,updateCount,fmtC,totalCount,totalAmount,formatYen }
  },
  template: `<table class="fee-table"><thead><tr><th style="width:240px">項目</th><th style="width:140px">点数</th><th v-if="showAmount" style="width:90px;text-align:right">件数</th><th v-if="showAmount" style="width:110px;text-align:right">金額（円）</th></tr></thead><tbody><tr v-for="item in items" :key="item.id" :class="{'abolished-row':isDisabled(item),'sub-row':item.isDetail}"><td class="label-cell" :style="item.isSub?'padding-left:24px':(item.isDetail?'padding-left:32px;color:var(--text-muted)':'')"><span v-if="item.isDetail">┗ {{item.label}}</span><span v-else>{{item.label}}</span><badge-label :type="item.changeType"/></td><td><select v-if="item.inputType==='select'&&item.r6?.options" class="fee-select" :value="getPoints(item)" @change="updateSelect(item,$event.target.value)"><option v-for="opt in item.r6.options" :key="opt.value" :value="opt.value">{{opt.label}}</option></select><span v-else-if="item.linkedTo" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{getPoints(item)}} 点</span><span v-else-if="item.r6?.fixedPoints!=null" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{item.r6.fixedPoints}} 点</span><span v-else-if="item.r6?.pointsNote" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{item.r6.pointsNote}}</span><span v-else style="font-size:12px;color:var(--text-faint)">-</span></td><td v-if="showAmount" style="text-align:right"><input v-if="!isDisabled(item)" type="text" class="fee-input" :class="{\'empty-input\':isMissing(item)}" style="max-width:90px;text-align:right" :value="fmtC(getCount(item))" @change="updateCount(item,$event.target.value)"><span v-else style="color:var(--text-faint)">-</span></td><td v-if="showAmount" class="num-cell"><span v-if="isDisabled(item)" style="color:var(--text-faint)">-</span><span v-else-if="isMissing(item)" class="amt-missing">{{formatYen(getAmount(item))}}</span><span v-else-if="isComputed(item)" class="amt-computed">{{formatYen(getAmount(item))}}</span><span v-else>{{formatYen(getAmount(item))}}</span></td></tr><tr v-if="showTotal" class="total-row"><td style="font-weight:700">合計</td><td></td><td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{fmtC(totalCount())}}</span></td><td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{formatYen(totalAmount())}}</span></td></tr></tbody></table>`
}

const BasicFeeSection = { props:['data'], components:{FeeTable}, setup(){ return{BASIC_FEES} }, template:'<div class="section"><div class="section-title">A. 調剤基本料・体制加算</div><fee-table :items="BASIC_FEES" :data="data" :show-total="true"/></div>' }

const PreparationFeeSection = {
  props:['data'], components:{BadgeLabel},
  setup(props) {
    const mainItems = computed(()=> PREPARATION_FEES.filter(f=>!f.id.startsWith('kaz_')&&f.id!=='zairyo'&&f.id!=='yakuzai_total'))
    const zairyoItem = computed(()=> PREPARATION_FEES.find(f=>f.id==='zairyo'))
    const kazanRows=[{id:'nai',label:'内服'},{id:'sin',label:'浸煎'},{id:'yu',label:'湯薬'},{id:'ton',label:'屯服'},{id:'gai',label:'外用'},{id:'chu',label:'注射'},{id:'col',label:'内滴'},{id:'mat',label:'材料'}]
    const kazanCols=[{id:'mayaku',label:'麻薬'},{id:'doku',label:'毒薬'},{id:'kakusei',label:'覚醒剤'},{id:'mukyoko',label:'向精神'},{id:'keiryo',label:'計量'},{id:'keiryo_yo',label:'計量予'},{id:'jika',label:'自家'},{id:'jika_yo',label:'自家予'},{id:'mukin',label:'無菌'},{id:'jikou',label:'時間外'}]
    const kazanFeeMap=Object.fromEntries(PREPARATION_FEES.filter(f=>f.id.startsWith('kaz_')).map(f=>[f.id.replace('kaz_',''),f]))
    const unitLabels={naifuku:'1剤につき（3剤まで）',sinsenn:'1調剤につき（3調剤まで）',yuyaku:'1調剤につき（3調剤まで）',tonpuku:'処方箋受付1回につき',gaiyou:'1調剤につき（3調剤まで）',chusya:'1処方箋につき',naiteki:'1調剤につき'}
    function getRaw(key){return props.data.r6?.[key]||0}
    function getVal(key){return fmt(getRaw(key))}
    function setVal(key,v){if(!props.data.r6)props.data.r6={};props.data.r6[key]=parseNum(v)}
    function isFieldMissing(key){return props.data.r6?.[key]==null}
    function getPoints(item){const e=item.r6;if(!e)return null;if(e.fixedPoints!=null)return e.fixedPoints;return null}
    function getAmount(item){const p=getPoints(item),c=getRaw('k_'+item.id+'_cnt');if(p==null)return 0;return c*p*POINT_TO_YEN}
    function kazanRowTotal(rid){let s=0;for(const k of kazanCols)s+=getRaw('t_kaz_'+rid+'_'+k.id);return s}
    function kazanColTotal(cid){let s=0;for(const r of kazanRows)s+=getRaw('t_kaz_'+r.id+'_'+cid);return s}
    function kazanGrandTotal(){let s=0;for(const r of kazanRows)for(const k of kazanCols)s+=getRaw('t_kaz_'+r.id+'_'+k.id);return s}
    const totals=computed(()=>{let zS=0,yS=0,cS=0,aS=0;for(const item of mainItems.value){zS+=getRaw('t_'+item.id+'_zai');yS+=getRaw('t_'+item.id+'_yakuzai');cS+=getRaw('k_'+item.id+'_cnt');aS+=getAmount(item)};if(zairyoItem.value){zS+=getRaw('t_zairyo_zai');yS+=getRaw('t_zairyo_yakuzai')};return{zaiSum:zS,yakuzaiSum:yS,cntSum:cS,amtSum:aS}})
    return{mainItems,zairyoItem,kazanRows,kazanCols,kazanFeeMap,unitLabels,getRaw,getVal,setVal,isFieldMissing,getPoints,getAmount,kazanRowTotal,kazanColTotal,kazanGrandTotal,totals,formatYen}
  },
  template:`<div class="section"><div class="section-title">B. 薬剤調製料</div><table class="fee-table"><thead><tr><th style="width:250px">剤種</th><th>算定単位</th><th style="width:120px;text-align:right">剤数</th><th style="width:140px;text-align:right">薬剤料（円）</th><th style="width:100px;text-align:right">件数</th><th style="width:80px;text-align:right">点数</th><th style="width:130px;text-align:right">調製料（円）</th></tr></thead><tbody><tr v-for="item in mainItems" :key="item.id"><td style="font-weight:600">{{item.label}} <badge-label :type="item.changeType"/></td><td style="font-size:11px;color:var(--text-muted);white-space:nowrap">{{unitLabels[item.id]||''}}</td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('t_'+item.id+'_zai')}" :value="getVal('t_'+item.id+'_zai')" @change="setVal('t_'+item.id+'_zai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:120px" :class="{\'empty-input\':isFieldMissing('t_'+item.id+'_yakuzai')}" :value="getVal('t_'+item.id+'_yakuzai')" @change="setVal('t_'+item.id+'_yakuzai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('k_'+item.id+'_cnt')}" :value="getVal('k_'+item.id+'_cnt')" @change="setVal('k_'+item.id+'_cnt',$event.target.value)"></td><td class="num-cell"><span v-if="getPoints(item)!=null">{{getPoints(item)}}</span><span v-else style="color:var(--text-faint)">※</span></td><td class="num-cell"><span class="amt-computed">{{formatYen(getAmount(item))}}</span></td></tr><tr v-if="zairyoItem"><td style="font-weight:600">材料</td><td></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('t_zairyo_zai')}" :value="getVal('t_zairyo_zai')" @change="setVal('t_zairyo_zai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:120px" :class="{\'empty-input\':isFieldMissing('t_zairyo_yakuzai')}" :value="getVal('t_zairyo_yakuzai')" @change="setVal('t_zairyo_yakuzai',$event.target.value)"></td><td></td><td></td><td></td></tr><tr class="total-row"><td colspan="2" style="font-weight:700">合計</td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.zaiSum.toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.yakuzaiSum.toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.cntSum.toLocaleString()}}</span></td><td></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{formatYen(totals.amtSum)}}</span></td></tr></tbody></table><div style="margin-top:16px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">薬剤調製料加算（円）</div><table class="fee-table kazan-table"><thead><tr><th style="width:60px">剤種</th><th v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:4px 2px;width:90px">{{kz.label}}</th><th style="text-align:right;padding:6px 4px">合計</th></tr></thead><tbody><tr v-for="row in kazanRows" :key="row.id"><td style="font-weight:600">{{row.label}}</td><td v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:6px 4px"><input type="text" class="fee-input kaz-input" :class="{\'empty-input\':isFieldMissing('t_kaz_'+row.id+'_'+kz.id)}" :value="getVal('t_kaz_'+row.id+'_'+kz.id)" @change="setVal('t_kaz_'+row.id+'_'+kz.id,$event.target.value)"></td><td class="num-cell" style="font-weight:600"><span class="amt-computed">{{kazanRowTotal(row.id).toLocaleString()}}</span></td></tr><tr class="total-row"><td style="font-weight:700">合計</td><td v-for="kz in kazanCols" :key="kz.id" class="num-cell" style="font-weight:700"><span class="amt-computed">{{kazanColTotal(kz.id).toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{kazanGrandTotal().toLocaleString()}}</span></td></tr></tbody></table></div></div>`
}

const ManagementFeeSection = { props:['data'], components:{FeeTable}, setup(){return{MANAGEMENT_FEES}}, template:'<div class="section"><div class="section-title">C. 薬学管理料</div><fee-table :items="MANAGEMENT_FEES" :data="data" :show-total="true"/></div>' }
const HomeCareSection = { props:['data'], components:{FeeTable}, setup(){return{HOMECARE_FEES}}, template:'<div class="section"><div class="section-title">D. 在宅等</div><fee-table :items="HOMECARE_FEES" :data="data" :show-total="true"/></div>' }
const LongTermCareSection = { props:['data'], components:{FeeTable}, setup(){return{LONGTERM_FEES}}, template:'<div class="section"><div class="section-title">E. 介護（単位制）</div><fee-table :items="LONGTERM_FEES" :data="data" :show-total="true"/></div>' }

const OverviewTab = {
  template: '<div><div class="section"><div class="section-title">令和8年度 調剤報酬改定の概要</div><p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">令和8年6月1日施行。技術料引き上げ（+0.25%）、薬価引き下げ（▲4.02%）、新設加算・廃止加算の整理を含む大幅改定です。</p><div class="kpi-grid" style="margin-bottom:20px"><div class="kpi-card info"><div class="kpi-label">施行日</div><div class="kpi-value" style="font-size:18px">2026.6.1</div></div><div class="kpi-card positive"><div class="kpi-label">技術料改定率</div><div class="kpi-value" style="font-size:18px">+0.25%</div></div><div class="kpi-card negative"><div class="kpi-label">薬価改定率</div><div class="kpi-value" style="font-size:18px">▲4.02%</div></div><div class="kpi-card"><div class="kpi-label">経過措置期限</div><div class="kpi-value" style="font-size:18px">R9.5.31</div></div></div></div><div class="section"><div class="section-title">主な変更ポイント</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px"><div style="padding:12px;background:var(--new-bg);border-radius:var(--radius);border:1px solid #b3d4f7"><div style="font-weight:700;color:var(--new-text);margin-bottom:6px">新設（8項目）</div><ul style="padding-left:16px;color:var(--new-text);line-height:1.8"><li>調剤物価対応料（1点/3月に1回）</li><li>調剤ベースアップ評価料（4点）</li><li>バイオ後続品調剤体制加算（50点）</li><li>調剤時残薬調整加算（30〜50点）</li><li>薬学的有害事象等防止加算（30〜50点）</li><li>かかりつけ薬剤師フォローアップ加算（50点）</li><li>かかりつけ薬剤師訪問加算（230点）</li><li>複数名薬剤管理指導訪問料（300点）</li></ul></div><div style="padding:12px;background:var(--del-bg);border-radius:var(--radius);border:1px solid #f5c6c6"><div style="font-weight:700;color:var(--del-text);margin-bottom:6px">廃止（5項目）</div><ul style="padding-left:16px;color:var(--del-text);line-height:1.8"><li>後発医薬品調剤体制加算（経過措置あり）</li><li>かかりつけ薬剤師指導料（76点）</li><li>かかりつけ薬剤師包括管理料（291点）</li><li>医療情報取得加算</li><li>重複投薬・相互作用等防止加算</li></ul></div></div></div><div class="section"><div class="section-title">このシステムの使い方</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:12px"><div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">1. 点数設定</div><div style="color:var(--text-muted)">PDFをドラッグ&ドロップして実績を取得、または手動で件数を入力します。</div></div><div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">2. 改定比較</div><div style="color:var(--text-muted)">全項目のR6→R8の点数変更を一覧で確認できます。</div></div><div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">3. 経営影響</div><div style="color:var(--text-muted)">実績データから年間売上への影響を試算します。</div></div><div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">4. 事務タスク</div><div style="color:var(--text-muted)">届出変更・システム更新等の27項目をチェックリストで管理します。</div></div><div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">5. 施設基準</div><div style="color:var(--text-muted)">地域支援体制9指標など施設基準の要件を確認します。</div></div></div></div></div>'
}

const InputTab = {
  props:['data','loadFn','clearFn'],
  components:{BasicFeeSection,PreparationFeeSection,ManagementFeeSection,HomeCareSection,LongTermCareSection},
  setup(props) {
    const r6BT=computed(()=>calcCategoryTotal(props.data,BASIC_FEES))
    const r6PT=computed(()=>calcCategoryTotal(props.data,PREPARATION_FEES))
    const r6MT=computed(()=>calcCategoryTotal(props.data,MANAGEMENT_FEES))
    const r6HT=computed(()=>calcCategoryTotal(props.data,HOMECARE_FEES))
    const r6LT=computed(()=>calcCategoryTotal(props.data,LONGTERM_FEES))
    const ikaTotal=computed(()=>r6BT.value+r6PT.value+r6MT.value+r6HT.value)
    const futanTotal=computed(()=>(props.data.r6.t_hoken_futan||0)+(props.data.r6.t_jihi_futan||0)+(props.data.r6.t_hokengai_futan||0))
    const grandTotal=computed(()=>ikaTotal.value+r6LT.value+futanTotal.value)
    return{ikaTotal,futanTotal,grandTotal,r6LT,fmt,parseNum}
  },
  template:'<div><div v-if="loadFn" style="display:flex;gap:8px;margin-bottom:12px"><button class="btn" @click="loadFn">実績読込</button><button class="btn" @click="clearFn">実績クリア</button></div><div class="section"><div class="section-title">年間合計</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;min-width:0"><div class="summary-card" style="border-color:var(--teal)"><div class="summary-label">医療保険（A+B+C+D）</div><div class="summary-row"><span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{fmt(ikaTotal)}}</span><span class="summary-unit">円</span></div></div><div class="summary-card" style="border-color:var(--green)"><div class="summary-label">介護保険（E）</div><div class="summary-row"><span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{fmt(r6LT)}}</span><span class="summary-unit">円</span></div></div><div class="summary-card" style="border-color:var(--amber)"><div class="summary-label">患者負担</div><div class="summary-row"><span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{fmt(futanTotal)}}</span><span class="summary-unit">円</span></div></div><div class="summary-card" style="border-color:var(--purple)"><div class="summary-label">総売上</div><div class="summary-row"><span class="summary-input amt-computed" style="background:none;border:none;font-weight:700">{{fmt(grandTotal)}}</span><span class="summary-unit">円</span></div></div></div></div><div class="section"><div class="section-title">基本指標</div><table class="fee-table"><thead><tr><th style="width:240px">項目</th><th>年間値</th><th style="width:60px;text-align:right">単位</th></tr></thead><tbody><tr><td class="label-cell">処方箋受付回数</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_rx_count==null}" :value="fmt(data.r6.t_rx_count)" @change="data.r6.t_rx_count=parseNum($event.target.value)"></td><td style="text-align:right">回</td></tr><tr><td class="label-cell">処方箋受付枚数</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_rx_sheets==null}" :value="fmt(data.r6.t_rx_sheets)" @change="data.r6.t_rx_sheets=parseNum($event.target.value)"></td><td style="text-align:right">枚</td></tr><tr><td class="label-cell">後発調剤率</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_ge_rate==null}" :value="fmt(data.r6.t_ge_rate)" @change="data.r6.t_ge_rate=parseNum($event.target.value)"></td><td style="text-align:right">%</td></tr><tr><td class="label-cell">剤数</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_zai_count==null}" :value="fmt(data.r6.t_zai_count)" @change="data.r6.t_zai_count=parseNum($event.target.value)"></td><td style="text-align:right">剤</td></tr><tr><td class="label-cell">平均剤数</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_avg_zai==null}" :value="fmt(data.r6.t_avg_zai)" @change="data.r6.t_avg_zai=parseNum($event.target.value)"></td><td style="text-align:right">剤</td></tr><tr><td class="label-cell">処方箋報酬金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_total_reward==null}" :value="fmt(data.r6.t_total_reward)" @change="data.r6.t_total_reward=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr><td class="label-cell">処方箋単価</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_rx_price==null}" :value="fmt(data.r6.t_rx_price)" @change="data.r6.t_rx_price=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr><td class="label-cell">手帳活用実績（持参率）</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_techo_rate==null}" :value="fmt(data.r6.t_techo_rate)" @change="data.r6.t_techo_rate=parseNum($event.target.value)"></td><td style="text-align:right">%</td></tr><tr><td class="label-cell">3月以内受付回数</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_rx_3month==null}" :value="fmt(data.r6.t_rx_3month)" @change="data.r6.t_rx_3month=parseNum($event.target.value)"></td><td style="text-align:right">回</td></tr><tr><td class="label-cell">うち手帳持参有り</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_rx_3month_techo==null}" :value="fmt(data.r6.t_rx_3month_techo)" @change="data.r6.t_rx_3month_techo=parseNum($event.target.value)"></td><td style="text-align:right">回</td></tr></tbody></table></div><basic-fee-section :data="data"/><preparation-fee-section :data="data"/><management-fee-section :data="data"/><home-care-section :data="data"/><long-term-care-section :data="data"/><div class="section"><div class="section-title">F. 患者負担</div><table class="fee-table"><thead><tr><th style="width:240px">項目</th><th>年間値</th><th style="width:60px;text-align:right">単位</th></tr></thead><tbody><tr><td class="label-cell">保険分・患者負担金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_hoken_futan==null}" :value="fmt(data.r6.t_hoken_futan)" @change="data.r6.t_hoken_futan=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr><td class="label-cell">自費分・患者負担金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_jihi_futan==null}" :value="fmt(data.r6.t_jihi_futan)" @change="data.r6.t_jihi_futan=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr><td class="label-cell">保険外・患者負担金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_hokengai_futan==null}" :value="fmt(data.r6.t_hokengai_futan)" @change="data.r6.t_hokengai_futan=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr style="background:#f9f9f9"><td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ その他金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_sonota_kingaku==null}" :value="fmt(data.r6.t_sonota_kingaku)" @change="data.r6.t_sonota_kingaku=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr style="background:#f9f9f9"><td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ OTC金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_otc_kingaku==null}" :value="fmt(data.r6.t_otc_kingaku)" @change="data.r6.t_otc_kingaku=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr style="background:#f9f9f9"><td class="label-cell" style="padding-left:32px;color:var(--text-muted)">┗ 選定療養金額</td><td><input type="text" class="fee-input" :class="{\'empty-input\':data.r6.t_sentei_ryoyo==null}" :value="fmt(data.r6.t_sentei_ryoyo)" @change="data.r6.t_sentei_ryoyo=parseNum($event.target.value)"></td><td style="text-align:right">円</td></tr><tr class="total-row"><td style="font-weight:700">合計</td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{fmt((data.r6.t_hoken_futan||0)+(data.r6.t_jihi_futan||0)+(data.r6.t_hokengai_futan||0))}}</span></td><td style="text-align:right">円</td></tr></tbody></table></div></div>'
}

const ImpactTab = {
  props:['data'],
  setup(props) {
    const r6BT=computed(()=>calcCategoryTotal(props.data,BASIC_FEES))
    const r6PT=computed(()=>calcCategoryTotal(props.data,PREPARATION_FEES))
    const r6MT=computed(()=>calcCategoryTotal(props.data,MANAGEMENT_FEES))
    const r6HT=computed(()=>calcCategoryTotal(props.data,HOMECARE_FEES))
    const r6LT=computed(()=>calcCategoryTotal(props.data,LONGTERM_FEES))
    const r6Total=computed(()=>r6BT.value+r6PT.value+r6MT.value+r6HT.value+r6LT.value)
    const annualReward=computed(()=>props.data.r6?.t_total_reward||0)
    const r8BT=computed(()=>r6BT.value),r8PT=computed(()=>r6PT.value),r8MT=computed(()=>r6MT.value),r8HT=computed(()=>r6HT.value),r8LT=computed(()=>r6LT.value)
    const r8Total=computed(()=>r8BT.value+r8PT.value+r8MT.value+r8HT.value+r8LT.value)
    const gijutsuDiff=computed(()=>r8Total.value-r6Total.value)
    const drugPriceImpact=computed(()=>props.data.drugPriceEnabled?-Math.round((props.data.annualDrugCost||0)*(props.data.drugPriceRate||0)/100):0)
    const totalDiff=computed(()=>gijutsuDiff.value+drugPriceImpact.value)
    const r8Forecast=computed(()=>annualReward.value+totalDiff.value)
    const totalDiffPct=computed(()=>annualReward.value?totalDiff.value/annualReward.value*100:0)
    return{r6BT,r6PT,r6MT,r6HT,r6LT,r6Total,r8BT,r8PT,r8MT,r8HT,r8LT,r8Total,annualReward,gijutsuDiff,totalDiff,r8Forecast,totalDiffPct,formatYen,formatDiff,formatDiffPercent}
  },
  template:'<div><div class="section"><div class="section-title">R7→R8 年間売上予測</div><p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">報酬改定タブに件数を入力すると、年間ベースの影響を試算します。</p><div class="kpi-grid" style="margin-bottom:16px"><div class="kpi-card info"><div class="kpi-label">R7 年間売上（実績ベース）</div><div class="kpi-value" style="font-size:18px">{{formatYen(annualReward)}}</div><div class="kpi-unit">円</div></div><div class="kpi-card" :class="totalDiff>=0?\'positive\':\'negative\'"><div class="kpi-label">R8 年間売上（予測）</div><div class="kpi-value" style="font-size:18px">{{formatYen(r8Forecast)}}</div><div class="kpi-unit">円</div></div><div class="kpi-card" :class="totalDiff>=0?\'positive\':\'negative\'"><div class="kpi-label">増減額（増減率）</div><div class="kpi-value" style="font-size:18px">{{formatDiff(totalDiff)}}</div><div class="kpi-unit">{{formatDiffPercent(totalDiffPct)}}</div></div></div></div><div class="section"><div class="section-title">カテゴリ別 R6 vs R8 比較</div><table class="compare-table"><thead><tr><th style="text-align:left">カテゴリ</th><th>R6 合計</th><th>R8 合計</th><th>増減</th></tr></thead><tbody><tr><td style="text-align:left;font-family:inherit">A. 調剤基本料</td><td>{{formatYen(r6BT)}}</td><td>{{formatYen(r8BT)}}</td><td :class="r8BT-r6BT>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(r8BT-r6BT)}}</td></tr><tr><td style="text-align:left;font-family:inherit">B. 薬剤調製料</td><td>{{formatYen(r6PT)}}</td><td>{{formatYen(r8PT)}}</td><td :class="r8PT-r6PT>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(r8PT-r6PT)}}</td></tr><tr><td style="text-align:left;font-family:inherit">C. 薬学管理料</td><td>{{formatYen(r6MT)}}</td><td>{{formatYen(r8MT)}}</td><td :class="r8MT-r6MT>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(r8MT-r6MT)}}</td></tr><tr><td style="text-align:left;font-family:inherit">D. 在宅等</td><td>{{formatYen(r6HT)}}</td><td>{{formatYen(r8HT)}}</td><td :class="r8HT-r6HT>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(r8HT-r6HT)}}</td></tr><tr><td style="text-align:left;font-family:inherit">E. 介護</td><td>{{formatYen(r6LT)}}</td><td>{{formatYen(r8LT)}}</td><td :class="r8LT-r6LT>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(r8LT-r6LT)}}</td></tr><tr class="total-row" style="font-weight:700"><td style="text-align:left;font-family:inherit">合計</td><td>{{formatYen(r6Total)}}</td><td>{{formatYen(r8Total)}}</td><td :class="gijutsuDiff>=0?\'diff-pos\':\'diff-neg\'">{{formatDiff(gijutsuDiff)}}</td></tr></tbody></table></div><div class="section"><div class="section-title">薬価改定設定</div><div style="display:flex;align-items:center;gap:12px;font-size:13px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" v-model="data.drugPriceEnabled" style="accent-color:var(--pos)">薬価引き下げを反映</label><div style="display:flex;align-items:center;gap:4px">▲<input type="number" v-model.number="data.drugPriceRate" step="0.01" min="0" max="20" class="fee-input" style="max-width:80px">%</div></div></div></div>'
}

const TasksTab = {
  props:['data'],
  setup(props) {
    const categories = window.TASK_CATEGORIES || []
    const tasks = window.TASK_DEFINITIONS || {}
    function isChecked(id) { return !!props.data.tasks?.[id] }
    function toggle(id) { if (!props.data.tasks) props.data.tasks = {}; props.data.tasks[id] = !props.data.tasks[id] }
    const totalTasks = computed(() => Object.keys(tasks).length)
    const doneTasks = computed(() => Object.keys(tasks).filter(id => props.data.tasks?.[id]).length)
    const pct = computed(() => totalTasks.value ? Math.round(doneTasks.value / totalTasks.value * 100) : 0)
    function catDone(cat) { return cat.keys.filter(id => props.data.tasks?.[id]).length }
    return { categories, tasks, isChecked, toggle, totalTasks, doneTasks, pct, catDone }
  },
  template: `<div>
    <div class="section">
      <div class="section-title">事務タスク進捗</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">完了</div><div class="kpi-value" style="font-size:18px">{{doneTasks}} / {{totalTasks}}</div></div>
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">進捗率</div><div class="kpi-value" style="font-size:18px">{{pct}}%</div></div>
      </div>
      <div class="req-progress"><div class="req-progress-bar" :style="{width:pct+'%'}"></div></div>
    </div>
    <div v-for="cat in categories" :key="cat.id" class="section">
      <div class="section-title">{{cat.label}} <span style="font-size:12px;font-weight:400;color:var(--text-muted);margin-left:8px">{{catDone(cat)}}/{{cat.keys.length}}</span></div>
      <ul class="task-list">
        <li v-for="tid in cat.keys" :key="tid" class="task-item" v-if="tasks[tid]">
          <input type="checkbox" class="task-check" :checked="isChecked(tid)" @change="toggle(tid)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600" :style="isChecked(tid)?'text-decoration:line-through;opacity:0.5':''">{{tasks[tid].title}}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">{{tasks[tid].detail}}</div>
            <span v-if="tasks[tid].deadline" class="badge badge-modified" style="margin-top:4px;margin-left:0">{{tasks[tid].deadline}}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>`
}

const RequirementsTab = {
  props:['data'],
  setup(props) {
    const groups = window.REQUIREMENT_DEFINITIONS || []
    function isChecked(id) { return !!props.data.requirements?.[id] }
    function toggle(id) { if (!props.data.requirements) props.data.requirements = {}; props.data.requirements[id] = !props.data.requirements[id] }
    function groupDone(g) { return g.items.filter(i => props.data.requirements?.[i.id]).length }
    function groupPct(g) { return g.items.length ? Math.round(groupDone(g) / g.items.length * 100) : 0 }
    const totalItems = computed(() => groups.reduce((s, g) => s + g.items.length, 0))
    const doneItems = computed(() => groups.reduce((s, g) => s + groupDone(g), 0))
    const pct = computed(() => totalItems.value ? Math.round(doneItems.value / totalItems.value * 100) : 0)
    return { groups, isChecked, toggle, groupDone, groupPct, totalItems, doneItems, pct }
  },
  template: `<div>
    <div class="section">
      <div class="section-title">施設基準 達成状況</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">達成</div><div class="kpi-value" style="font-size:18px">{{doneItems}} / {{totalItems}}</div></div>
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">達成率</div><div class="kpi-value" style="font-size:18px">{{pct}}%</div></div>
      </div>
      <div class="req-progress"><div class="req-progress-bar" :style="{width:pct+'%'}"></div></div>
    </div>
    <div v-for="group in groups" :key="group.id" class="section">
      <div class="section-title">{{group.label}} <span style="font-size:12px;font-weight:400;color:var(--text-muted);margin-left:8px">{{groupDone(group)}}/{{group.items.length}}</span></div>
      <p v-if="group.description" style="font-size:12px;color:var(--text-muted);margin-bottom:8px">{{group.description}}</p>
      <ul class="task-list">
        <li v-for="item in group.items" :key="item.id" class="task-item">
          <input type="checkbox" class="task-check" :checked="isChecked(item.id)" @change="toggle(item.id)">
          <div style="font-size:13px" :style="isChecked(item.id)?'text-decoration:line-through;opacity:0.5':''">{{item.label}}</div>
        </li>
      </ul>
      <div class="req-progress" style="margin-top:4px"><div class="req-progress-bar" :style="{width:groupPct(group)+'%'}"></div></div>
    </div>
  </div>`
}
