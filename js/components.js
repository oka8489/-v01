// ====================================================================
// Storage
// ====================================================================
const STORAGE_KEY = 'houshu-kaitei-data'
function getDefaultData() {
  return { version:'1.0', pharmacyName:'', r6:{}, r8:{}, annualReward:0, annualDrugCost:0, tasks:{}, requirements:{}, judge:{}, drugPriceRate:4.02, drugPriceEnabled:true }
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
  return 0
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
      const sel = props.data.r6?.[item.id] ?? props.data.r6?.[item.id + '_pts']; if (sel != null) return sel; return null
    }
    function getCount(item) { return props.data.r6?.[item.id + '_cnt'] || 0 }
    function isDisabled(item) { return item.r6 === null || item.disabled === true }
    function isMissing(item) { if (isDisabled(item)) return false; if (item.inputType==='count-only') return (props.data.r6?.[item.id+'_amt'] ?? props.data.r6?.[item.id]) == null; return props.data.r6?.[item.id+'_cnt'] == null }
    function isComputed(item) { if (isDisabled(item)) return false; if (item.inputType==='count-only'||item.unit==='単位') return false; return getPoints(item) != null && !isMissing(item) }
    function getAmount(item) { if (item.inputType==='count-only'||item.unit==='単位') return props.data.r6?.[item.id+'_amt'] ?? props.data.r6?.[item.id] ?? 0; const p=getPoints(item),c=getCount(item); if(p==null||c==null) return 0; return c*p*POINT_TO_YEN }
    function updateSelect(item,v) { if(!props.data.r6) props.data.r6={}; props.data.r6[item.id]=Number(v) }
    function updateCount(item,v) { if(!props.data.r6) props.data.r6={}; props.data.r6[item.id+'_cnt']=v?Number(String(v).replace(/,/g,'')):0 }
    function fmtC(v) { return (v||0).toLocaleString() }
    function totalCount() { return props.items.filter(i=>!isDisabled(i)).reduce((s,i)=>s+getCount(i),0) }
    function totalAmount() { return props.items.filter(i=>!isDisabled(i)).reduce((s,i)=>s+getAmount(i),0) }
    const judgeModal = ref(null)
    function openJudgeModal(item) { judgeModal.value = item }
    function closeJudgeModal() { judgeModal.value = null }
    return { getPoints,getCount,isDisabled,isMissing,isComputed,getAmount,updateSelect,updateCount,fmtC,totalCount,totalAmount,formatYen,judgeModal,openJudgeModal,closeJudgeModal }
  },
  template: `<div><table class="fee-table"><thead><tr><th style="width:240px">項目</th><th style="width:140px">点数</th><th v-if="showAmount" style="width:90px;text-align:right">件数</th><th v-if="showAmount" style="width:110px;text-align:right">金額（円）</th></tr></thead><tbody><tr v-for="item in items" :key="item.id" :class="{'abolished-row':isDisabled(item),'sub-row':item.isDetail}"><td class="label-cell" :style="item.isSub?'padding-left:24px':(item.isDetail?'padding-left:32px;color:var(--text-muted)':'')"><span v-if="item.isDetail">┗ {{item.label}}</span><span v-else>{{item.label}}</span><badge-label :type="item.changeType"/></td><td><div v-if="item.inputType==='select'&&item.r6?.options" style="display:flex;align-items:center;gap:6px"><select class="fee-select" :value="getPoints(item)" @change="updateSelect(item,$event.target.value)"><option v-for="opt in item.r6.options" :key="opt.value" :value="opt.value">{{opt.label}}</option></select><button v-if="item.judgeInfo" class="btn" style="font-size:10px;padding:2px 8px;white-space:nowrap;color:white;background:var(--amber)" @click="openJudgeModal(item)">判定</button></div><span v-else-if="item.linkedTo" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{getPoints(item)}} 点</span><span v-else-if="item.r6?.fixedPoints!=null" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{item.r6.fixedPoints}} 点</span><span v-else-if="item.r6?.pointsNote" style="font-family:'IBM Plex Mono',monospace;font-size:13px">{{item.r6.pointsNote}}</span><span v-else style="font-size:12px;color:var(--text-faint)">-</span></td><td v-if="showAmount" style="text-align:right"><span v-if="item.needsDb && isMissing(item)" style="color:var(--neg);font-size:11px;margin-right:2px" title="レセコンDBから取得が必要">※</span><input v-if="!isDisabled(item)" type="text" class="fee-input" :class="{\'empty-input\':isMissing(item)}" style="max-width:90px;text-align:right" :value="fmtC(getCount(item))" @change="updateCount(item,$event.target.value)"><span v-else style="color:var(--text-faint)">-</span></td><td v-if="showAmount" class="num-cell"><span v-if="isDisabled(item)" style="color:var(--text-faint)">-</span><span v-else-if="isMissing(item)" class="amt-missing">{{formatYen(getAmount(item))}}</span><span v-else-if="isComputed(item)" class="amt-computed">{{formatYen(getAmount(item))}}</span><span v-else>{{formatYen(getAmount(item))}}</span></td></tr><tr v-if="showTotal" class="total-row"><td style="font-weight:700">合計</td><td></td><td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{fmtC(totalCount())}}</span></td><td v-if="showAmount" class="num-cell" style="font-weight:700"><span class="amt-computed">{{formatYen(totalAmount())}}</span></td></tr></tbody></table><div v-if="judgeModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="closeJudgeModal()"><div style="background:white;border-radius:12px;padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop><div style="font-weight:700;font-size:17px;margin-bottom:4px">{{judgeModal.judgeInfo.title}}</div><div style="font-size:12px;margin-bottom:16px;color:var(--text-muted)">{{judgeModal.judgeInfo.desc}}</div><div style="font-weight:600;font-size:13px;margin-bottom:8px">算定要件</div><ul style="margin:0;padding-left:20px"><li v-for="(chk,idx) in judgeModal.judgeInfo.checks" :key="idx" style="font-size:13px;line-height:2;color:var(--text)">{{chk}}</li></ul><div style="margin-top:20px;text-align:right"><button class="btn" style="background:var(--text);color:white;padding:6px 20px" @click="closeJudgeModal()">閉じる</button></div></div></div></div>`
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
  template:`<div class="section"><div class="section-title">B. 薬剤調製料</div><table class="fee-table"><thead><tr><th style="width:250px">剤種</th><th>算定単位</th><th style="width:120px;text-align:right">剤数</th><th style="width:140px;text-align:right">薬剤料（円）</th><th style="width:100px;text-align:right">件数</th><th style="width:80px;text-align:right">点数</th><th style="width:130px;text-align:right">調製料（円）</th></tr></thead><tbody><tr v-for="item in mainItems" :key="item.id"><td style="font-weight:600">{{item.label}} <badge-label :type="item.changeType"/></td><td style="font-size:11px;color:var(--text-muted);white-space:nowrap">{{unitLabels[item.id]||''}}</td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('t_'+item.id+'_zai')}" :value="getVal('t_'+item.id+'_zai')" @change="setVal('t_'+item.id+'_zai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:120px" :class="{\'empty-input\':isFieldMissing('t_'+item.id+'_yakuzai')}" :value="getVal('t_'+item.id+'_yakuzai')" @change="setVal('t_'+item.id+'_yakuzai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('k_'+item.id+'_cnt')}" :value="getVal('k_'+item.id+'_cnt')" @change="setVal('k_'+item.id+'_cnt',$event.target.value)"></td><td class="num-cell"><span v-if="getPoints(item)!=null">{{getPoints(item)}}</span><span v-else style="color:var(--text-faint)">※</span></td><td class="num-cell"><span class="amt-computed">{{formatYen(getAmount(item))}}</span></td></tr><tr v-if="zairyoItem"><td style="font-weight:600">材料</td><td></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:90px" :class="{\'empty-input\':isFieldMissing('t_zairyo_zai')}" :value="getVal('t_zairyo_zai')" @change="setVal('t_zairyo_zai',$event.target.value)"></td><td style="text-align:right"><input type="text" class="fee-input" style="max-width:120px" :class="{\'empty-input\':isFieldMissing('t_zairyo_yakuzai')}" :value="getVal('t_zairyo_yakuzai')" @change="setVal('t_zairyo_yakuzai',$event.target.value)"></td><td></td><td></td><td></td></tr><tr class="total-row"><td colspan="2" style="font-weight:700">合計</td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.zaiSum.toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.yakuzaiSum.toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{totals.cntSum.toLocaleString()}}</span></td><td></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{formatYen(totals.amtSum)}}</span></td></tr></tbody></table><div style="margin-top:16px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">薬剤調製料加算（円）</div><table class="fee-table kazan-table"><thead><tr><th style="width:60px">剤種</th><th v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:4px 2px;width:90px">{{kz.label}}<badge-label v-if="kazanFeeMap[kz.id]" :type="kazanFeeMap[kz.id].changeType"/></th><th style="text-align:right;padding:6px 4px">合計</th></tr></thead><tbody><tr v-for="row in kazanRows" :key="row.id"><td style="font-weight:600">{{row.label}}</td><td v-for="kz in kazanCols" :key="kz.id" style="text-align:right;padding:6px 4px"><input type="text" class="fee-input kaz-input" :class="{\'empty-input\':isFieldMissing('t_kaz_'+row.id+'_'+kz.id)}" :value="getVal('t_kaz_'+row.id+'_'+kz.id)" @change="setVal('t_kaz_'+row.id+'_'+kz.id,$event.target.value)"></td><td class="num-cell" style="font-weight:600"><span class="amt-computed">{{kazanRowTotal(row.id).toLocaleString()}}</span></td></tr><tr class="total-row"><td style="font-weight:700">合計</td><td v-for="kz in kazanCols" :key="kz.id" class="num-cell" style="font-weight:700"><span class="amt-computed">{{kazanColTotal(kz.id).toLocaleString()}}</span></td><td class="num-cell" style="font-weight:700"><span class="amt-computed">{{kazanGrandTotal().toLocaleString()}}</span></td></tr></tbody></table></div></div>`
}

const ManagementFeeSection = { props:['data'], components:{FeeTable}, setup(){return{MANAGEMENT_FEES}}, template:'<div class="section"><div class="section-title">C. 薬学管理料</div><fee-table :items="MANAGEMENT_FEES" :data="data" :show-total="true"/></div>' }
const HomeCareSection = { props:['data'], components:{FeeTable}, setup(){return{HOMECARE_FEES}}, template:'<div class="section"><div class="section-title">D. 在宅等</div><fee-table :items="HOMECARE_FEES" :data="data" :show-total="true"/></div>' }
const LongTermCareSection = { props:['data'], components:{FeeTable}, setup(){return{LONGTERM_FEES}}, template:'<div class="section"><div class="section-title">E. 介護（単位制）</div><fee-table :items="LONGTERM_FEES" :data="data" :show-total="true"/></div>' }

// OverviewTab is in components_overview.js

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
  props:['data','r8Data'],
  setup(props) {
    const r6BT=computed(()=>calcCategoryTotal(props.data,BASIC_FEES))
    const r6PT=computed(()=>calcCategoryTotal(props.data,PREPARATION_FEES))
    const r6MT=computed(()=>calcCategoryTotal(props.data,MANAGEMENT_FEES))
    const r6HT=computed(()=>calcCategoryTotal(props.data,HOMECARE_FEES))
    const r6LT=computed(()=>calcCategoryTotal(props.data,LONGTERM_FEES))
    const r6Total=computed(()=>r6BT.value+r6PT.value+r6MT.value+r6HT.value+r6LT.value)
    const annualReward=computed(()=>props.data.r6?.t_total_reward||0)
    const r8d=computed(()=>props.r8Data||props.data)
    const r8BT=computed(()=>r8CalcCategoryTotal(r8d.value,R8_BASIC_FEES))
    const r8PT=computed(()=>r8CalcCategoryTotal(r8d.value,R8_PREPARATION_FEES))
    const r8MT=computed(()=>r8CalcCategoryTotal(r8d.value,R8_MANAGEMENT_FEES))
    const r8HT=computed(()=>r8CalcCategoryTotal(r8d.value,R8_HOMECARE_FEES))
    const r8LT=computed(()=>r8CalcCategoryTotal(r8d.value,R8_LONGTERM_FEES))
    const r8Total=computed(()=>r8BT.value+r8PT.value+r8MT.value+r8HT.value+r8LT.value)
    const gijutsuDiff=computed(()=>r8Total.value-r6Total.value)
    const totalDiff=computed(()=>gijutsuDiff.value)
    const r8Forecast=computed(()=>annualReward.value+totalDiff.value)
    const totalDiffPct=computed(()=>annualReward.value?totalDiff.value/annualReward.value*100:0)
    return{r6BT,r6PT,r6MT,r6HT,r6LT,r6Total,r8BT,r8PT,r8MT,r8HT,r8LT,r8Total,annualReward,gijutsuDiff,totalDiff,r8Forecast,totalDiffPct,formatYen,formatDiff,formatDiffPercent}
  },
  template:`<div>
<div class="section"><div class="section-title">経営影響シミュレーション</div>
<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">R7実績 vs R8予測</div>
<div class="kpi-card info" style="margin-bottom:8px"><div class="kpi-label">R7 年間売上</div><div class="kpi-value" style="font-size:16px">{{formatYen(annualReward)}}</div><div class="kpi-unit">円</div></div>
<div class="kpi-card" :class="totalDiff>=0?'positive':'negative'" style="margin-bottom:8px"><div class="kpi-label">R8 予測</div><div class="kpi-value" style="font-size:16px">{{formatYen(r8Forecast)}}</div><div class="kpi-unit">円</div></div>
<div class="kpi-card" :class="totalDiff>=0?'positive':'negative'" style="margin-bottom:12px"><div class="kpi-label">増減</div><div class="kpi-value" style="font-size:16px">{{formatDiff(totalDiff)}}</div><div class="kpi-unit">{{formatDiffPercent(totalDiffPct)}}</div></div>
</div>
<div class="section"><div class="section-title" style="font-size:13px">カテゴリ別</div>
<table class="compare-table" style="font-size:11px"><thead><tr><th style="text-align:left">区分</th><th>R7</th><th>R8</th><th>増減</th></tr></thead><tbody>
<tr><td style="text-align:left">A.基本料</td><td>{{formatYen(r6BT)}}</td><td>{{formatYen(r8BT)}}</td><td :class="r8BT-r6BT>=0?'diff-pos':'diff-neg'">{{formatDiff(r8BT-r6BT)}}</td></tr>
<tr><td style="text-align:left">B.調製料</td><td>{{formatYen(r6PT)}}</td><td>{{formatYen(r8PT)}}</td><td :class="r8PT-r6PT>=0?'diff-pos':'diff-neg'">{{formatDiff(r8PT-r6PT)}}</td></tr>
<tr><td style="text-align:left">C.管理料</td><td>{{formatYen(r6MT)}}</td><td>{{formatYen(r8MT)}}</td><td :class="r8MT-r6MT>=0?'diff-pos':'diff-neg'">{{formatDiff(r8MT-r6MT)}}</td></tr>
<tr><td style="text-align:left">D.在宅</td><td>{{formatYen(r6HT)}}</td><td>{{formatYen(r8HT)}}</td><td :class="r8HT-r6HT>=0?'diff-pos':'diff-neg'">{{formatDiff(r8HT-r6HT)}}</td></tr>
<tr><td style="text-align:left">E.介護</td><td>{{formatYen(r6LT)}}</td><td>{{formatYen(r8LT)}}</td><td :class="r8LT-r6LT>=0?'diff-pos':'diff-neg'">{{formatDiff(r8LT-r6LT)}}</td></tr>
<tr class="total-row" style="font-weight:700"><td style="text-align:left">合計</td><td>{{formatYen(r6Total)}}</td><td>{{formatYen(r8Total)}}</td><td :class="gijutsuDiff>=0?'diff-pos':'diff-neg'">{{formatDiff(gijutsuDiff)}}</td></tr>
</tbody></table></div>
<div class="section"><div class="section-title" style="border-left:4px solid var(--pos);padding-left:8px;color:var(--pos)">A. 優先的に取り組む加算（ROI高）</div>
<div style="font-size:12px;line-height:1.8;color:var(--text-muted)">
<div style="font-size:11px;margin-bottom:8px;color:var(--text-faint)">売上インパクトが大きく、届出・体制整備の手間に対して十分なリターンが見込める加算です。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>地域支援・医薬品供給対応体制加算</b>（27〜67点/処方箋）<br>年間処方箋数 x 点数 = <b style="color:var(--pos)">最大インパクト</b>。後発品85%以上を維持し、9指標の実績を積み上げることで加算2以上を目指す。全加算の中で最も経営影響が大きい。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>在宅薬学総合体制加算</b>（加算1: 30点 / 加算2イ: 100点）<br>R8で加算2イ（個人宅）が50→100点に倍増。在宅訪問の実績があれば処方箋ごとに上乗せされるため、在宅を行っている薬局は必ず届出すべき。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>調剤ベースアップ評価料</b>（4点/処方箋）<br>届出するだけで全処方箋に4点加算。40歳未満の対象職員がいれば必ず届出。R9.6以降は8点に倍増。</div>
</div></div>
<div class="section"><div class="section-title" style="border-left:4px solid var(--amber);padding-left:8px;color:var(--amber)">B. 最低限維持する加算（守りの戦略）</div>
<div style="font-size:12px;line-height:1.8;color:var(--text-muted)">
<div style="font-size:11px;margin-bottom:8px;color:var(--text-faint)">加算自体の金額は小さいが、他の重要な加算の届出要件に関わるため、実績を維持すべきものです。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>かかりつけ薬剤師 1イ・2イの算定実績</b><br>地域支援・医薬品供給対応体制加算の実績要件④に「服薬管理指導料1イ・2イの算定回数20回以上（1万枚あたり）」がある。<b style="color:var(--neg)">これがゼロだと地域加算2〜5の届出ができなくなる。</b>旧かかりつけ薬剤師指導料の同意患者をそのまま1イ・2イで算定し続けることが重要。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>後発医薬品の使用割合 85%以上</b><br>地域加算の基礎要件。50%以下なら調剤基本料が<b style="color:var(--neg)">5点減算</b>。直近3か月の実績で判定（毎月）。</div>
</div></div>
<div class="section"><div class="section-title" style="border-left:4px solid var(--text-faint);padding-left:8px;color:var(--text-faint)">C. 様子見でよい加算（手間 > 収益）</div>
<div style="font-size:12px;line-height:1.8;color:var(--text-muted)">
<div style="font-size:11px;margin-bottom:8px;color:var(--text-faint)">点数は設定されているが、対象患者が限定的で算定件数が少ないため、積極的に取りに行くと手間ばかりかかるものです。実績が自然に出てきたときに算定する程度でOK。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>フォローアップ加算</b>（50点・3月に1回）<br>残薬調整加算等の実績がある患者に電話フォローが必要。対象患者が限定的で年間数件程度。年間数千円のために電話業務を増やすのは非効率。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>訪問加算</b>（230点・6月に1回）<br>かかりつけ薬剤師が患家訪問し残薬整理。訪問の手間・交通費を考慮すると年間数件では割に合わない。在宅業務の延長で自然に発生する場合のみ算定。</div>
<div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px"><b>服用薬剤調整支援料2</b>（R8: イ110点/ロ90点 → R9.6以降: 1,000点）<br>R8年度中は現行点数で算定可能。R9.6以降の1,000点は研修修了者が必要。準備段階として研修修了者の育成を開始。</div>
</div></div>
<div class="section"><div class="section-title" style="border-left:4px solid var(--neg);padding-left:8px;color:var(--neg)">D. 注意すべきリスク</div>
<div style="font-size:12px;line-height:1.8;color:var(--text-muted)">
<div style="padding:8px 10px;background:#fee;border-radius:6px;margin-bottom:8px"><b style="color:var(--neg)">かかりつけ薬剤師の算定実績ゼロ</b><br>→ 地域加算の要件④を満たせず、加算2〜5（32〜67点/処方箋）が届出不可に。年間数十万円規模の減収リスク。</div>
<div style="padding:8px 10px;background:#fee;border-radius:6px;margin-bottom:8px"><b style="color:var(--neg)">後発医薬品の使用割合 50%以下</b><br>→ 調剤基本料が<b>5点減算</b>（月600回超の薬局）。加えて地域加算の基礎要件（85%以上）も満たせなくなる。</div>
<div style="padding:8px 10px;background:#fee;border-radius:6px;margin-bottom:8px"><b style="color:var(--neg)">定例報告（8月）の未提出</b><br>→ 妥結率未報告減算・後発品減算の対象。報告するだけで回避できるため、必ず期限内に提出。</div>
</div></div>
<div class="section"><div class="section-title" style="font-size:13px">経営戦略のまとめ</div>
<div style="font-size:12px;line-height:1.8;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:6px">
<b>全ての加算を取りに行く必要はありません。</b>経営インパクトの大きい加算に集中し、小さい加算は自然に実績が出たときだけ算定するのが効率的な戦略です。<br><br>
<b style="color:var(--pos)">集中すべき:</b> 地域加算 → 在宅薬学総合体制 → ベースアップ評価料<br>
<b style="color:var(--amber)">守るべき:</b> かかりつけ1イ・2イの実績維持 → 後発品85%維持<br>
<b style="color:var(--text-faint)">様子見:</b> フォローアップ加算・訪問加算・支援料2
</div></div>
</div>`
}

const TasksTab = {
  props: ['data', 'forceView', 'todokeCategory', 'goToJudge'],
  setup(props) {

    // Reactive task store (loaded from API)
    const store = reactive({ categories: [], tasks: {}, events: [] })
    const loading = ref(true)

    // API helpers
    async function loadTasks() {
      try {
        const res = await fetch('/api/tasks')
        if (!res.ok) throw new Error(res.status)
        const json = await res.json()
        store.categories = json.categories || []
        store.tasks = json.tasks || {}
        store.events = json.events || []
      } catch (e) {
        console.warn('API未接続、フォールバック使用:', e.message)
        store.categories = window.TASK_CATEGORIES || []
        const defs = window.TASK_DEFINITIONS || {}
        for (const [id, t] of Object.entries(defs)) store.tasks[id] = { ...t, status: 'todo' }
      }
      loading.value = false
    }
    let saveTimer = null
    function saveTasks() {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(async () => {
        try { await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: store.categories, tasks: store.tasks, events: store.events }) }) }
        catch (e) { console.error('保存失敗:', e.message) }
      }, 300)
    }
    loadTasks()

    // View mode (calendar / kanban)
    const viewMode = ref(props.forceView || localStorage.getItem('task-view') || 'kanban')
    watch(viewMode, v => { if (!props.forceView) localStorage.setItem('task-view', v) })

    // Status
    function status(id) { return store.tasks[id]?.status || 'todo' }
    function setStatus(id, s) { if (store.tasks[id]) { store.tasks[id].status = s; saveTasks() } }
    function cycleStatus(id) {
      const s = status(id)
      setStatus(id, s === 'todo' ? 'wip' : s === 'wip' ? 'done' : 'todo')
    }
    const statusLabel = { todo: '未着手', wip: '進行中', done: '完了' }

    // Tags
    const tagDefs = {
      todoke: { label: '届出', color: 'var(--purple)' },
      todoke_youken: { label: '要件・手続き', color: 'var(--teal)' },
      todoke_unyo: { label: '運用', color: 'var(--amber)' },
      system: { label: 'システム', color: 'var(--teal)' },
      operation: { label: '運用・施設', color: 'var(--amber)' }
    }
    const taskSubTab = ref('youken')
    function tagLabel(t) { return tagDefs[t?.tag]?.label || '' }
    function tagColor(t) { return tagDefs[t?.tag]?.color || 'var(--text-faint)' }

    const columns = [{ key: 'todo', label: '未着手' }, { key: 'wip', label: '進行中' }, { key: 'done', label: '完了' }]
    const allTasks = computed(() => {
      const list = []
      for (const [tid, task] of Object.entries(store.tasks)) {
        list.push({ id: tid, task, cat: tagDefs[task.tag]?.label || '' })
      }
      return list
    })
    function tasksInColumn(col) {
      let tasks = allTasks.value.filter(t => status(t.id) === col)
      if (taskSubTab.value === 'youken') tasks = tasks.filter(t => t.task.tag !== 'todoke_unyo')
      else if (taskSubTab.value === 'unyo') tasks = tasks.filter(t => t.task.tag === 'todoke_unyo')
      return tasks
    }

    // ── Calendar logic ──
    const currentMonth = ref(new Date())
    const selectedDate = ref(null)

    function prevMonth() {
      const d = new Date(currentMonth.value)
      d.setMonth(d.getMonth() - 1)
      currentMonth.value = d
      selectedDate.value = null
    }
    function nextMonth() {
      const d = new Date(currentMonth.value)
      d.setMonth(d.getMonth() + 1)
      currentMonth.value = d
      selectedDate.value = null
    }
    function goToday() {
      currentMonth.value = new Date()
      selectedDate.value = null
    }

    const monthLabel = computed(() => {
      const d = currentMonth.value
      return `${d.getFullYear()}年${d.getMonth() + 1}月`
    })

    const calendarDays = computed(() => {
      const y = currentMonth.value.getFullYear()
      const m = currentMonth.value.getMonth()
      const firstDay = new Date(y, m, 1)
      // Monday=0 … Sunday=6 (JS: Sunday=0, so adjust)
      let startDow = firstDay.getDay() - 1
      if (startDow < 0) startDow = 6
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const days = []
      // Previous month padding
      const prevLast = new Date(y, m, 0).getDate()
      for (let i = startDow - 1; i >= 0; i--) {
        const date = new Date(y, m - 1, prevLast - i)
        days.push({ date, day: prevLast - i, otherMonth: true, dateStr: fmtDate(date) })
      }
      // Current month
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(y, m, d)
        days.push({ date, day: d, otherMonth: false, dateStr: fmtDate(date) })
      }
      // Next month padding (fill to 42 cells = 6 rows)
      const remaining = 42 - days.length
      for (let d = 1; d <= remaining; d++) {
        const date = new Date(y, m + 1, d)
        days.push({ date, day: d, otherMonth: true, dateStr: fmtDate(date) })
      }
      return days
    })

    function fmtDate(d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const todayStr = computed(() => fmtDate(new Date()))

    // Tasks grouped by deadline date
    const tasksByDate = computed(() => {
      const map = {}
      for (const t of allTasks.value) {
        const dl = t.task.deadline
        if (!dl) continue
        if (!map[dl]) map[dl] = []
        map[dl].push(t)
      }
      return map
    })

    function tasksForDate(dateStr) {
      return tasksByDate.value[dateStr] || []
    }

    function dotsForDate(dateStr) {
      const tasks = tasksForDate(dateStr)
      const dots = tasks.map(t => {
        const s = status(t.id)
        if (s === 'done') return { cls: 'cal-dot-done' }
        if (s === 'wip') return { cls: 'cal-dot-wip' }
        if (t.task.deadline && t.task.deadline < todayStr.value) return { cls: 'cal-dot-overdue' }
        return { cls: 'cal-dot-todo' }
      })
      const evts = eventsForDate(dateStr)
      for (const ev of evts) dots.push({ cls: 'cal-dot-event', color: 'var(--purple)' })
      return dots
    }

    function selectDate(dateStr) {
      selectedDate.value = selectedDate.value === dateStr ? null : dateStr
    }

    // Deadline color class
    function deadlineClass(task) {
      if (!task.deadline) return ''
      const s = task.status || 'todo'
      if (s === 'done') return 'done'
      const today = todayStr.value
      if (task.deadline < today) return 'overdue'
      if (task.deadline === today) return 'due-today'
      // 3 days from now
      const d = new Date()
      d.setDate(d.getDate() + 3)
      const soon = fmtDate(d)
      if (task.deadline <= soon) return 'due-soon'
      return ''
    }

    function formatDeadlineShort(dateStr) {
      if (!dateStr) return ''
      const parts = dateStr.split('-')
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`
    }

    function selectedDateLabel() {
      if (!selectedDate.value) return ''
      const parts = selectedDate.value.split('-')
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
      return `${parseInt(parts[1])}月${parseInt(parts[2])}日（${dow}）`
    }

    // ── Subtask operations ──
    function subtaskProgress(task) {
      const subs = task.subtasks || []
      if (!subs.length) return null
      const done = subs.filter(s => s.done).length
      return { done, total: subs.length, pct: Math.round(done / subs.length * 100) }
    }

    function toggleSubtask(taskId, subtaskId) {
      const t = store.tasks[taskId]
      if (!t || !t.subtasks) return
      const sub = t.subtasks.find(s => s.id === subtaskId)
      if (sub) { sub.done = !sub.done; saveTasks() }
    }

    // Drag & drop
    const dragId = ref(null)
    function onDragStart(e, id) { dragId.value = id; e.dataTransfer.effectAllowed = 'move' }
    function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
    function onDrop(e, targetCol) { e.preventDefault(); if (dragId.value) { setStatus(dragId.value, targetCol); dragId.value = null } }
    function onDragEnd() { dragId.value = null }

    // Expand & edit
    const expandedCard = ref(null)
    function toggleExpand(id) { expandedCard.value = expandedCard.value === id ? null : id }
    const editingCard = ref(null)
    const editForm = reactive({ title: '', detail: '', deadline: '' })
    function startEdit(id) {
      const t = store.tasks[id]
      if (!t) return
      editForm.title = t.title; editForm.detail = t.detail || ''; editForm.deadline = t.deadline || ''
      editingCard.value = id
    }
    function saveEdit(id) {
      if (!store.tasks[id] || !editForm.title.trim()) return
      store.tasks[id].title = editForm.title.trim()
      store.tasks[id].detail = editForm.detail.trim()
      store.tasks[id].deadline = editForm.deadline.trim()
      editingCard.value = null
      saveTasks()
    }
    function cancelEdit() { editingCard.value = null }

    // Add task (with subtasks support)
    const showAddForm = ref(false)
    const addForm = reactive({ title: '', detail: '', deadline: '', tag: 'todoke', newSubtask: '', subtasks: [] })
    function openAddForm() {
      addForm.title = ''; addForm.detail = ''; addForm.deadline = ''; addForm.tag = 'todoke'; addForm.newSubtask = ''; addForm.subtasks = []
      showAddForm.value = true
    }
    function addSubtaskToForm() {
      if (!addForm.newSubtask.trim()) return
      addForm.subtasks.push({ id: 's' + (addForm.subtasks.length + 1), label: addForm.newSubtask.trim(), done: false })
      addForm.newSubtask = ''
    }
    function removeSubtaskFromForm(idx) { addForm.subtasks.splice(idx, 1) }
    function addTask() {
      if (!addForm.title.trim()) return
      const id = 'u' + Date.now()
      const task = { title: addForm.title.trim(), detail: addForm.detail.trim(), deadline: addForm.deadline, status: 'todo', tag: addForm.tag }
      if (addForm.subtasks.length) task.subtasks = addForm.subtasks.map((s, i) => ({ id: 's' + (i + 1), label: s.label, done: false }))
      store.tasks[id] = task
      showAddForm.value = false
      saveTasks()
    }

    // ── Calendar events (schedules) ──
    // ── Calendar events (schedules) ──
    const showAddEvent = ref(false)
    const eventForm = reactive({ title: '', date: '' })
    function openAddEvent() {
      eventForm.title = ''; eventForm.date = ''
      showAddEvent.value = true
    }
    function addEvent() {
      if (!eventForm.title.trim() || !eventForm.date) return
      store.events.push({ id: 'ev' + Date.now(), title: eventForm.title.trim(), date: eventForm.date, color: 'purple' })
      showAddEvent.value = false
      saveTasks()
    }
    function deleteEvent(id) {
      const idx = store.events.findIndex(e => e.id === id)
      if (idx >= 0) { store.events.splice(idx, 1); saveTasks() }
    }
    function eventsForDate(dateStr) {
      return store.events.filter(e => e.date === dateStr)
    }

    // Delete task
    function deleteTask(id) {
      if (!confirm('このタスクを削除しますか？')) return
      delete store.tasks[id]
      for (const cat of store.categories) { cat.keys = cat.keys.filter(k => k !== id) }
      expandedCard.value = null
      saveTasks()
    }

    // Todoke checklist
    const TODOKE_KEY = 'houshu-todoke-checks'
    const todokeChecks = reactive(JSON.parse(localStorage.getItem(TODOKE_KEY) || '{}'))
    function saveTodokeChecks() { localStorage.setItem(TODOKE_KEY, JSON.stringify(todokeChecks)) }
    const todokeCounts = { shinki: 9, houkoku: 2, keika: 3, menkyo: 2 }
    function todokeProgress(cat) {
      const total = todokeCounts[cat]
      let done = 0
      for (const [k,v] of Object.entries(todokeChecks)) { if (k.startsWith(cat + '_') && v === true) done++ }
      return done + '/' + total
    }
    // 届出テーブルデータ（cat: サブタブカテゴリ）
    const allTodokeItems = [
      // R8新設（新たに施設基準が創設されたもの）
      { cat: 'r8shinsetsu', key: 'sn_1', label: '調剤ベースアップ評価料', youshiki: '様式103', jisseki: '賃金改善計画', handan: '−', tekiyou: '届出月翌月〜', noR7: true, kikan: '5/7〜6/1', judgeId: 'k_baseup', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'r8shinsetsu', key: 'sn_2a', label: '地域支援・医薬品供給対応体制加算（加算1）', youshiki: '様式87の3の1', jisseki: '在宅指導実績等（基本要件）', handan: '直近1年', tekiyou: '6月〜翌年5月末', noR7: true, kikan: '5/7〜6/1', judgeId: 'k_chiiki', r8options: [{v:'shinki',l:'新体系で届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'r8shinsetsu', key: 'sn_2b', label: '地域支援・医薬品供給対応体制加算（加算2〜5）', youshiki: '様式87の3の2', jisseki: '9指標の実績（後発品率等）', handan: '後発品: 直近3月 / その他: 直近1年', tekiyou: '6月〜翌年5月末', noR7: true, kikan: '5/7〜6/1', judgeId: 'k_chiiki', r8options: [{v:'shinki',l:'新体系で届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'r8shinsetsu', key: 'sn_3', label: '在宅薬学総合体制加算2イ・ロ', youshiki: '様式87の3の5', jisseki: '在宅患者への指導実績', handan: '直近1年', tekiyou: '届出翌月〜翌年5月末', noR7: true, kikan: '5/7〜6/1', judgeId: 'k_zaitaku', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'r8shinsetsu', key: 'sn_4', label: 'バイオ後続品調剤体制加算', youshiki: '−', jisseki: 'バイオ後続品の保管・説明体制', handan: '−', tekiyou: '届出月翌月〜', noR7: true, kikan: '随時届出可', judgeId: 'k_bio', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'r8shinsetsu', key: 'sn_5', label: '服薬管理指導料の注1（かかりつけ薬剤師）', youshiki: '様式90', jisseki: '薬剤師の経験・勤務時間等', handan: '−', tekiyou: '届出月翌月〜', noR7: true, kikan: '5/7〜6/1', judgeId: 'yg_fukuyaku', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      // R8減算（新設）
      { cat: 'r8gensan', key: 'gs_1', label: '門前薬局等立地依存減算', youshiki: '様式84', jisseki: '立地・集中率', handan: '直近1年', tekiyou: '6月〜翌年5月末', noR7: true, kikan: '調剤基本料と同時届出', judgeId: 'k_kihon', r8options: [{v:'gaitou',l:'該当'},{v:'higaitou',l:'非該当'}] },
      // R8改定（施設基準が改正されたもの）
      { cat: 'r8kaitei', key: 'ka_1', label: '調剤基本料', youshiki: '様式84・85', jisseki: '処方箋受付回数・集中率', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_kihon_cnt', kikan: '区分変更時のみ届出', judgeId: 'k_kihon', r8options: [{v:'keizoku',l:'継続（届出不要）'},{v:'henkou',l:'区分変更→届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'r8kaitei', key: 'ka_2', label: '在宅薬学総合体制加算1', youshiki: '様式87の3の5', jisseki: '在宅患者への指導実績', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_zaitaku_taisei_cnt', kikan: '区分変更なし→届出不要', judgeId: 'k_zaitaku', r8options: [{v:'keizoku',l:'継続（届出不要）'},{v:'henkou',l:'変更→届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'r8kaitei', key: 'ka_3', label: '連携強化加算', youshiki: '様式87の3の3', jisseki: '連携体制の整備', handan: '−', tekiyou: '届出月翌月〜', r7key: 'k_renkei_cnt', kikan: '変更なし→届出不要', judgeId: 'k_renkei', r8options: [{v:'keizoku',l:'継続（届出不要）'},{v:'jitai',l:'辞退'}] },
      { cat: 'r8kaitei', key: 'ka_4', label: '電子的調剤情報連携体制整備加算', youshiki: '様式87の3の6', jisseki: '電子処方箋チェック機能', handan: '−', tekiyou: '届出月翌月〜', r7key: 'k_dx8_cnt', kikan: '名称変更のみ→届出不要', judgeId: 'k_dx8', r8options: [{v:'keizoku',l:'継続（届出不要）'},{v:'jitai',l:'辞退'}] },
      { cat: 'r8kaitei', key: 'ka_5', label: '特定薬剤管理指導加算2（抗悪性腫瘍）', youshiki: '様式92', jisseki: '薬剤師5年以上・研修等', handan: '−', tekiyou: '届出月翌月〜', r7key: 't_tokutei_2_cnt', kikan: '変更なし→届出不要', r8options: [{v:'keizoku',l:'継続（届出不要）'},{v:'jitai',l:'辞退'}] },
      // 賃上げ
      { cat: 'chinage', key: 'ch_1', label: '調剤ベースアップ評価料', youshiki: '様式103', jisseki: '賃金改善計画の策定', handan: '−', tekiyou: '届出月翌月〜', r7key: null, kikan: '5/7〜6/1', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'chinage', key: 'ch_2', label: '調剤物価対応料', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: null, kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      // 体制加算
      { cat: 'taisei', key: 'ta_1', label: '調剤基本料', youshiki: '様式84・85', jisseki: '処方箋受付回数・集中率', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_kihon_cnt', kikan: '区分変更時', r8options: [{v:'keizoku',l:'継続'},{v:'shinki',l:'新規届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'taisei', key: 'ta_2a', label: '地域支援・医薬品供給対応体制加算（加算1）', youshiki: '様式87の3の1', jisseki: '在宅指導実績等（基本要件）', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_chiiki_cnt', kikan: '5/7〜6/1', judgeId: 'k_chiiki', r8options: [{v:'shinki',l:'新体系で届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'taisei', key: 'ta_2b', label: '地域支援・医薬品供給対応体制加算（加算2〜5）', youshiki: '様式87の3の2', jisseki: '9指標の実績（後発品率等）', handan: '後発品: 直近3月 / その他: 直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_chiiki_cnt', kikan: '5/7〜6/1', judgeId: 'k_chiiki', r8options: [{v:'shinki',l:'新体系で届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'taisei', key: 'ta_3', label: '連携強化加算', youshiki: '様式87の3の3', jisseki: '連携体制の整備', handan: '−', tekiyou: '届出月翌月〜', r7key: 'k_renkei_cnt', kikan: '変更なし→届出不要', r8options: [{v:'keizoku',l:'継続'},{v:'jitai',l:'辞退'}] },
      { cat: 'taisei', key: 'ta_4', label: '電子的調剤情報連携体制整備加算', youshiki: '様式87の3の6', jisseki: '電子処方箋チェック機能', handan: '−', tekiyou: '届出月翌月〜', r7key: 'k_dx8_cnt', kikan: '名称変更のみ→届出不要', r8options: [{v:'keizoku',l:'継続'},{v:'jitai',l:'辞退'}] },
      { cat: 'taisei', key: 'ta_5', label: '在宅薬学総合体制加算', youshiki: '様式87の3の5', jisseki: '在宅患者への指導実績', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_zaitaku_taisei_cnt', kikan: '5/7〜6/1', r8options: [{v:'keizoku',l:'継続'},{v:'shinki',l:'新規届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'taisei', key: 'ta_6', label: 'バイオ後続品調剤体制加算', youshiki: '−', jisseki: 'バイオ後続品の保管・説明体制', handan: '−', tekiyou: '届出月翌月〜', r7key: null, kikan: '随時届出可', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'taisei', key: 'ta_7', label: '時間外加算', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 'k_jikangai_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      { cat: 'taisei', key: 'ta_8', label: '夜間・休日等加算', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 'k_yakan_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      // 薬剤調製料・薬剤料
      { cat: 'chozai', key: 'cz_1', label: '薬剤調製料', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 'k_naifuku_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      { cat: 'chozai', key: 'cz_2', label: '無菌製剤処理加算', youshiki: '様式88', jisseki: '無菌調製設備・薬剤師体制', handan: '−', tekiyou: '届出月翌月〜', r7key: 't_mukin_cnt', kikan: '随時届出可', r8options: [{v:'keizoku',l:'継続'},{v:'shinki',l:'新規届出'},{v:'jitai',l:'辞退'}] },
      // 薬学管理料
      { cat: 'yakugaku', key: 'yg_1', label: '服薬管理指導料の注1（かかりつけ薬剤師）', youshiki: '様式90', jisseki: '薬剤師の経験・勤務時間等', handan: '−', tekiyou: '届出月翌月〜', r7key: null, kikan: '5/7〜6/1', r8options: [{v:'shinki',l:'新規届出'},{v:'fusantei',l:'算定しない'}] },
      { cat: 'yakugaku', key: 'yg_2', label: '特定薬剤管理指導加算2（抗悪性腫瘍）', youshiki: '様式92', jisseki: '薬剤師5年以上・研修等', handan: '−', tekiyou: '届出月翌月〜', r7key: 't_tokutei_2_cnt', kikan: '随時届出可', r8options: [{v:'keizoku',l:'継続'},{v:'shinki',l:'新規届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'yakugaku', key: 'yg_3', label: '調剤管理料', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 't_kanri_nai_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      { cat: 'yakugaku', key: 'yg_4', label: '服薬管理指導料', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 't_fukuyaku_a_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      // 在宅
      { cat: 'zaitaku', key: 'zt_1', label: '在宅薬学総合体制加算', youshiki: '様式87の3の5', jisseki: '在宅患者への指導実績', handan: '直近1年', tekiyou: '6月〜翌年5月末', r7key: 'k_zaitaku_taisei_cnt', kikan: '5/7〜6/1', r8options: [{v:'keizoku',l:'継続'},{v:'shinki',l:'新規届出'},{v:'jitai',l:'辞退'}] },
      { cat: 'zaitaku', key: 'zt_2', label: '在宅患者訪問薬剤管理指導料', youshiki: '−', jisseki: '−（届出不要）', handan: '−', tekiyou: '−', r7key: 't_zaitaku_houmon_cnt', kikan: '届出不要', r8options: [{v:'keizoku',l:'自動算定'}] },
      { cat: 'zaitaku', key: 'zt_3', label: '麻薬小売業者の免許', youshiki: '−', jisseki: '免許の取得', handan: '−', tekiyou: '常時', r7key: null, kikan: '常時保持', r8options: [{v:'ari',l:'取得済'},{v:'nashi',l:'未取得'}] },
      { cat: 'zaitaku', key: 'zt_4', label: '高度管理医療機器の販売業許可', youshiki: '−', jisseki: '許可の取得', handan: '−', tekiyou: '常時', r7key: null, kikan: '常時保持', r8options: [{v:'ari',l:'取得済'},{v:'nashi',l:'未取得'}] },
    ]
    const todokeCategory = computed(() => props.todokeCategory || 'r8')
    const todokeItemsShinsetsu = computed(() => allTodokeItems.filter(i => i.cat === 'r8shinsetsu'))
    const todokeItemsKaitei = computed(() => allTodokeItems.filter(i => i.cat === 'r8kaitei'))
    const todokeItemsGensan = computed(() => allTodokeItems.filter(i => i.cat === 'r8gensan'))
    const todokeItems = computed(() => {
      if (todokeCategory.value === 'r8') return [] // r8は専用テンプレートで表示
      return allTodokeItems.filter(i => i.cat === todokeCategory.value)
    })
    function r7Status(item) {
      if (item.noR7) return { text: '−', color: 'var(--text-muted)' }
      if (!item.r7key) return { text: '−', color: 'var(--text-muted)' }
      const v = props.data?.r6?.[item.r7key]
      if (v && v > 0) return { text: '届出済', color: 'var(--teal)' }
      return { text: '未届出', color: 'var(--text-faint)' }
    }

    // Flow checklist
    const FLOW_KEY = 'houshu-flow-checks'
    const flowChecks = reactive(JSON.parse(localStorage.getItem(FLOW_KEY) || '{}'))
    function saveFlowChecks() { localStorage.setItem(FLOW_KEY, JSON.stringify(flowChecks)) }
    const phaseCounts = { phase0: 4, phase1: 4, phase2: 8, phase3: 5, phase4: 4 }
    function phaseProgress(phase) {
      const total = phaseCounts[phase]
      let done = 0
      for (const [k,v] of Object.entries(flowChecks)) { if (k.startsWith(phase) && v) done++ }
      return done + '/' + total
    }

    // R8予測データから届出プルダウンを読込
    const todokeR8Loaded = ref(false)
    const todokeR8Cleared = ref(false)
    // R8データキー → 届出キーのマッピング
    const r8ToTodokeMap = {
      k_baseup: [{ keys: ['ch_1', 'sn_1'], yes: 'shinki', no: 'fusantei' }],
      k_kihon: [{ keys: ['ka_1'], yes: 'henkou', no: 'keizoku' }],
      k_chiiki: [{ keys: ['sn_2a', 'sn_2b', 'ta_2a', 'ta_2b'], yes: 'shinki', no: 'fusantei' }],
      k_renkei: [{ keys: ['ka_3', 'ta_3'], yes: 'keizoku', no: 'jitai' }],
      k_dx8: [{ keys: ['ka_4', 'ta_4'], yes: 'keizoku', no: 'jitai' }],
      k_zaitaku_taisei: [{ keys: ['ka_2', 'sn_3', 'ta_5'], yes: 'shinki', no: 'fusantei' }],
      k_bio: [{ keys: ['sn_4'], yes: 'shinki', no: 'fusantei' }],
      t_fukuyaku_a_i: [{ keys: ['sn_5'], yes: 'shinki', no: 'fusantei' }],
    }
    function loadR8ToTodoke() {
      const r8Saved = localStorage.getItem('houshu-r8-data')
      if (!r8Saved) return
      try {
        const r8 = JSON.parse(r8Saved)
        if (!r8.r6) return
        for (const [r8Key, mappings] of Object.entries(r8ToTodokeMap)) {
          const val = r8.r6[r8Key]
          const hasValue = val != null && val !== 0 && val !== '0'
          for (const m of mappings) {
            for (const tk of m.keys) {
              todokeChecks[tk + '_r8'] = hasValue ? m.yes : m.no
            }
          }
        }
        saveTodokeChecks()
        todokeR8Loaded.value = true
        todokeR8Cleared.value = false
      } catch {}
    }
    function clearR8Todoke() {
      const allItems = [...todokeItemsShinsetsu.value, ...todokeItemsKaitei.value, ...todokeItemsGensan.value]
      for (const item of allItems) {
        delete todokeChecks[item.key + '_r8']
      }
      saveTodokeChecks()
      todokeR8Cleared.value = true
      todokeR8Loaded.value = false
    }

    // タスク判定ツール
    const TODOKE_TASK_KEY = 'houshu-todoke-task-sel'
    const todokeTaskDefs = reactive({})
    const todokeTaskModal = ref(null) // 開いているitem
    const todokeTaskSelections = reactive(JSON.parse(localStorage.getItem(TODOKE_TASK_KEY) || '{}'))
    const todokeTaskRegistered = reactive({}) // key → true
    const todokeItemTaskAdded = reactive({})
    // JSON定義を読込
    fetch('data/todoke-task-definitions.json').then(r => r.json()).then(d => { Object.assign(todokeTaskDefs, d) }).catch(() => {})
    // 全タスクをフラット化（カテゴリ構造対応）
    function flatTasks(def) { return def.categories ? def.categories.flatMap(c => c.tasks) : (def.tasks || []) }
    const todokeTaskModalCatIdx = ref(0)
    function openTodokeTaskModal(item, catIdx) {
      if (!todokeTaskDefs[item.key]) return
      const all = flatTasks(todokeTaskDefs[item.key])
      if (!todokeTaskSelections[item.key]) todokeTaskSelections[item.key] = all.map(() => false)
      todokeTaskModalCatIdx.value = catIdx || 0
      todokeTaskModal.value = item
    }
    function closeTodokeTaskModal() { todokeTaskModal.value = null }
    function registerTodokeTask() {
      if (!todokeTaskModal.value) return
      const item = todokeTaskModal.value
      const def = todokeTaskDefs[item.key]
      if (!def || !def.categories) return
      const sel = todokeTaskSelections[item.key]
      if (!sel) return
      const ci = todokeTaskModalCatIdx.value
      const cat = def.categories[ci]
      if (!cat) return
      const offset = def.categories.slice(0, ci).reduce((s, c) => s + c.tasks.length, 0)
      const catChecked = cat.tasks.filter((_, ti) => sel[offset + ti])
      let added = false
      if (catChecked.length > 0) {
        const id = 'todoke_' + item.key + '_' + cat.name + '_' + Date.now()
        const title = item.label + '：' + cat.name
        const subtasks = catChecked.map((label, i) => ({ id: 's' + (i + 1), label, done: false }))
        const tag = cat.name === '運用' ? 'todoke_unyo' : 'todoke_youken'
        store.tasks[id] = { title, detail: '届出期間: ' + item.kikan, deadline: '2026-06-01', status: 'todo', tag, subtasks }
        added = true
        todokeItemTaskAdded[item.key + '_' + ci] = true
      }
      if (added) {
        saveTasks()
      }
      localStorage.setItem(TODOKE_TASK_KEY, JSON.stringify(todokeTaskSelections))
      todokeTaskModal.value = null
    }

    const todokeTaskAdded = ref(false)
    function addTodokeTask() {
      // 届出が必要な項目をタスクとして追加
      const items = [...todokeItemsShinsetsu.value, ...todokeItemsKaitei.value, ...todokeItemsGensan.value]
      const toAdd = items.filter(item => {
        const val = todokeChecks[item.key + '_r8']
        return val && val !== 'fusantei' && val !== 'higaitou' && val !== 'jitai' && val !== 'keizoku'
      })
      if (toAdd.length === 0) return
      const subtasks = toAdd.map((item, i) => ({
        id: 's' + (i + 1),
        label: item.label + (item.youshiki !== '−' ? '（' + item.youshiki + '）' : ''),
        done: false
      }))
      const id = 'todoke_' + Date.now()
      store.tasks[id] = {
        title: 'R8施設基準の届出',
        detail: '届出期間: 5/7〜6/1',
        deadline: '2026-06-01',
        status: 'todo',
        tag: 'todoke',
        subtasks
      }
      saveTasks()
      todokeTaskAdded.value = true
    }

    return { store, loading, viewMode, forceView: props.forceView, todokeCategory, taskSubTab, status, setStatus, cycleStatus, statusLabel, tagDefs, tagLabel, tagColor,
             columns, tasksInColumn, dragId, onDragStart, onDragOver, onDrop, onDragEnd,
             expandedCard, toggleExpand, editingCard, editForm, startEdit, saveEdit, cancelEdit,
             showAddForm, addForm, openAddForm, addTask, addSubtaskToForm, removeSubtaskFromForm, deleteTask,
             currentMonth, selectedDate, prevMonth, nextMonth, goToday, monthLabel, calendarDays,
             todayStr, tasksForDate, dotsForDate, selectDate, deadlineClass, formatDeadlineShort, selectedDateLabel,
             subtaskProgress, toggleSubtask,
             showAddEvent, eventForm, openAddEvent, addEvent, deleteEvent, eventsForDate,
             flowChecks, saveFlowChecks, phaseProgress,
             todokeChecks, saveTodokeChecks, todokeProgress, todokeItems, todokeItemsShinsetsu, todokeItemsKaitei, todokeItemsGensan, todokeCategory, r7Status, goToJudge: props.goToJudge, addTodokeTask, todokeTaskAdded, todokeTaskDefs, todokeTaskModal, todokeTaskModalCatIdx, todokeTaskSelections, todokeItemTaskAdded, openTodokeTaskModal, closeTodokeTaskModal, registerTodokeTask, flatTasks, loadR8ToTodoke, clearR8Todoke, todokeR8Loaded, todokeR8Cleared }
  },
  template: `<div>
    <div v-if="loading&&!forceView" class="section" style="text-align:center;padding:40px;color:var(--text-muted)">読み込み中...</div>
    <template v-else>
    <!-- View Toggle + Add Button -->
    <div v-if="!forceView" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div class="view-toggle">
        <button class="view-toggle-btn" :class="{active: viewMode==='flow'}" @click="viewMode='flow'">事務フロー</button>
        <button class="view-toggle-btn" :class="{active: viewMode==='calendar'}" @click="viewMode='calendar'">カレンダー</button>
        <button class="view-toggle-btn" :class="{active: viewMode==='kanban'}" @click="viewMode='kanban'">カンバン</button>
      </div>
      <div v-if="viewMode!=='flow'&&viewMode!=='todoke'" style="display:flex;gap:6px">
        <button v-if="viewMode==='calendar'" class="btn" @click="openAddEvent" style="border-color:var(--purple);color:var(--purple)">+ 予定追加</button>
        <button class="btn" @click="openAddForm" style="background:var(--text);color:white;border:none">+ タスク追加</button>
      </div>
    </div>

    <!-- Add Event Form (calendar only) -->
    <div v-if="showAddEvent" class="section" style="margin-bottom:12px">
      <div class="section-title">予定を追加</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="eventForm.title" placeholder="予定名（例: 届出書類公開日）">
        <input type="date" class="fee-input" style="max-width:200px;text-align:left" v-model="eventForm.date">
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="showAddEvent=false">キャンセル</button>
          <button class="btn" @click="addEvent" style="background:var(--purple);color:white;border:none">追加</button>
        </div>
      </div>
    </div>

    <!-- Add Task Form -->
    <div v-if="showAddForm" class="section" style="margin-bottom:12px">
      <div class="section-title">タスクを追加</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="addForm.title" placeholder="タスク名（必須）">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="addForm.detail" placeholder="詳細（任意）">
        <input type="date" class="fee-input" style="max-width:200px;text-align:left" v-model="addForm.deadline">
        <select class="fee-select" v-model="addForm.tag" style="max-width:200px">
          <option v-for="(def, key) in tagDefs" :key="key" :value="key">{{def.label}}</option>
        </select>
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-muted)">サブタスク</div>
          <div v-for="(sub, idx) in addForm.subtasks" :key="idx" style="display:flex;align-items:center;gap:4px;margin-bottom:3px;font-size:12px">
            <span style="flex:1">{{ sub.label }}</span>
            <button class="btn" @click="removeSubtaskFromForm(idx)" style="padding:1px 6px;font-size:11px;color:var(--neg)">×</button>
          </div>
          <div style="display:flex;gap:4px">
            <input class="fee-input" style="flex:1;text-align:left" v-model="addForm.newSubtask" placeholder="サブタスク名" @keyup.enter="addSubtaskToForm">
            <button class="btn" @click="addSubtaskToForm" style="white-space:nowrap">追加</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="showAddForm=false">キャンセル</button>
          <button class="btn" @click="addTask" style="background:var(--pos);color:white;border:none">追加</button>
        </div>
      </div>
    </div>

    <!-- ═══ Calendar View ═══ -->
    <div v-if="viewMode==='calendar'">
      <div class="cal-nav">
        <button class="cal-nav-btn" @click="prevMonth">&lt;</button>
        <span class="cal-month-label">{{ monthLabel }}</span>
        <button class="cal-nav-btn" @click="nextMonth">&gt;</button>
        <button class="cal-nav-btn" @click="goToday" style="margin-left:8px;font-size:11px">今日</button>
      </div>
      <div class="cal-grid">
        <div class="cal-header" v-for="dow in ['月','火','水','木','金','土','日']" :key="dow">{{ dow }}</div>
        <div v-for="(cell, i) in calendarDays" :key="i"
             class="cal-cell" :class="{ 'other-month': cell.otherMonth, today: cell.dateStr===todayStr, selected: cell.dateStr===selectedDate }"
             @click="selectDate(cell.dateStr)">
          <span class="cal-date" :class="{ today: cell.dateStr===todayStr }">{{ cell.day }}</span>
          <div v-for="ev in eventsForDate(cell.dateStr)" :key="'e'+ev.id" class="cal-pill cal-pill-event">{{ ev.title }}</div>
          <div v-for="t in tasksForDate(cell.dateStr)" :key="'t'+t.id" class="cal-task-label" :class="'cal-task-label-'+status(t.id)"><span class="cal-task-label-dot" :class="'cal-dot-'+(status(t.id)==='done'?'done':status(t.id)==='wip'?'wip':(t.task.deadline && t.task.deadline < todayStr ? 'overdue':'todo'))"></span>{{ t.task.title }}</div>
        </div>
      </div>
      <!-- Selected Date Detail -->
      <div v-if="selectedDate && (tasksForDate(selectedDate).length || eventsForDate(selectedDate).length)" class="cal-task-list">
        <div class="cal-task-list-header">{{ selectedDateLabel() }}（{{ tasksForDate(selectedDate).length + eventsForDate(selectedDate).length }}件）</div>
        <!-- Events -->
        <div v-for="ev in eventsForDate(selectedDate)" :key="ev.id" class="cal-event-card">
          <span class="cal-event-dot"></span>
          <span class="cal-event-title">{{ ev.title }}</span>
          <button class="cal-event-del" @click="deleteEvent(ev.id)">×</button>
        </div>
        <!-- Tasks -->
        <div v-for="t in tasksForDate(selectedDate)" :key="t.id" class="cal-task-card">
          <div class="cal-task-title">{{ t.task.title }}</div>
          <div class="cal-task-meta">
            <span class="kb-tag-badge" :style="{color: tagColor(t.task)}"><span class="kb-tag-dot" :style="{background: tagColor(t.task)}"></span>{{tagLabel(t.task)}}</span>
            <span class="cal-task-deadline" :class="deadlineClass(t.task)">期限: {{ formatDeadlineShort(t.task.deadline) }}</span>
            <span class="kb-status-pill" :class="'kb-pill-'+status(t.id)" @click="cycleStatus(t.id)" style="margin-left:auto">{{ statusLabel[status(t.id)] }}</span>
          </div>
          <template v-if="subtaskProgress(t.task)">
            <div style="display:flex;align-items:center;gap:6px">
              <span class="subtask-count">{{ subtaskProgress(t.task).done }}/{{ subtaskProgress(t.task).total }}</span>
              <div class="subtask-bar" style="flex:1"><div class="subtask-bar-fill" :style="{width: subtaskProgress(t.task).pct+'%'}"></div></div>
            </div>
            <div class="subtask-list">
              <label v-for="sub in t.task.subtasks" :key="sub.id" class="subtask-item" :class="{'done-subtask': sub.done}">
                <input type="checkbox" :checked="sub.done" @change="toggleSubtask(t.id, sub.id)">
                <span>{{ sub.label }}</span>
              </label>
            </div>
          </template>
        </div>
      </div>
      <div v-else-if="selectedDate" class="cal-task-list">
        <div class="cal-task-list-header">{{ selectedDateLabel() }}</div>
        <div style="font-size:12px;color:var(--text-faint);padding:12px 0">この日の予定はありません</div>
      </div>
    </div>

    <!-- ═══ Kanban View ═══ -->
    <div v-if="viewMode==='kanban'">
      <div style="display:flex;gap:4px;margin-bottom:12px">
        <button class="sub-tab-item" :class="{active:taskSubTab==='youken'}" @click="taskSubTab='youken'" style="font-size:12px;padding:4px 12px">要件・手続き</button>
        <button class="sub-tab-item" :class="{active:taskSubTab==='unyo'}" @click="taskSubTab='unyo'" style="font-size:12px;padding:4px 12px">運用</button>
      </div>
    </div>
    <div v-if="viewMode==='kanban'" class="kb-board">
      <div v-for="col in columns" :key="col.key" class="kb-col" :class="'kb-col-'+col.key"
           @dragover="onDragOver" @drop="onDrop($event, col.key)">
        <div class="kb-col-head">
          <span class="kb-dot" :class="'kb-dot-'+col.key"></span>
          <span class="kb-col-name">{{col.label}}</span>
          <span class="kb-col-num">{{tasksInColumn(col.key).length}}</span>
        </div>
        <div class="kb-col-cards">
          <div v-for="t in tasksInColumn(col.key)" :key="t.id"
               class="kb-card" :class="['kb-card-'+col.key, {dragging: dragId===t.id}]"
               draggable="true" @dragstart="onDragStart($event, t.id)" @dragend="onDragEnd"
               @click="toggleExpand(t.id)">
            <div class="kb-card-top">
              <span class="kb-card-title" :class="{'kb-done-text': col.key==='done'}">{{t.task.title}}</span>
            </div>
            <div v-if="t.task.deadline" class="kb-card-dl" :class="deadlineClass(t.task)">{{formatDeadlineShort(t.task.deadline)}}</div>
            <template v-if="subtaskProgress(t.task)">
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                <span class="subtask-count">{{subtaskProgress(t.task).done}}/{{subtaskProgress(t.task).total}}</span>
                <div class="subtask-bar" style="flex:1"><div class="subtask-bar-fill" :style="{width: subtaskProgress(t.task).pct+'%'}"></div></div>
              </div>
            </template>
            <div class="kb-card-foot">
              <span class="kb-tag-badge" :style="{color: tagColor(t.task)}"><span class="kb-tag-dot" :style="{background: tagColor(t.task)}"></span>{{tagLabel(t.task)}}</span>
              <span class="kb-status-pill" :class="'kb-pill-'+col.key" @click.stop="cycleStatus(t.id)">{{statusLabel[col.key]}}</span>
            </div>
            <div v-if="expandedCard===t.id" class="kb-card-expand" @click.stop>
              <template v-if="editingCard===t.id">
                <input class="fee-input" style="max-width:100%;text-align:left;margin-bottom:4px" v-model="editForm.title" placeholder="タスク名">
                <input class="fee-input" style="max-width:100%;text-align:left;margin-bottom:4px" v-model="editForm.detail" placeholder="詳細">
                <input type="date" class="fee-input" style="max-width:200px;text-align:left;margin-bottom:8px" v-model="editForm.deadline">
                <div style="display:flex;gap:4px">
                  <button class="kb-move-btn" @click.stop="cancelEdit">キャンセル</button>
                  <button class="kb-move-btn kb-move-active" @click.stop="saveEdit(t.id)">保存</button>
                </div>
              </template>
              <template v-else>
                <div class="kb-card-desc">{{t.task.detail}}</div>
                <template v-if="t.task.subtasks && t.task.subtasks.length">
                  <div class="subtask-list" style="margin-bottom:8px">
                    <label v-for="sub in t.task.subtasks" :key="sub.id" class="subtask-item" :class="{'done-subtask': sub.done}">
                      <input type="checkbox" :checked="sub.done" @change="toggleSubtask(t.id, sub.id)">
                      <span>{{ sub.label }}</span>
                    </label>
                  </div>
                </template>
                <div class="kb-card-move">
                  <button v-for="c in columns" :key="c.key" class="kb-move-btn" :class="{'kb-move-active': col.key===c.key}" @click.stop="setStatus(t.id, c.key)">{{c.label}}</button>
                </div>
                <div style="display:flex;gap:4px;margin-top:6px">
                  <button class="kb-move-btn" @click.stop="startEdit(t.id)" style="flex:1">編集</button>
                  <button class="kb-move-btn" @click.stop="deleteTask(t.id)" style="flex:1;color:var(--neg)">削除</button>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div v-if="!tasksInColumn(col.key).length" class="kb-empty-col">ドラッグしてここに移動</div>
      </div>
    </div>

    <!-- ═══ Todoke View ═══ -->
    <div v-if="viewMode==='todoke'" class="section">

      <!-- R8カテゴリ: 新設と改定を2ボックスで表示 -->
      <template v-if="todokeCategory==='r8'">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 20px" @click="loadR8ToTodoke()">R8予測を読込</button>
        <button class="btn" style="font-weight:600;padding:8px 20px" @click="clearR8Todoke()">読込をクリア</button>
        <span v-if="todokeR8Loaded" style="font-size:12px;color:var(--pos);font-weight:600">R8予測を読み込みました</span>
        <span v-if="todokeR8Cleared" style="font-size:12px;color:var(--text-muted);font-weight:600">クリアしました</span>
      </div>
      <div style="font-weight:700;font-size:15px;margin-bottom:8px;color:var(--new-text)">新設（届出必須）</div>
      <div style="overflow-x:auto;margin-bottom:24px">
      <table class="fee-table" style="min-width:1000px"><thead><tr><th>加算名</th><th style="width:130px">実績要件</th><th style="width:110px">今回（R8）</th><th style="width:130px">判断期間</th><th style="width:110px">適用期間</th><th style="width:90px">様式</th><th style="width:140px">届出期間</th><th style="width:60px"></th></tr></thead><tbody>
        <tr v-for="item in todokeItemsShinsetsu" :key="item.key">
          <td style="font-weight:600">{{item.label}}</td>
          <td style="font-size:11px;color:var(--text-muted)"><button v-if="item.judgeId&&goToJudge" class="btn" style="font-size:10px;padding:2px 8px;color:white;background:var(--teal);white-space:nowrap" @click="goToJudge(item.judgeId)">判定ページ</button><span v-else>{{item.jisseki}}</span></td>
          <td><select class="fee-select" style="font-size:12px;min-width:90px" v-model="todokeChecks[item.key+'_r8']" @change="saveTodokeChecks"><option v-for="o in item.r8options" :key="o.v" :value="o.v">{{o.l}}</option></select></td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.handan}}</td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.tekiyou}}</td>
          <td>{{item.youshiki}}</td>
          <td style="font-size:11px">{{item.kikan}}</td>
          <td><template v-if="todokeTaskDefs[item.key]&&todokeTaskDefs[item.key].categories"><div style="display:flex;gap:3px"><template v-for="(cat, ci) in todokeTaskDefs[item.key].categories" :key="ci"><button class="btn" style="font-size:9px;padding:2px 6px;white-space:nowrap" :style="todokeItemTaskAdded[item.key+'_'+ci]?'background:#ccc;color:white':'background:#e91e63;color:white'" @click="openTodokeTaskModal(item,ci)" :disabled="todokeItemTaskAdded[item.key+'_'+ci]">{{todokeItemTaskAdded[item.key+'_'+ci]?'済':cat.name}}</button></template></div></template></td>
        </tr>
      </tbody></table>
      </div>
      <div style="font-weight:700;font-size:15px;margin-bottom:8px;color:var(--mod-text)">改定（変更なければ届出不要）</div>
      <div style="overflow-x:auto;margin-bottom:24px">
      <table class="fee-table" style="min-width:1100px"><thead><tr><th>加算名</th><th style="width:130px">実績要件</th><th style="width:80px">前回（R7）</th><th style="width:110px">今回（R8）</th><th style="width:130px">判断期間</th><th style="width:110px">適用期間</th><th style="width:90px">様式</th><th style="width:140px">届出期間</th><th style="width:60px"></th></tr></thead><tbody>
        <tr v-for="item in todokeItemsKaitei" :key="item.key">
          <td style="font-weight:600">{{item.label}}</td>
          <td style="font-size:11px;color:var(--text-muted)"><button v-if="item.judgeId&&goToJudge" class="btn" style="font-size:10px;padding:2px 8px;color:white;background:var(--teal);white-space:nowrap" @click="goToJudge(item.judgeId)">判定ページ</button><span v-else>{{item.jisseki}}</span></td>
          <td :style="{color:r7Status(item).color,fontWeight:600}">{{r7Status(item).text}}</td>
          <td><select class="fee-select" style="font-size:12px;min-width:90px" v-model="todokeChecks[item.key+'_r8']" @change="saveTodokeChecks"><option v-for="o in item.r8options" :key="o.v" :value="o.v">{{o.l}}</option></select></td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.handan}}</td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.tekiyou}}</td>
          <td>{{item.youshiki}}</td>
          <td style="font-size:11px">{{item.kikan}}</td>
          <td><template v-if="todokeTaskDefs[item.key]&&todokeTaskDefs[item.key].categories"><div style="display:flex;gap:3px"><template v-for="(cat, ci) in todokeTaskDefs[item.key].categories" :key="ci"><button class="btn" style="font-size:9px;padding:2px 6px;white-space:nowrap" :style="todokeItemTaskAdded[item.key+'_'+ci]?'background:#ccc;color:white':'background:#e91e63;color:white'" @click="openTodokeTaskModal(item,ci)" :disabled="todokeItemTaskAdded[item.key+'_'+ci]">{{todokeItemTaskAdded[item.key+'_'+ci]?'済':cat.name}}</button></template></div></template></td>
        </tr>
      </tbody></table>
      </div>
      <div style="font-weight:700;font-size:15px;margin-bottom:8px;color:var(--neg)">減算（新設）</div>
      <div style="overflow-x:auto;margin-bottom:24px">
      <table class="fee-table" style="min-width:1000px"><thead><tr><th>加算名</th><th style="width:130px">実績要件</th><th style="width:110px">今回（R8）</th><th style="width:130px">判断期間</th><th style="width:110px">適用期間</th><th style="width:90px">様式</th><th style="width:140px">届出期間</th><th style="width:60px"></th></tr></thead><tbody>
        <tr v-for="item in todokeItemsGensan" :key="item.key">
          <td style="font-weight:600">{{item.label}}</td>
          <td style="font-size:11px;color:var(--text-muted)"><button v-if="item.judgeId&&goToJudge" class="btn" style="font-size:10px;padding:2px 8px;color:white;background:var(--teal);white-space:nowrap" @click="goToJudge(item.judgeId)">判定ページ</button><span v-else>{{item.jisseki}}</span></td>
          <td><select class="fee-select" style="font-size:12px;min-width:90px" v-model="todokeChecks[item.key+'_r8']" @change="saveTodokeChecks"><option v-for="o in item.r8options" :key="o.v" :value="o.v">{{o.l}}</option></select></td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.handan}}</td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.tekiyou}}</td>
          <td>{{item.youshiki}}</td>
          <td style="font-size:11px">{{item.kikan}}</td>
          <td><template v-if="todokeTaskDefs[item.key]&&todokeTaskDefs[item.key].categories"><div style="display:flex;gap:3px"><template v-for="(cat, ci) in todokeTaskDefs[item.key].categories" :key="ci"><button class="btn" style="font-size:9px;padding:2px 6px;white-space:nowrap" :style="todokeItemTaskAdded[item.key+'_'+ci]?'background:#ccc;color:white':'background:#e91e63;color:white'" @click="openTodokeTaskModal(item,ci)" :disabled="todokeItemTaskAdded[item.key+'_'+ci]">{{todokeItemTaskAdded[item.key+'_'+ci]?'済':cat.name}}</button></template></div></template></td>
        </tr>
      </tbody></table>
      </div>
      </template>

      <!-- その他カテゴリ: 通常の1テーブル -->
      <template v-else>
      <div style="overflow-x:auto">
      <table class="fee-table" style="min-width:1100px"><thead><tr><th>加算名</th><th style="width:130px">実績要件</th><th style="width:80px">前回（R7）</th><th style="width:110px">今回（R8）</th><th style="width:130px">判断期間</th><th style="width:110px">適用期間</th><th style="width:90px">様式</th><th style="width:140px">届出期間</th></tr></thead><tbody>
        <tr v-for="item in todokeItems" :key="item.key">
          <td style="font-weight:600">{{item.label}}</td>
          <td style="font-size:11px;color:var(--text-muted)"><button v-if="item.judgeId&&goToJudge" class="btn" style="font-size:10px;padding:2px 8px;color:white;background:var(--teal);white-space:nowrap" @click="goToJudge(item.judgeId)">判定ページ</button><span v-else>{{item.jisseki}}</span></td>
          <td :style="{color:r7Status(item).color,fontWeight:600}">{{r7Status(item).text}}</td>
          <td><select class="fee-select" style="font-size:12px;min-width:90px" v-model="todokeChecks[item.key+'_r8']" @change="saveTodokeChecks"><option v-for="o in item.r8options" :key="o.v" :value="o.v">{{o.l}}</option></select></td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.handan}}</td>
          <td style="font-size:11px;color:var(--text-muted)">{{item.tekiyou}}</td>
          <td>{{item.youshiki}}</td>
          <td style="font-size:11px">{{item.kikan}}</td>
        </tr>
      </tbody></table>
      </div>
      </template>

      <template v-if="todokeCategory==='r8'">
      <div style="font-weight:700;font-size:14px;margin-top:24px;margin-bottom:8px;color:var(--amber)">定例報告 <span style="font-size:11px;font-weight:400;color:var(--text-muted)">{{todokeProgress('houkoku')}}</span></div>
      <table class="fee-table" style="margin-bottom:24px"><thead><tr><th style="width:32px"></th><th>報告内容</th><th style="width:160px">報告期間</th></tr></thead><tbody>
        <tr :class="{done:todokeChecks.houkoku_1}"><td><input type="checkbox" v-model="todokeChecks.houkoku_1" @change="saveTodokeChecks"></td><td>妥結率・後発品使用率の定例報告</td><td>毎年8月</td></tr>
        <tr :class="{done:todokeChecks.houkoku_2}"><td><input type="checkbox" v-model="todokeChecks.houkoku_2" @change="saveTodokeChecks"></td><td>未妥結減算に係る報告</td><td>毎年11月末まで</td></tr>
      </tbody></table>

      <div style="font-weight:700;font-size:14px;margin-bottom:8px;color:var(--teal)">経過措置の期限管理 <span style="font-size:11px;font-weight:400;color:var(--text-muted)">{{todokeProgress('keika')}}</span></div>
      <table class="fee-table" style="margin-bottom:24px"><thead><tr><th style="width:32px"></th><th>項目</th><th style="width:160px">経過措置期間</th></tr></thead><tbody>
        <tr :class="{done:todokeChecks.keika_1}"><td><input type="checkbox" v-model="todokeChecks.keika_1" @change="saveTodokeChecks"></td><td>かかりつけ薬剤師の経過措置終了への対応</td><td>R8.6.1〜R8.11.30</td></tr>
        <tr :class="{done:todokeChecks.keika_2}"><td><input type="checkbox" v-model="todokeChecks.keika_2" @change="saveTodokeChecks"></td><td>後発品旧加算の経過措置終了→新体系届出</td><td>R8.6.1〜R9.5.31</td></tr>
        <tr :class="{done:todokeChecks.keika_3}"><td><input type="checkbox" v-model="todokeChecks.keika_3" @change="saveTodokeChecks"></td><td>地域支援体制加算の経過措置終了→新体系届出</td><td>R8.6.1〜R9.5.31</td></tr>
      </tbody></table>

      <div style="font-weight:700;font-size:14px;margin-bottom:8px">免許・許可 <span style="font-size:11px;font-weight:400;color:var(--text-muted)">{{todokeProgress('menkyo')}}</span></div>
      <table class="fee-table"><thead><tr><th style="width:32px"></th><th>免許・許可</th><th>関連加算</th><th style="width:100px">状態</th></tr></thead><tbody>
        <tr :class="{done:todokeChecks.menkyo_1}"><td><input type="checkbox" v-model="todokeChecks.menkyo_1" @change="saveTodokeChecks"></td><td>麻薬小売業者の免許</td><td>在宅薬学総合体制加算</td><td>常時保持</td></tr>
        <tr :class="{done:todokeChecks.menkyo_2}"><td><input type="checkbox" v-model="todokeChecks.menkyo_2" @change="saveTodokeChecks"></td><td>高度管理医療機器の販売業許可</td><td>在宅薬学総合体制加算2</td><td>常時保持</td></tr>
      </tbody></table>

      </template>

      <!-- タスク判定モーダル -->
      <div v-if="todokeTaskModal&&todokeTaskDefs[todokeTaskModal.key]&&todokeTaskDefs[todokeTaskModal.key].categories[todokeTaskModalCatIdx]" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="closeTodokeTaskModal()">
        <div style="background:white;border-radius:12px;padding:24px;max-width:520px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
          <div style="font-weight:700;font-size:17px;margin-bottom:4px">{{todokeTaskModal.label}}</div>
          <div style="font-size:13px;color:var(--teal);font-weight:600;margin-bottom:12px">{{todokeTaskDefs[todokeTaskModal.key].categories[todokeTaskModalCatIdx].name}}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">未整備の項目にチェックを入れてタスク登録してください</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px">
            <label v-for="(task, ti) in todokeTaskDefs[todokeTaskModal.key].categories[todokeTaskModalCatIdx].tasks" :key="ti" style="display:flex;align-items:center;gap:8px;font-size:14px;line-height:1.6;cursor:pointer">
              <input type="checkbox" v-model="todokeTaskSelections[todokeTaskModal.key][todokeTaskDefs[todokeTaskModal.key].categories.slice(0,todokeTaskModalCatIdx).reduce((s,c)=>s+c.tasks.length,0)+ti]" style="margin:0;width:18px;height:18px">
              <span>{{task}}</span>
            </label>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn" style="padding:8px 20px" @click="closeTodokeTaskModal()">キャンセル</button>
            <button class="btn" style="background:#e91e63;color:white;font-weight:600;padding:8px 20px" @click="registerTodokeTask()">タスク登録</button>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ Flow View ═══ -->
    <div v-if="viewMode==='flow'" class="section">
      <div class="section-title">令和8年度 改定対応フロー</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">チェック状態はブラウザに保存されます</div>
      <div class="flow-timeline">
        <div class="flow-phase">
          <div class="flow-phase-header" style="border-color:var(--text-muted)">
            <span class="flow-phase-period">2026年2月</span>
            <span class="flow-phase-title">事前準備</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">{{phaseProgress('phase0')}}</span>
          </div>
          <div class="flow-steps">
            <label class="flow-check" :class="{done:flowChecks.phase0_1}"><input type="checkbox" v-model="flowChecks.phase0_1" @change="saveFlowChecks">短冊（個別改定項目）の確認（12月〜1月公表）</label>
            <label class="flow-check" :class="{done:flowChecks.phase0_6}"><input type="checkbox" v-model="flowChecks.phase0_6" @change="saveFlowChecks">中医協答申・改定骨子の確認（1月末〜2月）</label>

            <label class="flow-check" :class="{done:flowChecks.phase0_4}"><input type="checkbox" v-model="flowChecks.phase0_4" @change="saveFlowChecks">レセコンベンダーとの改定対応スケジュール確認</label>
          </div>
        </div>
        <div class="flow-arrow">▼</div>
        <div class="flow-phase">
          <div class="flow-phase-header" style="border-color:var(--teal)">
            <span class="flow-phase-period">2026年3月〜4月</span>
            <span class="flow-phase-title">情報収集・準備</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">{{phaseProgress('phase1')}}</span>
          </div>
          <div class="flow-steps">
            <label class="flow-check" :class="{done:flowChecks.phase1_1}"><input type="checkbox" v-model="flowChecks.phase1_1" @change="saveFlowChecks">告示・通知の確認（3/5発出）</label>
            <label class="flow-check" :class="{done:flowChecks.phase1_2}"><input type="checkbox" v-model="flowChecks.phase1_2" @change="saveFlowChecks">疑義解釈の確認（その1: 3/23、その2: 3/31）</label>
            <label class="flow-check" :class="{done:flowChecks.phase1_4}"><input type="checkbox" v-model="flowChecks.phase1_4" @change="saveFlowChecks">薬価マスター更新（4/1施行）</label>

            <label class="flow-check" :class="{done:flowChecks.phase1_3}"><input type="checkbox" v-model="flowChecks.phase1_3" @change="saveFlowChecks">届出様式のダウンロード（4月中旬に厚生局HPに掲載）</label>
          </div>
        </div>
        <div class="flow-arrow">▼</div>
        <div class="flow-phase">
          <div class="flow-phase-header" style="border-color:var(--purple)">
            <span class="flow-phase-period">2026年5月</span>
            <span class="flow-phase-title">届出・実績集計</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">{{phaseProgress('phase2')}}</span>
          </div>
          <div class="flow-steps">
            <label class="flow-check" :class="{done:flowChecks.phase2_1}"><input type="checkbox" v-model="flowChecks.phase2_1" @change="saveFlowChecks">前年5月〜当年4月の実績集計（調剤基本料・体制加算の区分判定）</label>
            <label class="flow-check" :class="{done:flowChecks.phase2_2}"><input type="checkbox" v-model="flowChecks.phase2_2" @change="saveFlowChecks">処方箋集中率の再計算（医療モール新方式対応）</label>
            <label class="flow-check" :class="{done:flowChecks.phase2_3}"><input type="checkbox" v-model="flowChecks.phase2_3" @change="saveFlowChecks">届出書類の作成・提出（5/7受付開始 → 5/18推奨 → 6/1必着）</label>
            <label class="flow-check sub" :class="{done:flowChecks.phase2_3a}"><input type="checkbox" v-model="flowChecks.phase2_3a" @change="saveFlowChecks">調剤基本料（様式84・85）</label>
            <label class="flow-check sub" :class="{done:flowChecks.phase2_3b}"><input type="checkbox" v-model="flowChecks.phase2_3b" @change="saveFlowChecks">地域支援・医薬品供給対応体制加算（様式87の3）</label>
            <label class="flow-check sub" :class="{done:flowChecks.phase2_3c}"><input type="checkbox" v-model="flowChecks.phase2_3c" @change="saveFlowChecks">調剤ベースアップ評価料（様式103、メール提出）</label>
            <label class="flow-check sub" :class="{done:flowChecks.phase2_3d}"><input type="checkbox" v-model="flowChecks.phase2_3d" @change="saveFlowChecks">在宅薬学総合体制加算2（様式87の3の5、再届出）</label>
            <label class="flow-check sub" :class="{done:flowChecks.phase2_3e}"><input type="checkbox" v-model="flowChecks.phase2_3e" @change="saveFlowChecks">その他新設加算（バイオ後続品、服薬管理指導料注1）</label>
          </div>
        </div>
        <div class="flow-arrow">▼</div>
        <div class="flow-phase">
          <div class="flow-phase-header" style="border-color:var(--amber)">
            <span class="flow-phase-period">2026年6月1日〜</span>
            <span class="flow-phase-title">施行・運用開始</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">{{phaseProgress('phase3')}}</span>
          </div>
          <div class="flow-steps">
            <label class="flow-check" :class="{done:flowChecks.phase3_1}"><input type="checkbox" v-model="flowChecks.phase3_1" @change="saveFlowChecks">レセコン算定ロジックの最終確認・テスト</label>
            <label class="flow-check" :class="{done:flowChecks.phase3_2}"><input type="checkbox" v-model="flowChecks.phase3_2" @change="saveFlowChecks">院内掲示物・ウェブサイトの更新</label>
            <label class="flow-check" :class="{done:flowChecks.phase3_3}"><input type="checkbox" v-model="flowChecks.phase3_3" @change="saveFlowChecks">算定フロー変更の周知（調剤管理料、かかりつけ薬剤師）</label>
            <label class="flow-check" :class="{done:flowChecks.phase3_4}"><input type="checkbox" v-model="flowChecks.phase3_4" @change="saveFlowChecks">長期収載品の選定療養（患者負担額変更）対応</label>
            <label class="flow-check" :class="{done:flowChecks.phase3_5}"><input type="checkbox" v-model="flowChecks.phase3_5" @change="saveFlowChecks">新制度での算定開始</label>
          </div>
        </div>
        <div class="flow-arrow">▼</div>
        <div class="flow-phase">
          <div class="flow-phase-header" style="border-color:var(--text-muted)">
            <span class="flow-phase-period">2026年7月〜</span>
            <span class="flow-phase-title">継続管理</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto">{{phaseProgress('phase4')}}</span>
          </div>
          <div class="flow-steps">
            <label class="flow-check" :class="{done:flowChecks.phase4_1}"><input type="checkbox" v-model="flowChecks.phase4_1" @change="saveFlowChecks">月次実績集計・モニタリング</label>
            <label class="flow-check" :class="{done:flowChecks.phase4_2}"><input type="checkbox" v-model="flowChecks.phase4_2" @change="saveFlowChecks">経過措置の期限管理（かかりつけ: 11/30、後発品旧加算: R9.5.31）</label>
            <label class="flow-check" :class="{done:flowChecks.phase4_3}"><input type="checkbox" v-model="flowChecks.phase4_3" @change="saveFlowChecks">追加の疑義解釈・訂正通知の確認</label>
            <label class="flow-check" :class="{done:flowChecks.phase4_4}"><input type="checkbox" v-model="flowChecks.phase4_4" @change="saveFlowChecks">定例報告（未妥結減算: 11月末）</label>
          </div>
        </div>
      </div>
    </div>

    </template>
  </div>`
}

const TodoTab = {
  setup() {
    const STORAGE_KEY = 'houshu-todo'
    const items = ref([])

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { try { items.value = JSON.parse(saved) } catch{} }

    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value)) }

    // Add
    const newText = ref('')
    function addItem() {
      if (!newText.value.trim()) return
      items.value.unshift({ id: Date.now(), text: newText.value.trim(), done: false })
      newText.value = ''
      save()
    }

    // Toggle
    function toggleItem(id) {
      const item = items.value.find(i => i.id === id)
      if (item) { item.done = !item.done; save() }
    }

    // Delete
    function deleteItem(id) {
      items.value = items.value.filter(i => i.id !== id)
      save()
    }

    // Clear completed
    function clearCompleted() {
      items.value = items.value.filter(i => !i.done)
      save()
    }

    // Inline edit (double click)
    const editingId = ref(null)
    const editText = ref('')
    function startEdit(item) {
      editingId.value = item.id
      editText.value = item.text
    }
    function saveEdit(item) {
      if (editText.value.trim()) { item.text = editText.value.trim(); save() }
      editingId.value = null
    }
    function cancelEdit() { editingId.value = null }

    // Drag reorder
    const dragIdx = ref(null)
    function onDragStart(e, idx) { dragIdx.value = idx; e.dataTransfer.effectAllowed = 'move' }
    function onDragOver(e) { e.preventDefault() }
    function onDrop(e, targetIdx) {
      e.preventDefault()
      if (dragIdx.value == null || dragIdx.value === targetIdx) return
      const moved = items.value.splice(dragIdx.value, 1)[0]
      items.value.splice(targetIdx, 0, moved)
      dragIdx.value = null
      save()
    }
    function onDragEnd() { dragIdx.value = null }

    const pending = computed(() => items.value.filter(i => !i.done))
    const completed = computed(() => items.value.filter(i => i.done))
    const pendingIndices = computed(() => {
      const map = []
      items.value.forEach((item, idx) => { if (!item.done) map.push(idx) })
      return map
    })

    return { items, newText, addItem, toggleItem, deleteItem, clearCompleted,
             editingId, editText, startEdit, saveEdit, cancelEdit,
             dragIdx, onDragStart, onDragOver, onDrop, onDragEnd,
             pending, completed, pendingIndices }
  },
  template: `<div>
    <div class="section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="section-title" style="margin:0">TO DO</div>
        <span v-if="pending.length" style="font-size:12px;color:var(--text-muted)">{{ pending.length }}件</span>
      </div>
      <div class="todo-input-row">
        <input type="text" class="todo-input" v-model="newText" placeholder="やることを入力して Enter..." @keyup.enter="addItem">
        <button class="todo-add-btn" @click="addItem">追加</button>
      </div>
      <div v-if="!items.length" class="todo-empty">
        <div style="font-size:24px;margin-bottom:8px">&#9745;</div>
        <div>やることを追加しましょう</div>
      </div>
      <div v-else>
        <div v-for="(item, i) in items" :key="item.id" v-show="!item.done">
          <div class="todo-item" :class="{dragging: dragIdx===i}"
               draggable="true" @dragstart="onDragStart($event, i)" @dragover="onDragOver" @drop="onDrop($event, i)" @dragend="onDragEnd">
            <span class="todo-grip">⠿</span>
            <input type="checkbox" class="todo-check" :checked="item.done" @change="toggleItem(item.id)">
            <template v-if="editingId===item.id">
              <input type="text" class="todo-edit-input" v-model="editText" @keyup.enter="saveEdit(item)" @keyup.escape="cancelEdit" @blur="saveEdit(item)" autofocus>
            </template>
            <template v-else>
              <span class="todo-text" @dblclick="startEdit(item)">{{ item.text }}</span>
            </template>
            <button class="todo-del" @click="deleteItem(item.id)">&times;</button>
          </div>
        </div>
        <div v-if="completed.length" class="todo-completed-section">
          <div class="todo-completed-header">
            <span>完了（{{ completed.length }}件）</span>
            <button class="todo-clear-btn" @click="clearCompleted">すべて削除</button>
          </div>
          <div v-for="item in completed" :key="item.id" class="todo-item todo-done">
            <span class="todo-grip" style="visibility:hidden">⠿</span>
            <input type="checkbox" class="todo-check" :checked="item.done" @change="toggleItem(item.id)">
            <span class="todo-text">{{ item.text }}</span>
            <button class="todo-del" @click="deleteItem(item.id)">&times;</button>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

const RequirementsTab = {
  props:['data','r8Data','activeSub','hideNav'],
  emits:['update:activeSub'],
  setup(props, { emit }) {
    const sub = computed({ get:()=>props.activeSub||'k_kihon', set:v=>emit('update:activeSub',v) })
    const subCategory = ref('taisei')
    watch(sub, v => { if (v === 'k_baseup') subCategory.value = 'chinage' })
    const groups = window.REQUIREMENT_DEFINITIONS || []
    function isChecked(id) { return !!props.data.requirements?.[id] }
    function toggle(id) { if (!props.data.requirements) props.data.requirements = {}; props.data.requirements[id] = !props.data.requirements[id] }
    function groupDone(g) { return g.items.filter(i => props.data.requirements?.[i.id]).length }
    function groupPct(g) { return g.items.length ? Math.round(groupDone(g) / g.items.length * 100) : 0 }
    const totalItems = computed(() => groups.reduce((s, g) => s + g.items.length, 0))
    const doneItems = computed(() => groups.reduce((s, g) => s + groupDone(g), 0))
    const pct = computed(() => totalItems.value ? Math.round(doneItems.value / totalItems.value * 100) : 0)
    // 調剤基本料判定（ステップ式）— data.judgeに永続化
    if (!props.data.judge) props.data.judge = {}
    const jd = props.data.judge
    const jStep = ref(jd.step || 1)
    const jResult = ref(jd.result || null)
    // Step 1: 届出・敷地内
    const j1Todokede = ref(jd.todokede || 'yes')
    const j1Shikichi = ref(jd.shikichi || 'no')
    const showShikichiModal = ref(false)
    // Step 2: チェーン薬局・グループ規模
    const j2IsChain = ref(jd.isChain || 'no')
    const j2GroupTotal = ref(jd.groupTotal || 0)
    // Step 3: 受付回数・集中率（年間から月換算）
    const j3RxAnnual = ref(jd.rxAnnual || 0)
    const j3RxMonths = ref(jd.rxMonths || 12)
    const j3RxCount = computed(() => j3RxMonths.value > 0 ? Math.round(j3RxAnnual.value / j3RxMonths.value) : 0)
    const j3Conc = ref(jd.conc || 0)
    const j3Top3Conc = ref(jd.top3Conc || 0)
    const j3SpecificRx = ref(jd.specificRx || 0)
    const j3IsCity = ref(jd.isCity || false)
    // Step 4: 新規開設（減算）
    const j4IsNew = ref(jd.isNew || false)
    // 判定データをdata.judgeに自動保存
    function saveJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        step: jStep.value, result: jResult.value,
        todokede: j1Todokede.value, shikichi: j1Shikichi.value,
        isChain: j2IsChain.value, groupTotal: j2GroupTotal.value,
        rxAnnual: j3RxAnnual.value, rxMonths: j3RxMonths.value, conc: j3Conc.value, top3Conc: j3Top3Conc.value,
        specificRx: j3SpecificRx.value, isCity: j3IsCity.value, isNew: j4IsNew.value,
        applied: jApplied.value
      }
    }
    // watchはjApplied定義後に配置（下部）
    // 実績読込
    const jPeriod = ref('')
    const jMonths = ref(12)
    function jLoadR7() {
      const r6 = props.data.r6 || {}
      const annual = r6.t_rx_count || 0
      const period = props.data.period || ''
      jPeriod.value = period
      const m = period.match(/(\d+)年(\d+)月(\d+)日～.*?(\d+)年(\d+)月(\d+)日/)
      if (m) {
        const d1 = new Date(2000+parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]))
        const d2 = new Date(2000+parseInt(m[4]), parseInt(m[5])-1, parseInt(m[6]))
        const diff = (d2 - d1) / (1000*60*60*24*30.44)
        jMonths.value = Math.max(1, Math.round(diff))
      }
      j3RxAnnual.value = annual
      j3RxMonths.value = jMonths.value
    }
    function jJudge() {
      const grp = j2GroupTotal.value
      const rx = j3RxCount.value
      const conc = j3Conc.value
      const top3 = j3Top3Conc.value
      const specRx = j3SpecificRx.value
      let pts, label, cat, gensan = 0
      if (j1Todokede.value === 'no') {
        pts = 3; label = '特別B（3点）'; cat = '届出なし'
      } else if (j1Shikichi.value === 'yes') {
        pts = 5; label = '特別A（5点）'; cat = '同一敷地内薬局'
      } else if (grp > 400000 && conc <= 85) {
        pts = 37; label = '基本料3ハ（37点）'; cat = '大型チェーン薬局（グループ月40万回超・集中率85%以下）'
      } else if (grp > 400000 && conc > 85) {
        pts = 20; label = '基本料3ロ（20点）'; cat = '大型チェーン薬局（グループ月40万回超・集中率85%超）'
      } else if (grp > 35000 && conc > 85) {
        pts = 25; label = '基本料3イ（25点）'; cat = '大型チェーン薬局（グループ月3.5万回超～40万回・集中率85%超）'
      } else if (j3IsCity.value && rx > 600 && rx <= 1800 && conc > 85) {
        pts = 30; label = '基本料2（30点）'; cat = '都市部で受付600回超1,800回以下かつ集中率85%超'
      } else if (rx > 1800 && conc > 85) {
        pts = 30; label = '基本料2（30点）'; cat = '受付1,800回超かつ集中率85%超'
      } else if (rx > 4000 && top3 > 70) {
        pts = 30; label = '基本料2（30点）'; cat = '受付4,000回超かつ上位3医療機関の集中率合計70%超'
      } else if (specRx > 4000) {
        pts = 30; label = '基本料2（30点）'; cat = '特定医療機関からの受付4,000回超'
      } else {
        pts = 47; label = '基本料1（47点）'; cat = '上記以外（一般薬局）'
      }
      if (j4IsNew.value && pts !== 5 && pts !== 3 && j3IsCity.value && conc > 85) {
        gensan = 15
      }
      jResult.value = { pts, label, cat, gensan }
    }
    const jApplied = ref(jd.applied || false)
    function jApplyToR8() {
      if (!jResult.value) return
      if (props.r8Data) {
        if (!props.r8Data.r6) props.r8Data.r6 = {}
        props.r8Data.r6['k_kihon'] = jResult.value.pts
        jApplied.value = true
        saveJudge()
      }
    }
    function jReset() { jStep.value = 1; jResult.value = null; jApplied.value = false; saveJudge() }
    watch([jStep, jResult, j1Todokede, j1Shikichi, j2IsChain, j2GroupTotal, j3RxAnnual, j3RxMonths, j3Conc, j3Top3Conc, j3SpecificRx, j3IsCity, j4IsNew, jApplied], saveJudge, { deep: true })
    const jError = ref('')
    function jNext() {
      jError.value = ''
      if (jStep.value === 1) {
        if (j1Todokede.value === 'no' || j1Shikichi.value === 'yes') { jStep.value = 5; jJudge(); return }
        jStep.value = 2
      } else if (jStep.value === 2) {
        if (j2IsChain.value === 'yes' && j2GroupTotal.value <= 0) { jError.value = 'グループ全店舗の月合計受付回数を入力してください'; return }
        if (j2IsChain.value === 'no') { j2GroupTotal.value = 0 }
        jStep.value = 3
      } else if (jStep.value === 3) {
        if (j3RxAnnual.value <= 0) { jError.value = '年間処方箋受付回数を入力してください'; return }
        jStep.value = 4
      } else if (jStep.value === 4) {
        jStep.value = 5; jJudge()
      }
    }
    function jBack() { if (jStep.value > 1 && jStep.value < 5) jStep.value-- ; else if (jStep.value === 5 && (j1Todokede.value === 'no' || j1Shikichi.value === 'yes')) jStep.value = 1; else if (jStep.value === 5) jStep.value = 4 }
    // 汎用判定ページ（チェックリスト式）
    // 地域支援・医薬品供給対応体制加算 ステップ式判定
    const cjd = props.data.judge || {}
    const cStep = ref(cjd.c_step || 1)
    const cKihonType = ref(cjd.c_kihonType || 'kihon1')
    const cResult = ref(cjd.c_result || null)
    const cApplied = ref(cjd.c_applied || false)
    const cError = ref('')
    // 経過措置: R7で後発品加算1～3の届出済みか
    const cKeikaSochi = ref(cjd.c_keikaSochi ?? null) // null=未選択, true=該当, false=非該当
    const cGe85actual = ref(cjd.c_ge85actual || false) // 実際に85%以上か（経過措置非該当時に使う）
    // Step 2: 加算1基礎要件
    const cBase = reactive({
      supply: cjd.c_supply || false,
      share: cjd.c_share || false,
      supply_alt: cjd.c_supply_alt || false,
      stock: cjd.c_stock || false,
      tanpin: cjd.c_tanpin || false,
      haibin: cjd.c_haibin || false,
      henpin: cjd.c_henpin || false,
      renkei: cjd.c_renkei || false,
    })
    // ロの充足: 経過措置該当 or 実際に85%以上
    const cRoOk = computed(() => cKeikaSochi.value === true || cGe85actual.value)
    // イ: 医薬品の安定供給体制 (1)～(8) ※PDF原文の通り
    const cBaseChecksA = [
      { key: 'supply', label: '(1) 医薬品の安定供給に向けた計画的な調達や在庫管理を行うこと。',
        help: '<b>必要な対応:</b>\n・発注・在庫管理システムの運用（不動在庫・期限切れの定期チェック）\n・需要予測に基づく適正在庫の維持\n・欠品時の代替品確保手順の整備\n・在庫管理に関する手順書の作成' },
      { key: 'share', highlight: true, label: '(2) 直近1年間に他の保険薬局に医薬品を分譲した実績（同一グループは含めない）があること。',
        help: '<b>別添3 通知の規定（保医発0305第6号）:</b>\n分譲に係る伝票、医療用医薬品の譲渡書又は<b style="color:var(--r6);text-decoration:underline">別紙様式4-1</b>を用いて行い、<b style="color:var(--r6);text-decoration:underline">分譲後2年間保存</b>すること。\n\n<b>必要な対応:</b>\n・<b style="color:var(--r6);text-decoration:underline">近隣の他薬局（自グループ外）への医薬品融通の実績を1回以上確保</b>\n・<b style="color:var(--r6);text-decoration:underline">分譲記録（日付・品名・数量・相手先）を別紙様式4-1等で保存</b>\n・地域の薬局間連携ネットワークへの参加' },
      { key: 'supply_alt', highlight: true, label: '(3) 医薬品供給不安等により、迅速な医薬品入手が困難な場合は、入手可能な保険薬局を探し、在庫を確認の上、患者を紹介や、処方医に処方変更の可否を照会する等適切な対応をすること。',
        help: '<b>別添3 通知の規定（保医発0305第6号）:</b>\n医薬品の供給不安等により、患者が持参した処方箋に記載された医薬品が入手困難な場合に、当該医薬品の在庫を持つ保険薬局を探し、当該保険薬局に予め連絡して在庫を確認した上で、当該患者に当該保険薬局を案内する場合は、<b style="color:var(--r6);text-decoration:underline">別紙様式4-2</b>を用いること。また、患者から別紙様式4-2を受け取った保険薬局は<b style="color:var(--r6);text-decoration:underline">2年間これを保存</b>すること。\n\n<b>必要な対応:</b>\n・<b style="color:var(--r6);text-decoration:underline">別紙様式4-2の準備・印刷（※必ずこの様式を用いること）</b>\n・近隣薬局の在庫確認ルートを整備（電話・FAX・システム）\n・処方医への処方変更照会フローの整備\n・患者への説明と他薬局紹介の体制' },
      { key: 'stock', highlight: true, label: '(4) 重要供給確保医薬品のうち内用薬及び外用薬であるものは１ヶ月程度の備蓄をするよう努めること。',
        help: '<b>必要な対応:</b>\n・厚労省が指定する<b>「重要供給確保医薬品」</b>リストの確認\n・該当する内用薬・外用薬の1ヶ月分の在庫確保\n・備蓄状況の定期的な確認・記録\n\n※努力義務（「努めること」）だが、届出時に体制整備が必要' },
      { key: 'tanpin', highlight: true, label: '(5) 原則として、単品単価交渉の実施をしていること。',
        help: '<b>通知 第92 留意点(2):</b>\n地域差や取引条件等を踏まえ、取引先と<b>個別品目ごと</b>に取引価格を決める交渉。\n\n<b>判定方法:</b>\n直近に提出した<b style="color:var(--r6)">様式85「妥結率等に係る報告書」</b>の3(1)で「単品単価交渉を行っていない」に<b style="color:var(--neg)">非該当</b>であること。\n※様式85を未提出の場合は本要件を満たさない\n※開設1年未満で提出経験がない場合は満たすとみなす\n\n<b style="color:var(--neg)">以下は単品単価交渉に該当しない：</b>\nア 総価値引率を用いた交渉（総価交渉含む）\nイ 全国最低価格をベンチマークとした交渉\nウ 配送コスト等の地域差を考慮しないベンチマーク交渉\nエ 加盟施設ごとの条件を考慮しない一括受託業者の交渉' },
      { key: 'haibin', label: '(6) 卸売販売業者への頻回配送・休日夜間配送・急配に係る過度な依頼を慎むこと。',
        help: '<b>必要な対応:</b>\n・発注の計画性を高め、緊急配送の頻度を減らす\n・配送回数の記録と振り返り\n・卸との配送スケジュールの取り決め\n\n※流通改善ガイドラインに基づく。「過度な」依頼が対象であり、合理的な緊急配送は可' },
      { key: 'henpin', label: '(7) 温度管理を要する医薬品や在庫調整を目的とした卸売販売業者への医薬品の返品は慎むこと。',
        help: '<b>必要な対応:</b>\n・冷所保存品等の返品を原則行わない運用\n・在庫調整目的の返品を抑制\n・返品が必要な場合の正当な理由の記録\n\n※流通改善ガイドラインに基づく' },
      { key: 'renkei', label: '(8) 地域の保険医療機関や保険薬局、医療関係団体と連携し、取り扱う医薬品の品目についての情報共有や、事前の取り決めを行っておくことが望ましい。',
        help: '<b>必要な対応:</b>\n・地域の薬剤師会等が主催する連携会議への参加\n・近隣医療機関との処方品目に関する情報交換\n・地域フォーミュラリーへの参加（あれば）\n・医薬品の採用・切替に関する事前の取り決め\n\n※「望ましい」＝努力義務だが、体制整備の姿勢が求められる' },
    ]
    // モーダル表示用
    const cHelpModal = ref(null) // 表示中の要件key
    function openHelp(key) { cHelpModal.value = key }
    function closeHelp() { cHelpModal.value = null }
    function getHelp(key) { return cBaseChecksA.find(c => c.key === key)?.help || '' }
    // イの全項目 + ロ（経過措置 or 実際に85%以上）で判定
    const cIchiOk = computed(() => Object.values(cBase).every(v => v))
    const cBaseOk = computed(() => cIchiOk.value && cRoOk.value)
    // Step 3: 9指標
    const cInd = reactive({
      i1: cjd.c_i1 || false, i2: cjd.c_i2 || false, i3: cjd.c_i3 || false,
      i4: cjd.c_i4 || false, i5: cjd.c_i5 || false, i6: cjd.c_i6 || false,
      i7: cjd.c_i7 || false, i8: cjd.c_i8 || false, i9: cjd.c_i9 || false,
    })
    // 年間処方箋受付回数（1万枚当たり計算用）
    const cIndRxAnnual = ref(cjd.c_indRxAnnual || 0)
    // 各指標の年間実績回数
    const cIndActual = reactive({
      i1: cjd.c_ia1 || 0, i2: cjd.c_ia2 || 0, i3: cjd.c_ia3 || 0,
      i4: cjd.c_ia4 || 0, i5: cjd.c_ia5 || 0, i6: cjd.c_ia6 || 0,
      i7: cjd.c_ia7 || 0, i8: cjd.c_ia8 || 0, i9: cjd.c_ia9 || 0,
    })
    // 1万枚当たりの回数を計算（⑨は薬局当たりなのでそのまま）
    function cIndPer10k(key) {
      if (key === 'i9') return cIndActual[key]
      if (!cIndRxAnnual.value || cIndRxAnnual.value <= 0) return 0
      return Math.round(cIndActual[key] / cIndRxAnnual.value * 10000 * 10) / 10
    }
    const cIndLabels = [
      { key: 'i1', label: '①夜間・休日等の対応実績', k1: 40, other: 400, k1s: '40回以上', others: '400回以上',
        help: '<b>対象となる加算:</b>\n・時間外加算\n・夜間・休日等加算\n・休日加算\n・深夜加算\n\nこれらの算定回数の合計。開局時間外に調剤を行った実績。' },
      { key: 'i2', label: '②麻薬の調剤実績', k1: 1, other: 10, k1s: '1回以上', others: '10回以上',
        help: '<b>対象:</b>\n・麻薬加算（薬剤調製料の加算）の算定回数\n\n全剤種（内服・外用・注射等）の麻薬加算の合計。麻薬小売業者の免許が前提。' },
      { key: 'i3', label: '③調剤時残薬調整加算及び薬学的有害事象等防止加算の算定実績', k1: 20, other: 40, k1s: '20回以上', others: '40回以上', note2: '※R7実績は「重複投薬・相互作用等防止加算」の算定回数を集計',
        help: '<b>R8での名称変更:</b>\n・旧「重複投薬・相互作用等防止加算」→ R8「残薬調整加算」「有害事象防止加算」に分離\n\n<b>R7実績で集計する項目:</b>\n・重複投薬・相互作用等防止加算（残薬調整）\n・重複投薬・相互作用等防止加算（残薬以外）\n\n処方医への疑義照会により処方変更があった場合に算定。' },
      { key: 'i4', label: '④服薬管理指導料１のイ及び２のイ（かかりつけ薬剤師）の算定実績', k1: 20, other: 40, k1s: '20回以上', others: '40回以上', reqK1: '★加算2必須', reqOther: '★加算4必須', note2: '※R7実績は「かかりつけ薬剤師指導料＋包括管理料」の算定回数を集計',
        help: '<b>R8での名称変更:</b>\n・旧「かかりつけ薬剤師指導料」「かかりつけ薬剤師包括管理料」→ R8「服薬管理指導料1のイ」「服薬管理指導料2のイ」\n\n<b>R7実績で集計する項目:</b>\n・かかりつけ薬剤師指導料の算定回数\n・かかりつけ薬剤師包括管理料の算定回数\n\nかかりつけ薬剤師の同意を得た患者への服薬管理指導の実績。' },
      { key: 'i5', label: '⑤外来服薬支援料１の実績', k1: 1, other: 12, k1s: '1回以上', others: '12回以上',
        help: '<b>対象:</b>\n・外来服薬支援料1の算定回数\n\n自薬局の患者以外も含め、一包化や服薬カレンダーへの整理等、服薬支援を行った実績。処方医の了解を得て実施。' },
      { key: 'i6', label: '⑥単一建物診療患者が１人の在宅薬剤管理の実績', k1: 24, other: 24, k1s: '24回以上', others: '24回以上', reqOther: '★加算4必須',
        help: '<b>対象:</b>\n・在宅患者訪問薬剤管理指導料（単一建物診療患者1人）の算定回数\n\n個人宅への訪問薬剤管理指導の実績。施設ではなく個人宅への訪問が対象。' },
      { key: 'i7', label: '⑦服薬情報等提供料に相当する実績', k1: 30, other: 60, k1s: '30回以上', others: '60回以上',
        help: '<b>対象:</b>\n・服薬情報等提供料1・2・3の算定回数\n\n<b>通知 第92(5)「併算定不可で相当する業務」:</b>\n以下も回数に含められる：\n・特定薬剤管理指導加算2（文書による情報提供に限る）\n・吸入薬指導加算（文書による情報提供に限る）\n・調剤後薬剤管理指導料\n・服用薬剤調整支援料2\n\n<b style="color:var(--neg)">※特別調剤基本料Aの薬局で、注6の保険医療機関への情報提供は除く</b>' },
      { key: 'i8', label: '⑧小児特定加算の算定実績', k1: 1, other: 1, k1s: '1回以上', others: '1回以上',
        help: '<b>対象:</b>\n・小児特定加算の算定回数\n\n6歳未満の乳幼児に対する服薬指導等を行った場合に算定。1回以上あればクリア。' },
      { key: 'i9', label: '⑨薬剤師認定制度認証機構が認証している研修認定制度等の研修認定を取得した保険薬剤師が地域の多職種と連携する会議への出席', k1: 1, other: 5, k1s: '1回以上', others: '5回以上', isPerPharmacy: true, manual: true,
        help: '<b style="color:var(--neg)">※レセコンデータにないため手入力が必要</b>\n\n<b>対象:</b>\n・研修認定薬剤師（CPC認証等）が、地域ケア会議・サービス担当者会議・退院時カンファレンス等の多職種連携会議に出席した回数\n\n<b>注意:</b>\n・処方箋1万枚当たりではなく<b>薬局当たり</b>の年間回数\n・出席記録（日時・会議名・出席者）を保存すること' },
    ]
    // 9指標モーダル
    const c2HelpModal = ref(null)
    function c2OpenHelp(key) { c2HelpModal.value = key }
    function c2CloseHelp() { c2HelpModal.value = null }
    function c2GetHelp(key) { return cIndLabels.find(i => i.key === key)?.help || '' }
    // R7実績から読み込み
    function cIndLoadR7() {
      const r6 = props.data.r6 || {}
      cIndRxAnnual.value = r6.t_rx_sheets || r6.t_rx_count || 0
      // ①夜間・休日等 = 時間外加算+夜間休日等加算+休日加算+深夜加算
      cIndActual.i1 = (r6.t_jikangai_cnt || 0) + (r6.t_yakan_cnt || 0) + (r6.t_kyujitsu_cnt || 0) + (r6.t_shinya_cnt || 0)
      // ②麻薬 = 麻薬加算の合計（全剤種）
      cIndActual.i2 = (r6.t_kaz_nai_mayaku || 0) + (r6.t_kaz_gai_mayaku || 0) + (r6.t_kaz_ton_mayaku || 0) + (r6.t_kaz_chu_mayaku || 0) + (r6.t_kaz_sin_mayaku || 0) + (r6.t_kaz_yu_mayaku || 0) + (r6.t_kaz_col_mayaku || 0) + (r6.t_kaz_mat_mayaku || 0)
      // ③重複投薬・相互作用等防止加算（R7での名称）= 残薬以外 + 残薬
      cIndActual.i3 = (r6.t_jufuku_other_cnt || 0) + (r6.t_jufuku_zan_cnt || 0)
      // ④かかりつけ薬剤師指導料 + 包括管理料
      cIndActual.i4 = (r6.t_kakaritsuke_shido_cnt || r6.k_kakaritsuke_shido_cnt || 0) + (r6.t_kakaritsuke_hokatsu_cnt || 0)
      // ⑤外来服薬支援料1
      cIndActual.i5 = r6.t_gairai_1_cnt || 0
      // ⑥単一建物1人の在宅薬剤管理
      cIndActual.i6 = r6.t_zaitaku_houmon_1_cnt || r6.k_zaitaku_houmon_1_cnt || 0
      // ⑦服薬情報等提供料 = 1+2+3の合計
      cIndActual.i7 = (r6.t_joho_1_cnt || 0) + (r6.t_joho_2_cnt || 0) + (r6.t_joho_3_cnt || 0)
      // ⑧小児特定加算
      cIndActual.i8 = r6.t_shoni_cnt || 0
      // ⑨研修認定薬剤師（レセコンデータにないため0）
      cIndActual.i9 = 0
    }
    function cIndClear() {
      cIndRxAnnual.value = 0
      for (const key of Object.keys(cIndActual)) cIndActual[key] = 0
      for (const key of Object.keys(cInd)) cInd[key] = false
    }
    // 基準値を超えているか自動判定
    function cIndMet(key) {
      const ind = cIndLabels.find(i => i.key === key)
      if (!ind) return false
      const threshold = cKihonType.value === 'kihon1' ? ind.k1 : ind.other
      return cIndPer10k(key) >= threshold
    }
    const cIndCount = computed(() => Object.values(cInd).filter(v => v).length)
    // 加算1の判定結果
    const cBase1Result = computed(() => cBaseOk.value ? { pts: 27, label: '加算1（27点）', ok: true } : { pts: 0, label: '算定なし', ok: false })
    // 加算2～5の判定
    const cAimHigher = ref(cjd.c_aimHigher !== false) // 加算2～5を目指すか
    // 加算2～5 ステップ
    const c2Step = ref(cjd.c2_step || 1)
    // Step 3: 施設基準(2)～(11)チェック
    const c2Facility = reactive({
      f2a: cjd.c2_f2a || false, f2b: cjd.c2_f2b || false, f2c: cjd.c2_f2c || false,
      f2d: cjd.c2_f2d || false, f2e: cjd.c2_f2e || false, f2f: cjd.c2_f2f || false,
      f3a: cjd.c2_f3a || false, f3b: cjd.c2_f3b || false, f3c: cjd.c2_f3c || false, f3d: cjd.c2_f3d || false,
      f4a: cjd.c2_f4a || false, f4b: cjd.c2_f4b || false, f4c: cjd.c2_f4c || false, f4d: cjd.c2_f4d || false,
      f5a: cjd.c2_f5a || false, f5b: cjd.c2_f5b || false, f5c: cjd.c2_f5c || false,
      f6: cjd.c2_f6 || false, f7: cjd.c2_f7 || false, f8: cjd.c2_f8 || false,
      f9: cjd.c2_f9 || false, f10: cjd.c2_f10 || false,
      f11a: cjd.c2_f11a || false, f11b: cjd.c2_f11b || false, f11c: cjd.c2_f11c || false,
      f11d: cjd.c2_f11d || false, f11e: cjd.c2_f11e || false, f11f: cjd.c2_f11f || false, f11g: cjd.c2_f11g || false,
    })
    const c2FacilityChecks = [
      { group: '（２）地域における医薬品等の供給拠点としての対応', items: [
        { key: 'f2a', label: 'ア 十分な数の医薬品の備蓄、周知（医療用医薬品1200品目）', help: '<b>必要な対応:</b>\n・医療用医薬品を<b>1,200品目以上</b>備蓄\n・備蓄品目リストの作成・更新\n・地域の医療機関等へ備蓄品目を周知' },
        { key: 'f2b', label: 'イ 薬局間連携による医薬品の融通等', help: '<b>必要な対応:</b>\n・近隣薬局との医薬品融通ネットワークへの参加\n・融通実績の記録（別紙様式4-1）\n・加算1の(2)と共通' },
        { key: 'f2c', label: 'ウ 医療材料及び衛生材料を供給できる体制', help: '<b>必要な対応:</b>\n・在宅患者向けの医療材料・衛生材料を取り扱える体制\n・注射器、ガーゼ、カテーテル等の供給ルートの確保' },
        { key: 'f2d', label: 'エ 麻薬小売業者の免許', help: '<b>必要な対応:</b>\n・都道府県知事からの<b style="color:var(--r6)">麻薬小売業者免許</b>の取得\n・免許の有効期限の管理\n・麻薬管理者の届出' },
        { key: 'f2e', label: 'オ 取り扱う医薬品に係る情報提供体制', help: '<b>必要な対応:</b>\n・取り扱い医薬品の情報を地域の医療機関等に提供する体制\n・ホームページ等での情報公開' },
        { key: 'f2f', label: 'カ 調剤室の面積が16平方メートル以上（R8.6以降に開設・改築・増築する場合のみ）', isNew: true, help: '<b style="color:var(--r6)">【新規要件】</b>\n・R8年6月以降に<b>新規開設・改築・増築</b>する場合のみ適用\n・既存薬局はR8.5.31以前の状態であれば対象外\n・調剤室の面積が16㎡以上であること' },
      ]},
      { group: '（３）休日、夜間を含む薬局における調剤・相談応需体制', items: [
        { key: 'f3a', label: 'ア 一定時間以上の開局', help: '<b>必要な対応:</b>\n・平日は8時間以上、土曜日は一定時間の開局\n・開局時間の掲示' },
        { key: 'f3b', label: 'イ 休日、夜間の開局時間外の調剤・在宅業務に対応できる体制', help: '<b>必要な対応:</b>\n・開局時間外の連絡先（携帯電話等）を患者に周知\n・輪番制への参加や在宅協力薬局との連携' },
        { key: 'f3c', label: 'ウ 当該薬局を利用する患者からの相談応需体制', help: '<b>必要な対応:</b>\n・患者からの電話相談に対応できる体制\n・相談記録の保存' },
        { key: 'f3d', label: 'エ 夜間・休日の調剤、在宅対応体制（地域の輪番体制含む）の周知', help: '<b>必要な対応:</b>\n・夜間・休日対応について<b>薬局内・外への掲示</b>\n・地域の輪番体制がある場合はその旨の周知\n・ホームページ等での情報公開' },
      ]},
      { group: '（４）在宅医療を行うための関係者との連携体制等の対応', items: [
        { key: 'f4a', label: 'ア 診療所又は病院及び訪問看護ステーションと円滑な連携', help: '<b>必要な対応:</b>\n・近隣の医療機関・訪問看護ステーションとの連絡体制\n・退院時カンファレンス等への参加実績' },
        { key: 'f4b', label: 'イ 保健医療・福祉サービス担当者との連携体制', help: '<b>必要な対応:</b>\n・ケアマネジャー、訪問介護等との連携\n・サービス担当者会議への参加' },
        { key: 'f4c', label: 'ウ 在宅薬剤管理の実績 24回以上', help: '<b>必要な対応:</b>\n・在宅患者訪問薬剤管理指導料の年間算定回数が<b>24回以上</b>\n・介護保険の居宅療養管理指導費も含む\n・<b>薬局当たり</b>の年間の回数' },
        { key: 'f4d', label: 'エ 在宅に係る研修の実施', help: '<b>必要な対応:</b>\n・在宅医療に関する研修の受講・実施\n・認知症、緩和医療、ターミナルケア等に関する研修\n・研修記録の保存' },
      ]},
      { group: '（５）医療安全に関する取組の実施', items: [
        { key: 'f5a', label: 'ア プレアボイド事例の把握・収集', help: '<b>必要な対応:</b>\n・プレアボイド（未然防止・重篤化回避）事例の記録・収集\n・日本薬剤師会のプレアボイド報告への参加が望ましい' },
        { key: 'f5b', label: 'イ 医療安全に資する取組実績の報告', help: '<b>必要な対応:</b>\n・ヒヤリ・ハット事例の収集・報告\n・薬局ヒヤリ・ハット事例収集・分析事業等への参加' },
        { key: 'f5c', label: 'ウ 副作用報告に係る手順書を作成', help: '<b>必要な対応:</b>\n・PMDA（医薬品医療機器総合機構）への<b>副作用報告の手順書</b>を作成\n・手順書に基づく報告体制の整備\n・スタッフへの周知' },
      ]},
      { group: '（６）～（１０）', items: [
        { key: 'f6', label: '（６）かかりつけ薬剤師が服薬管理指導を行う旨の届出', help: '<b>必要な対応:</b>\n・地方厚生局への届出\n・かかりつけ薬剤師の要件を満たす薬剤師が在籍していること' },
        { key: 'f7', label: '（７）患者毎に服薬指導の実施、薬剤服用歴の作成', help: '<b>必要な対応:</b>\n・全患者に対する服薬指導の実施\n・薬剤服用歴（薬歴）の作成・記録・保存' },
        { key: 'f8', label: '（８）管理薬剤師要件（薬局経験５年以上、常勤、当該薬局在籍１年以上）', help: '<b>管理薬剤師の要件:</b>\n・保険薬剤師として<b>5年以上</b>の薬局勤務経験\n・当該薬局に<b>常勤</b>で勤務\n・当該薬局に<b>1年以上</b>在籍' },
        { key: 'f9', label: '（９）研修計画の作成、学会発表などの推奨', help: '<b>必要な対応:</b>\n・年間研修計画の作成\n・薬剤師の学会発表・論文投稿等の推奨\n・研修記録の保存' },
        { key: 'f10', label: '（１０）患者のプライバシーに配慮、椅子に座った状態での服薬指導', help: '<b>必要な対応:</b>\n・パーテーション等によるプライバシー確保\n・<b>椅子に座った状態</b>での服薬指導が可能な環境\n・相談スペースの整備' },
      ]},
      { group: '（１１）地域医療に関連する取組の実施', items: [
        { key: 'f11a', label: 'ア 一般用医薬品及び要指導医薬品等（48薬効群）の販売', help: '<b>必要な対応:</b>\n・基本的な<b>48薬効群</b>の一般用医薬品・要指導医薬品を取り扱い\n・店舗販売業の許可（必要な場合）' },
        { key: 'f11b', label: 'イ 健康相談、生活習慣に係る相談の実施', help: '<b>必要な対応:</b>\n・健康相談・生活習慣に関する相談対応\n・相談実績の記録' },
        { key: 'f11c', label: 'ウ 緊急避妊薬の調剤', labelBlue: '又は販売', labelAfter: 'を含む女性の健康に係る対応', isChanged: true, help: '<b style="color:var(--r6)">【変更】「又は販売」が追加</b>\n・緊急避妊薬（アフターピル）の調剤又はOTC販売に対応\n・女性の健康に関する相談対応体制\n・プライバシーに配慮した対応' },
        { key: 'f11d', label: 'エ 当該保険薬局の敷地内における禁煙の取扱い', help: '<b>必要な対応:</b>\n・薬局敷地内の全面禁煙\n・禁煙の掲示' },
        { key: 'f11e', label: 'オ たばこの販売禁止（併設する店舗販売業含む）', help: '<b>必要な対応:</b>\n・薬局及び併設店舗でのたばこ販売を行わないこと\n・自動販売機の設置もNG' },
        { key: 'f11f', label: 'カ セルフメディケーション関連機器の設置（少なくとも３つ）', isNew: true, help: '<b style="color:var(--r6)">【新規要件】</b>\n<b>以下から少なくとも3つを設置:</b>\n①体重計\n②体温計\n③血圧測定器\n④体組成計（体脂肪率、BMI等）\n⑤血中酸素飽和度測定器（パルスオキシメータ）\n⑥握力計\n⑦骨密度測定器' },
        { key: 'f11g', label: 'キ 薬事未承認の研究用試薬・検査サービスを提供していないこと', isNew: true, help: '<b style="color:var(--r6)">【新規要件】</b>\n・薬事承認されていない研究用試薬や検査キットを患者に提供していないこと\n・遺伝子検査サービス等、薬事未承認の検査サービスを提供していないこと' },
      ]},
    ]
    const c2FacilityOk = computed(() => Object.values(c2Facility).every(v => v))
    const c2FacHelpModal = ref(null)
    function c2FacOpenHelp(key) { c2FacHelpModal.value = key }
    function c2FacCloseHelp() { c2FacHelpModal.value = null }
    function c2FacGetHelp(key) {
      for (const grp of c2FacilityChecks) { const item = grp.items.find(i => i.key === key); if (item) return item.help || '' }
      return ''
    }
    function c2FacGetLabel(key) {
      for (const grp of c2FacilityChecks) { const item = grp.items.find(i => i.key === key); if (item) return item.label }
      return ''
    }
    function c2Next() {
      if (c2Step.value === 1) c2Step.value = 2
      else if (c2Step.value === 2) c2Step.value = 3
      else if (c2Step.value === 3) {
        if (!c2FacilityOk.value) { cResult.value = { pts: 27, label: '加算1（27点）止まり', reason: '施設基準（２）～（１１）に未チェック項目があります。' }; c2Step.value = 4; return }
        cJudgeHigher(); c2Step.value = 4
      }
    }
    function c2Back() { if (c2Step.value > 1) c2Step.value-- }
    function c2Reset() { c2Step.value = 1; cResult.value = null }
    function cJudgeHigher() {
      const cnt = cIndCount.value
      const has4 = cInd.i4, has6 = cInd.i6
      if (cKihonType.value === 'kihon1') {
        if (cnt >= 7) cResult.value = { pts: 67, label: '加算3（67点）', reason: '基本料1＋実績7つ以上' }
        else if (cnt >= 3 && has4) cResult.value = { pts: 59, label: '加算2（59点）', reason: '基本料1＋④含む3つ以上' }
        else cResult.value = { pts: 27, label: '加算1（27点）止まり', reason: '実績要件未達（④含む3つ以上が必要）' }
      } else {
        if (cnt >= 7) cResult.value = { pts: 59, label: '加算5（59点）', reason: '基本料1以外＋実績7つ以上' }
        else if (cnt >= 3 && has4 && has6) cResult.value = { pts: 37, label: '加算4（37点）', reason: '基本料1以外＋④⑥含む3つ以上' }
        else cResult.value = { pts: 27, label: '加算1（27点）止まり', reason: '実績要件未達（④⑥含む3つ以上が必要）' }
      }
    }
    // 加算1: 4ステップ (イ→経過措置→ロ→判定結果)
    function cNext() {
      cError.value = ''
      if (cStep.value === 1) cStep.value = 2
      else if (cStep.value === 2) {
        if (cKeikaSochi.value === null) { cError.value = '経過措置の該当を選択してください'; return }
        if (cKeikaSochi.value === true) cStep.value = 4 // 経過措置適用→ロスキップ
        else cStep.value = 3
      }
      else if (cStep.value === 3) {
        if (!cRoOk.value) { cError.value = '後発品85%未満では加算1は算定できません'; return }
        cStep.value = 4
      }
    }
    function cBack() {
      if (cStep.value === 4 && cKeikaSochi.value === true) cStep.value = 2
      else if (cStep.value > 1) cStep.value--
    }
    function cReset() { cStep.value = 1; cResult.value = null; cApplied.value = false; cKeikaSochi.value = null; cGe85actual.value = false }
    function cApplyToR8() {
      if (!cResult.value) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_chiiki'] = cResult.value.pts; cApplied.value = true }
    }
    function saveCJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        c_step: cStep.value, c_result: cResult.value, c_kihonType: cKihonType.value, c_applied: cApplied.value,
        c_aimHigher: cAimHigher.value,
        c_keikaSochi: cKeikaSochi.value, c_ge85actual: cGe85actual.value,
        c_supply: cBase.supply, c_share: cBase.share, c_supply_alt: cBase.supply_alt, c_stock: cBase.stock,
        c2_step: c2Step.value, c_indRxAnnual: cIndRxAnnual.value,
        c_ia1: cIndActual.i1, c_ia2: cIndActual.i2, c_ia3: cIndActual.i3,
        c_ia4: cIndActual.i4, c_ia5: cIndActual.i5, c_ia6: cIndActual.i6,
        c_ia7: cIndActual.i7, c_ia8: cIndActual.i8, c_ia9: cIndActual.i9,
        c_tanpin: cBase.tanpin, c_haibin: cBase.haibin, c_henpin: cBase.henpin, c_renkei: cBase.renkei,
        c_i1: cInd.i1, c_i2: cInd.i2, c_i3: cInd.i3, c_i4: cInd.i4, c_i5: cInd.i5, c_i6: cInd.i6, c_i7: cInd.i7, c_i8: cInd.i8, c_i9: cInd.i9,
        ...Object.fromEntries(Object.entries(c2Facility).map(([k,v]) => ['c2_'+k, v])),
      }
    }
    watch([cStep, c2Step, cResult, cKihonType, cApplied, cKeikaSochi, cGe85actual, cIndRxAnnual, cBase, cInd, cIndActual, c2Facility], saveCJudge, { deep: true })

    // 連携強化加算 ステップ式
    const rkStep = ref(cjd.rk_step || 1)
    const rkR7 = ref(cjd.rk_r7 ?? null)
    const rkResult = ref(cjd.rk_result || null)
    const rkApplied = ref(cjd.rk_applied || false)
    const rkChecks = reactive({
      kyotei: cjd.rk_kyotei || false,
      hijoji: cjd.rk_hijoji || false,
      ict: cjd.rk_ict || false,
    })
    const rkCheckLabels = [
      { key: 'kyotei', label: '(1) 第二種協定指定医療機関の指定を受けていること', help: '<b>告示 四の二(1)／通知 第92の2(1)</b>\n\n都道府県知事より<b>第二種協定指定医療機関</b>の指定を受け、以下の体制を整備：\n\n<b>ア</b> 感染症に係る研修を<b>年1回以上</b>実施（外部研修への参加でも可）\n<b>イ</b> 新型インフルエンザ等感染症等に係る<b>訓練を年1回以上</b>実施\n<b>ウ</b> 都道府県知事の要請を受け、自宅療養者等への調剤・オンライン服薬指導・薬剤交付（配送含む）の体制\n<b>エ</b> <b>個人防護具の備蓄</b>\n<b>オ</b> OTC医薬品・検査キット・マスク等の衛生材料の提供体制を平時から整備' },
      { key: 'hijoji', label: '(2) 災害の発生時等における非常時対応の体制', help: '<b>告示 四の二(2)／通知 第92の2(2)〜(5)</b>\n\n<b>(2) 災害時の連携体制：</b>\n<b>ア</b> 避難所・救護所等への医薬品供給・人員派遣の体制\n<b>イ</b> 災害対応の研修計画を作成・実施（<b>年1回程度</b>の参加が望ましい）\n<b>ウ</b> 夜間・休日等の開局時間外でも調剤・在宅業務に対応できる体制（近隣薬局との連携含む）\n\n<b>(3) 周知：</b>\n対応可能な体制を自局・グループのほか、<b>行政機関・薬剤師会等のウェブサイト</b>で広く周知\n※厚生局届出サイトへのリンク掲載のみでは不可\n\n<b>(4) 手順書：</b>\n災害・新興感染症発生時の対応手順書を作成し、<b>職員に共有</b>\n\n<b>(5) 災害時モード：</b>\nオンライン資格確認等システムの「緊急時医療情報・資格確認機能（災害時モード）」を平時より活用に努める' },
      { key: 'ict', label: '(3) 情報通信機器を用いた服薬指導を行う体制が整備されていること', help: '<b>告示 四の二(3)／通知 第92の2(6)〜(7)</b>\n\n<b>(6) オンライン服薬指導の体制：</b>\n<b>ア</b> オンライン服薬指導の実施要領に基づく<b>通信環境の確保</b>\n<b>イ</b> 薬局内の保険薬剤師に対する<b>研修の実施</b>\n<b>ウ</b> 「医療情報システムの安全管理に関するガイドライン」及び「薬局におけるサイバーセキュリティ対策チェックリスト」を活用した<b>サイバーセキュリティ対策</b>\n\n<b>(7) OTC医薬品等の販売：</b>\n要指導医薬品及び一般用医薬品を販売していること。感染症発生時に必要な医薬品・検査キットを取り扱うこと。\n※健康増進支援薬局の届出要件の<b>48薬効群</b>を参考に品揃え' },
    ]
    const rkHelpModal = ref(null)
    function rkOpenHelp(key) { rkHelpModal.value = key }
    function rkCloseHelp() { rkHelpModal.value = null }
    function rkGetHelp(key) { return rkCheckLabels.find(c => c.key === key)?.help || '' }
    const rkAllOk = computed(() => Object.values(rkChecks).every(v => v))
    function rkNext() {
      if (rkStep.value === 1) {
        if (rkR7.value === null) return
        if (rkR7.value === true) { for (const k of Object.keys(rkChecks)) rkChecks[k] = true }
        else { for (const k of Object.keys(rkChecks)) rkChecks[k] = false }
        rkStep.value = 2
      }
      else if (rkStep.value === 2) {
        if (rkR7.value === true) {
          rkResult.value = { pts: 5, label: '加算（5点）', reason: '施設基準に変更なし。届出不問、引き続き算定可能。' }
          rkStep.value = 3
        } else {
          rkResult.value = rkAllOk.value ? { pts: 5, label: '加算（5点）', reason: '施設基準を全て満たしています。新規届出が必要。' } : { pts: 0, label: '算定なし', reason: '施設基準に未達の項目があります。' }
          rkStep.value = 3
        }
      }
    }
    function rkBack() { if (rkStep.value > 1) rkStep.value-- }
    function rkReset() { rkStep.value = 1; rkR7.value = null; rkResult.value = null; rkApplied.value = false }
    function rkApplyToR8() {
      if (!rkResult.value) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_renkei'] = rkResult.value.pts; rkApplied.value = true }
    }
    function saveRkJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        rk_step: rkStep.value, rk_r7: rkR7.value, rk_result: rkResult.value, rk_applied: rkApplied.value,
        ...Object.fromEntries(Object.entries(rkChecks).map(([k,v]) => ['rk_'+k, v])),
      }
    }
    watch([rkStep, rkR7, rkResult, rkApplied, rkChecks], saveRkJudge, { deep: true })

    // 電子的調剤情報連携体制整備加算 ステップ式
    const dxStep = ref(cjd.dx_step || 1)
    const dxR7 = ref(cjd.dx_r7 ?? null)
    const dxResult = ref(cjd.dx_result || null)
    const dxApplied = ref(cjd.dx_applied || false)
    const dxChecks = reactive({
      d1: cjd.dx_d1 || false, d2: cjd.dx_d2 || false, d3: cjd.dx_d3 || false,
      d4: cjd.dx_d4 || false, d5: cjd.dx_d5 || false, d6: cjd.dx_d6 || false,
      d7: cjd.dx_d7 || false, d8: cjd.dx_d8 || false, d9: cjd.dx_d9 || false, d10: cjd.dx_d10 || false,
    })
    const dxCheckLabels = [
      { key: 'd1', label: '(1) 電子情報処理組織の使用による請求を行っていること', help: '<b>告示 五の四(1)／通知 第95の2(1)</b>\n\n電子情報処理組織を使用した<b>調剤報酬請求（オンライン請求）</b>を行っていること。' },
      { key: 'd2', label: '(2) 電子資格確認を行う体制を有していること', help: '<b>告示 五の四(2)／通知 第95の2(2)</b>\n\n健康保険法第3条第13項に規定する<b>電子資格確認（オンライン資格確認）</b>を行う体制を有していること。\n\n医療機関等向けポータルサイトにおいて、<b>運用開始日の登録</b>を行うこと。' },
      { key: 'd3', label: '(3) 電子資格確認を利用して取得した診療情報等を閲覧・活用して調剤を行う体制', help: '<b>告示 五の四(3)／通知 第95の2(3)</b>\n\nオンライン資格確認等システムを通じて患者の<b>診療情報・薬剤情報等を取得</b>し、調剤・服薬指導等を行う際に当該情報を<b>閲覧し、活用</b>できる体制を有していること。' },
      { key: 'd4', highlight: true, badge: '変更', label: '(4) 電子処方箋の受付・調剤情報の登録・重複等チェックの体制', help: '<b>告示 五の四(4)／通知 第95の2(4)</b>\n\n<b style="color:var(--r6)">【R7→R8の変更点】</b>\nR7では加算1（10点）のみ重複投薬等チェックが必須だったが、R8では<b>全体で必須</b>に。\n\n<b>具体的な要件：</b>\n・<b>電子処方箋</b>を受け付け、調剤する体制\n・紙の処方箋を含め、原則<b>全ての調剤結果</b>を速やかに電子処方箋管理サービスに登録\n・電子処方箋管理サービスの<b>重複投薬等チェック機能</b>を用いて、有効成分の重複・不適切な組合せの有無を確認できる体制' },
      { key: 'd5', label: '(5) 電子的な調剤録及び薬剤服用歴の管理体制', help: '<b>告示 五の四(5)／通知 第95の2(5)</b>\n\n電磁的記録による<b>調剤録及び薬剤服用歴</b>の管理体制を有していること。\n\n※紙媒体で受け付けた処方箋・情報提供文書等を紙のまま保管することは差し支えない\n※オンライン資格確認、薬歴管理、レセプト請求等の<b>システム間で情報連携</b>されていることが望ましい' },
      { key: 'd6', highlight: true, badge: '新設', label: '(6) 電磁的方法により診療情報を共有・活用する体制', help: '<b>告示 五の四(6)／通知 第95の2(6)</b>\n\n<b style="color:var(--r6)">【R8新設】</b>\n電子カルテ情報共有サービスによる診療情報の共有・活用。R7にはなかった要件。\n\n<b>具体的な要件：</b>\n国等が提供する<b>電子カルテ情報共有サービス</b>により取得される診療情報等を活用する体制。\n\n※当面の間、基準を満たしているものとみなす。ただし全国運用開始時には<b>速やかに導入</b>に努めること。' },
      { key: 'd7', highlight: true, badge: '変更', label: '(7) 電子資格確認に係る十分な実績を有していること', help: '<b>告示 五の四(7)／通知 第95の2(7)(8)</b>\n\n<b style="color:var(--r6)">【R7→R8の変更点】</b>\nR7は加算1=30%、加算2=20%、加算3=10%だったが、R8では一本化で<b>30%</b>に統一。旧加算2・3から移行する場合は利用率の引き上げが必要。\n\n<b>具体的な要件：</b>\n算定する月の<b>3月前</b>のレセプト件数ベース<b>マイナ保険証利用率が30%以上</b>であること。\n（＝同月のマイナ保険証利用者数÷同月の患者数。支払基金から報告される数値）\n\n※3月前に代えて、<b>その前月又は前々月</b>の利用率を用いることも可\n※届出不問（基準を満たしていればよい）' },
      { key: 'd8', label: '(8) 医療DX推進の体制に関する事項を薬局内の見やすい場所に掲示', help: '<b>告示 五の四(8)／通知 第95の2(9)</b>\n\n以下の事項を薬局内の<b>見やすい場所に掲示</b>すること：\n\n<b>(イ)</b> オンライン資格確認等システムを通じて診療情報・薬剤情報等を取得・活用している薬局であること\n<b>(ロ)</b> マイナンバーカードの健康保険証利用を促進する等、<b>医療DXを通じて質の高い医療</b>を提供できるよう取り組んでいること\n<b>(ハ)</b> 電子処方箋や電子カルテ情報共有サービスを活用するなど、<b>医療DXに係る取組</b>を実施していること' },
      { key: 'd9', label: '(9) (8)の掲示事項をウェブサイトに掲載', help: '<b>告示 五の四(9)／通知 第95の2(10)</b>\n\n(8)の掲示事項について、原則として<b>ウェブサイトに掲載</b>していること。\n\n※ホームページ等を有しない保険薬局はこの限りではない。' },
      { key: 'd10', highlight: true, badge: '新設', label: '(10) マイナポータルの医療情報等に基づく健康管理相談に応じる体制', help: '<b>告示 五の四(10)／通知 第95の2(11)(12)</b>\n\n<b style="color:var(--r6)">【R8新設】</b>\nR7にはなかった要件。マイナポータルの医療情報に基づく健康管理相談への対応体制が新たに求められる。\n\n<b>具体的な要件：</b>\nマイナポータルの医療情報等に基づき、患者からの<b>健康管理に係る相談に応じる体制</b>を有していること。\n※届出不問（基準を満たしていればよい）\n\nまた、「医療情報システムの安全管理に関するガイドライン」及び「薬局におけるサイバーセキュリティ対策チェックリスト」を活用した<b>サイバーセキュリティ対策</b>を含めセキュリティ全般について適切な対応を行うこと。' },
    ]
    const dxAllOk = computed(() => Object.values(dxChecks).every(v => v))
    function dxNext() {
      if (dxStep.value === 1) {
        if (dxR7.value === null) return
        if (dxR7.value === true) { const hl = new Set(dxCheckLabels.filter(c => c.highlight).map(c => c.key)); for (const k of Object.keys(dxChecks)) dxChecks[k] = !hl.has(k) }
        else { for (const k of Object.keys(dxChecks)) dxChecks[k] = false }
        dxStep.value = 2
      }
      else if (dxStep.value === 2) {
        dxResult.value = dxAllOk.value ? { pts: 8, label: '加算（8点）', reason: dxR7.value ? '届出済み＋変更要件クリア。届出不問。' : '施設基準を全て満たしています。新規届出が必要。' } : { pts: 0, label: '算定なし', reason: '施設基準に未達の項目があります。' }
        dxStep.value = 3
      }
    }
    function dxBack() { if (dxStep.value > 1) dxStep.value-- }
    function dxReset() { dxStep.value = 1; dxR7.value = null; dxResult.value = null; dxApplied.value = false }
    function dxApplyToR8() {
      if (!dxResult.value) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_dx8'] = dxResult.value.pts; dxApplied.value = true }
    }
    const dxHelpModal = ref(null)
    function dxOpenHelp(key) { dxHelpModal.value = key }
    function dxCloseHelp() { dxHelpModal.value = null }
    function dxGetHelp(key) { return dxCheckLabels.find(c => c.key === key)?.help || '' }
    function saveDxJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        dx_step: dxStep.value, dx_r7: dxR7.value, dx_result: dxResult.value, dx_applied: dxApplied.value,
        ...Object.fromEntries(Object.entries(dxChecks).map(([k,v]) => ['dx_'+k, v])),
      }
    }
    watch([dxStep, dxR7, dxResult, dxApplied, dxChecks], saveDxJudge, { deep: true })

    // バイオ後続品調剤体制加算 ステップ式
    const bioStep = ref(cjd.bio_step || 1)
    const bioResult = ref(cjd.bio_result || null)
    const bioApplied = ref(cjd.bio_applied || false)
    const bioChecks = reactive({
      b1: cjd.bio_b1 || false,
    })
    const bioCheckLabels = [
      { key: 'b1', label: 'バイオ医薬品の適切な保管及び患者への適切な説明を行うことができ、バイオ後続品の調剤を行うにつき必要な体制が整備されていること', help: '<b>告示 五</b>\n\nバイオ医薬品の適切な保管及び患者への適切な説明を行うことができる保険薬局であって、バイオ後続品の調剤を行うにつき必要な体制が整備されているものであること。\n\n<b>通知 第93(1):</b>\nバイオ医薬品（バイオ後続品のあるものに限る）の規格単位数量に占めるバイオ後続品の割合が<b>80%以上</b>となる成分数が、調剤実績のあるバイオ医薬品の成分数の<b>60%以上</b>であること。\n<b style="color:var(--amber)">※「望ましい」＝努力義務</b>\n\n<b>通知 第93(2):</b>\nバイオ後続品の調剤を積極的に行っている旨を、当該保険薬局の<b>内側及び外側</b>の見えやすい場所に掲示すること。' },
    ]
    const bioAllOk = computed(() => Object.values(bioChecks).every(v => v))
    function bioNext() {
      if (bioStep.value === 1) {
        bioResult.value = bioAllOk.value ? { pts: 50, label: '加算（50点）', reason: '施設基準を満たしています。新規届出が必要です（様式87の3の7）。' } : { pts: 0, label: '算定なし', reason: '施設基準に未達の項目があります。' }
        bioStep.value = 2
      }
    }
    function bioReset() { bioStep.value = 1; bioResult.value = null; bioApplied.value = false; for (const k of Object.keys(bioChecks)) bioChecks[k] = false }
    function bioApplyToR8() {
      if (!bioResult.value) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_bio'] = bioResult.value.pts; bioApplied.value = true }
    }
    const bioHelpModal = ref(null)
    function bioOpenHelp(key) { bioHelpModal.value = key }
    function bioCloseHelp() { bioHelpModal.value = null }
    function bioGetHelp(key) { return bioCheckLabels.find(c => c.key === key)?.help || '' }
    function saveBioJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        bio_step: bioStep.value, bio_result: bioResult.value, bio_applied: bioApplied.value,
        ...Object.fromEntries(Object.entries(bioChecks).map(([k,v]) => ['bio_'+k, v])),
      }
    }
    watch([bioStep, bioResult, bioApplied, bioChecks], saveBioJudge, { deep: true })

    // 在宅薬学総合体制加算 ステップ式
    const ztStep = ref(cjd.zt_step || 1)
    const ztR7 = ref(cjd.zt_r7 ?? null)
    const ztResult = ref(cjd.zt_result || null)
    const ztApplied = ref(cjd.zt_applied || false)
    // 加算1 施設基準チェック
    const ztChecks = reactive({
      z1: cjd.zt_z1 || false, z2: cjd.zt_z2 || false, z3: cjd.zt_z3 || false, z4: cjd.zt_z4 || false,
      z5: cjd.zt_z5 || false, z6: cjd.zt_z6 || false, z7: cjd.zt_z7 || false, z8: cjd.zt_z8 || false,
    })
    const ztCheckLabels = [
      { key: 'z1', label: '(1) 在宅患者訪問薬剤管理指導を行う旨の届出', help: '<b>通知 第95(1)</b>\n\n地方厚生（支）局長に対して在宅患者訪問薬剤管理指導を行う旨の届出を行っていること。' },
      { key: 'z2', label: '(2) 訪問薬剤管理指導等の実績 48回以上/年', partialHighlight: '48回', badge: '変更', help: '<b>通知 第95(2)</b>\n\n直近1年間に、在宅患者訪問薬剤管理指導料・緊急訪問・緊急時共同指導料・居宅療養管理指導費等の算定回数の合計が<b>48回以上</b>。\n\n※在宅協力薬局として連携した場合も含む（同一グループ除く）\n※算定上限を超えて業務を行った場合も含む' },
      { key: 'z3', label: '(3) 開局時間外における在宅業務対応（在宅協力薬局との連携含む）', help: '<b>通知 第95(3)</b>\n\n緊急時等の開局時間以外の時間における在宅業務に対応できる体制。\n\n※在宅協力薬局の保険薬剤師と連携して対応する方法も可。' },
      { key: 'z4', label: '(4) 在宅業務実施体制の地域への周知', help: '<b>通知 第95(4)</b>\n\n行政機関・保険医療機関・訪問看護ステーション・福祉関係者等に対し、<b>開局時間外の在宅業務対応体制</b>（麻薬対応含む）を周知。\n\n自局・同一グループでの周知に加え、<b>行政機関又は薬剤師会等を通じて</b>も十分に周知すること。\n\n※実施可能な在宅業務の内容についても周知が望ましい。' },
      { key: 'z5', label: '(5) 在宅業務に関する研修（認知症・緩和医療・ターミナルケア）及び学会等への参加', help: '<b>通知 第95(5)</b>\n\n研修実施計画を作成し、在宅業務に関わる保険薬剤師に対して研修を実施。定期的に外部の学術研修を受けさせること。\n\n<b>望ましい内容：</b>\n・認知症\n・緩和医療\n・意思決定支援（人生の最終段階ガイドライン）\n・研修認定の取得、学会参加・発表、論文投稿等' },
      { key: 'z6', label: '(6) 医療材料及び衛生材料の供給体制', help: '<b>通知 第95(6)</b>\n\n医療材料及び衛生材料を供給できる体制。\n\n保険医療機関から衛生材料の提供を指示された場合は、原則として患者に供給すること。費用は保険医療機関に請求（価格は合議）。' },
      { key: 'z7', label: '(7) 麻薬小売業者の免許', help: '<b>通知 第95(7)</b>\n\n麻薬及び向精神薬取締法第3条の規定による<b>麻薬小売業者の免許</b>を取得し、必要な指導を行うことができること。' },
      { key: 'z8', highlight: true, badge: '新設', label: '(8) 服薬管理指導料の「注1」に規定する服薬管理指導を行う旨の届出', help: '<b>通知 第95(8)</b>\n\n地方厚生（支）局長に対して、服薬管理指導料の「注1」に規定する<b>服薬管理指導</b>を行う旨の届出を行っていること。' },
    ]
    const ztAllOk = computed(() => Object.values(ztChecks).every(v => v))
    function ztNext() {
      if (ztStep.value === 1) {
        if (ztR7.value === null) return
        ztStep.value = 2
      } else if (ztStep.value === 2) {
        ztResult.value = ztAllOk.value
          ? { pts: 30, label: '加算1（30点）', reason: '加算1の施設基準を満たしています。' + (ztR7.value !== 'none' ? '区分変更がなければ届出不問。' : '新規届出が必要（様式87の3の5）。') }
          : { pts: 0, label: '算定なし', reason: '加算1の施設基準に未達の項目があります。' }
        // 加算2チェックの初期化: R7で加算2届出済みなら全ON
        if (ztR7.value === 'zt2') { for (const k of Object.keys(zt2Checks)) zt2Checks[k] = true }
        else { for (const k of Object.keys(zt2Checks)) zt2Checks[k] = false }
        ztStep.value = 3
      }
    }
    function ztBack() { if (ztStep.value > 1) ztStep.value-- }
    function ztReset() { ztStep.value = 1; ztR7.value = null; ztResult.value = null; ztApplied.value = false; for (const k of Object.keys(ztChecks)) ztChecks[k] = false }
    function ztApplyToR8() {
      if (!ztResult.value) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_zaitaku_taisei'] = ztResult.value.pts; ztApplied.value = true }
    }
    // 加算2 判定（2段目）
    const zt2Step = ref(cjd.zt2_step || 1)
    const zt2Result = ref(cjd.zt2_result || null)
    const zt2Checks = reactive({
      z2a: cjd.zt_z2a || false, z2b: cjd.zt_z2b || false, z2c: cjd.zt_z2c || false, z2d: cjd.zt_z2d || false, z2e: cjd.zt_z2e || false,
    })
    const zt2CheckLabels = [
      { key: 'z2a', label: '(1) 加算1の施設基準を全て満たすこと', help: '<b>通知 第95 2(1)</b>\n\n在宅薬学総合体制加算1の基準を全て満たすこと。' },
      { key: 'z2b', highlight: true, badge: '新設', label: '(2) ア又はイのいずれかを満たすこと', help: '<b>通知 第95 2(2)</b>\n\n<b style="color:var(--r6)">【R8新設】</b>\nR7にはなかった要件。加算2イ（個人宅100点）とロ（施設50点）の区分新設に伴い、個人宅の訪問実績が求められる。\n\n※在宅協力薬局として連携した場合も含む',
        table: '<table style="width:100%;font-size:12px;border-collapse:collapse;margin:8px 0"><tr style="background:var(--surface2)"><th style="padding:4px 8px;border:1px solid var(--border)"></th><th style="padding:4px 8px;border:1px solid var(--border)">個人宅の訪問薬剤指導実績</th><th style="padding:4px 8px;border:1px solid var(--border)">訪問薬剤指導の実績のうち、個人宅の占める割合</th></tr><tr><td style="padding:4px 8px;border:1px solid var(--border);text-align:center">ア</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-weight:700">240回以上</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-weight:700">2割以上</td></tr><tr><td style="padding:4px 8px;border:1px solid var(--border);text-align:center">イ</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-weight:700">480回以上</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-weight:700">1割以上</td></tr></table>' },
      { key: 'z2c', badge: '変更', label: '(3) ア、イ又はウの要件への適合', help: '<b>通知 第95 2(3)</b>\n\n<b style="color:var(--r6)">【R7→R8の変更点】</b>\nR7は「麻薬管理指導加算10回以上」のみだったが、R8では「無菌製剤処理1回以上」「小児在宅6回以上」が追加され、いずれかを満たせばよい形に拡大。',
        subItems: [
          { text: 'ア　訪問時の医療用麻薬に関する指導実績10回／年', highlight: true },
          { text: 'イ　無菌製剤処理加算の算定実績1回／年', highlight: true },
          { text: 'ウ　小児在宅患者に対する体制（在宅訪問薬剤管理指導等に係る小児特定加算及び乳幼児加算の算定回数の合計　6回以上／年）' },
        ] },
      { key: 'z2d', highlight: true, badge: '新設', label: '(4) 常勤換算で3名以上の保険薬剤師が勤務しており、開局時間中は原則2名以上の薬剤師が常駐', help: '<b>通知 第95 2(4)</b>\n\n<b style="color:var(--r6)">【R8新設】</b>\nR7にはなかった要件。加算2の薬局には十分な人員体制が求められる。\n\n常勤換算で<b>3名以上</b>の保険薬剤師が勤務。原則として開局時間中は<b>2名以上</b>が常駐し、調剤応需及び在宅患者の急変等に対応可能な体制。' },
      { key: 'z2e', label: '(5) 高度管理医療機器販売業の許可', help: '<b>通知 第95 2(5)</b>\n\n医薬品医療機器等法第39条第1項の規定による<b>高度管理医療機器の販売業の許可</b>を受けていること。' },
    ]
    const zt2AllOk = computed(() => Object.values(zt2Checks).every(v => v))
    function zt2Next() {
      if (zt2Step.value === 1) {
        zt2Result.value = zt2AllOk.value
          ? { pts: 100, label: '加算2（イ100点／ロ50点）', reason: '加算2の施設基準を満たしています。' + (ztR7.value === 'zt2' ? '区分変更がなければ届出不問。' : '届出が必要（様式87の3の5）。') }
          : { pts: 0, label: '加算2は算定不可', reason: '加算2の追加要件に未達の項目があります。加算1（30点）で算定可能です。' }
        zt2Step.value = 2
      }
    }
    function zt2Back() { if (zt2Step.value > 1) zt2Step.value-- }
    function zt2Reset() { zt2Step.value = 1; zt2Result.value = null; for (const k of Object.keys(zt2Checks)) zt2Checks[k] = false }
    function zt2ApplyToR8() {
      if (!zt2Result.value || zt2Result.value.pts === 0) return
      if (props.r8Data) { if (!props.r8Data.r6) props.r8Data.r6 = {}; props.r8Data.r6['k_zaitaku_taisei'] = 'zt2'; ztApplied.value = true }
    }
    const ztHelpModal = ref(null)
    function ztOpenHelp(key) { ztHelpModal.value = key }
    function ztCloseHelp() { ztHelpModal.value = null }
    function ztGetHelp(key) { return [...ztCheckLabels, ...zt2CheckLabels].find(c => c.key === key)?.help || '' }
    function saveZtJudge() {
      props.data.judge = {
        ...(props.data.judge || {}),
        zt_step: ztStep.value, zt_r7: ztR7.value, zt_result: ztResult.value, zt_applied: ztApplied.value,
        zt2_step: zt2Step.value, zt2_result: zt2Result.value,
        ...Object.fromEntries(Object.entries(ztChecks).map(([k,v]) => ['zt_'+k, v])),
        ...Object.fromEntries(Object.entries(zt2Checks).map(([k,v]) => ['zt_'+k, v])),
      }
    }
    watch([ztStep, zt2Step, ztR7, ztResult, zt2Result, ztApplied, ztChecks, zt2Checks], saveZtJudge, { deep: true })

    // ベースアップ評価料の試算（様式104に準拠）
    const buRxCount = ref(props.data.r6?.k_kihon_cnt || 0)
    const buBonusLinked = ref(props.data.baseup?.bonusLinked ?? false)
    const defaultStaff = [{ type: 'pharmacist', age: 0, monthlySalary: 0, bonus: 0 }]
    const buStaff = reactive(props.data.baseup?.staff ? JSON.parse(JSON.stringify(props.data.baseup.staff)) : defaultStaff)
    function buIsTarget(s) { return s.type === 'clerk' || (s.age > 0 && s.age < 40) }
    const buTargetCount = computed(() => buStaff.filter(buIsTarget).length)
    function buRate(s) { return s.type === 'clerk' ? 0.057 : 0.032 }
    // ベア等（様式104 (7)）= 基本給等(月額) × 率 × 12
    function buBearAmount(s) { return Math.ceil(s.monthlySalary * buRate(s)) * 12 }
    // それに伴う増加分（様式104 (9)）= 賞与増 + 法定福利費増
    function buAssociated(s) {
      const r = buRate(s)
      const bonusInc = buBonusLinked.value ? Math.ceil((s.bonus || 0) * r) : 0
      const fukuriInc = Math.ceil((s.monthlySalary * 12 * r + bonusInc) * 0.15)
      return bonusInc + fukuriInc
    }
    // 必要額合計 = ベア等 + それに伴う増加分
    function buPersonTotal(s) { return buBearAmount(s) + buAssociated(s) }
    const buRequiredTotal = computed(() => buStaff.reduce((sum, s) => {
      if (buIsTarget(s) && s.monthlySalary > 0) return sum + buPersonTotal(s)
      return sum
    }, 0))
    const buRequiredWithFukuri = buRequiredTotal
    function buAddStaff() { buStaff.push({ type: 'pharmacist', age: 0, monthlySalary: 0, bonus: 0 }) }
    function buRemoveStaff() { if (buStaff.length > 1) buStaff.pop() }
    const buApplyVal = ref('4')
    const buApplied = ref(false)
    function buApplyToR8() {
      if (props.r8Data) {
        if (!props.r8Data.r6) props.r8Data.r6 = {}
        props.r8Data.r6.k_baseup = Number(buApplyVal.value)
        // 賃上げ充当分（控除）: 必要賃上げ額をマイナスで反映
        props.r8Data.r6.k_baseup_chinage_amt = -(buRequiredTotal.value)
        buApplied.value = true
      }
    }
    watch([buRxCount, buStaff, buBonusLinked], () => {
      if (!props.data.baseup) props.data.baseup = {}
      props.data.baseup.staff = JSON.parse(JSON.stringify(buStaff))
      props.data.baseup.bonusLinked = buBonusLinked.value
    }, { deep: true })

    const JUDGE_PAGES = {
      k_renkei: null, // 専用ステップ式に移行
      k_dx8: null, // 専用ステップ式に移行
      k_zaitaku_taisei: null, // 専用ステップ式に移行
      k_bio: null, // 専用ステップ式に移行
    }
    // 汎用判定のチェック状態
    if (!props.data.judge) props.data.judge = {}
    function jpChecked(pageId, checkId) { return !!props.data.judge?.[pageId + '_' + checkId] }
    function jpToggle(pageId, checkId) {
      if (!props.data.judge) props.data.judge = {}
      props.data.judge[pageId + '_' + checkId] = !props.data.judge[pageId + '_' + checkId]
    }
    function jpSelectedOption(pageId) { return props.data.judge?.[pageId + '_selected'] ?? null }
    function jpSelectOption(pageId, val) {
      if (!props.data.judge) props.data.judge = {}
      props.data.judge[pageId + '_selected'] = val
    }
    function jpApply(pageId) {
      const val = jpSelectedOption(pageId)
      if (val == null) return
      if (props.r8Data) {
        if (!props.r8Data.r6) props.r8Data.r6 = {}
        props.r8Data.r6[pageId] = Number(val)
        props.data.judge[pageId + '_applied'] = true
      }
    }
    function jpApplied(pageId) { return !!props.data.judge?.[pageId + '_applied'] }
    const judgePageIds = Object.keys(JUDGE_PAGES).filter(k => JUDGE_PAGES[k] !== null)

    // 服薬管理指導料の注1 施設基準判定
    const FJ_KEY = 'houshu-fukuyaku-judge'
    const fukuyakuJudge = reactive(JSON.parse(localStorage.getItem(FJ_KEY) || '{}'))
    function saveFukuyakuJudge() { localStorage.setItem(FJ_KEY, JSON.stringify(fukuyakuJudge)) }
    function fjNext() {
      if ((fukuyakuJudge.step || 1) === 1) {
        const allOk = fukuyakuJudge.k1 && fukuyakuJudge.k2 && fukuyakuJudge.k3
        fukuyakuJudge.result = allOk
          ? { pts: 1, label: '1イ・2イ 算定可', reason: '施設基準を満たしています。様式90で届出してください。' }
          : { pts: 0, label: '1イ・2イ 算定不可', reason: '施設基準に未達の項目があります。1ロ・2ロで算定してください。' }
        fukuyakuJudge.step = 2
        saveFukuyakuJudge()
      }
    }
    function fjReset() { fukuyakuJudge.step = 1; fukuyakuJudge.result = null; fukuyakuJudge.applied = false; fukuyakuJudge.k1 = false; fukuyakuJudge.k2 = false; fukuyakuJudge.k3 = false; saveFukuyakuJudge() }
    function fjApplyToR8() {
      if (!fukuyakuJudge.result || !props.r8Data) return
      if (!props.r8Data.r6) props.r8Data.r6 = {}
      if (fukuyakuJudge.result.pts > 0) {
        props.r8Data.r6['t_fukuyaku_a_i'] = 45
        props.r8Data.r6['t_fukuyaku_c_i'] = 59
      } else {
        props.r8Data.r6['t_fukuyaku_a_i'] = 0
        props.r8Data.r6['t_fukuyaku_c_i'] = 0
      }
      fukuyakuJudge.applied = true
      saveFukuyakuJudge()
    }
    watch(fukuyakuJudge, saveFukuyakuJudge, { deep: true })

    return { sub, subCategory, hideNav: props.hideNav, groups, isChecked, toggle, groupDone, groupPct, totalItems, doneItems, pct,
             jStep, jResult, jError, jApplied, j1Todokede, j1Shikichi, showShikichiModal, j2IsChain, j2GroupTotal, j3RxAnnual, j3RxMonths, j3RxCount, j3Conc, j3Top3Conc, j3SpecificRx, j3IsCity, j4IsNew, jJudge, jApplyToR8, jReset, jNext, jBack,
             cStep, c2Step, cKihonType, cKeikaSochi, cGe85actual, cRoOk, cBase, cBaseChecksA, cIchiOk, cBaseOk, cAimHigher, cInd, cIndLabels, cIndCount, cIndRxAnnual, cIndActual, cIndPer10k, cIndMet, cIndLoadR7, cIndClear, c2HelpModal, c2OpenHelp, c2CloseHelp, c2GetHelp, c2Facility, c2FacilityChecks, c2FacilityOk, c2FacHelpModal, c2FacOpenHelp, c2FacCloseHelp, c2FacGetHelp, c2FacGetLabel, cResult, cApplied, cError, cNext, cBack, cReset, c2Next, c2Back, c2Reset, cJudgeHigher, cApplyToR8,
             cHelpModal, openHelp, closeHelp, getHelp,
             rkStep, rkR7, rkResult, rkApplied, rkChecks, rkCheckLabels, rkAllOk, rkNext, rkBack, rkReset, rkApplyToR8, rkHelpModal, rkOpenHelp, rkCloseHelp, rkGetHelp,
             dxStep, dxR7, dxResult, dxApplied, dxChecks, dxCheckLabels, dxAllOk, dxNext, dxBack, dxReset, dxApplyToR8, dxHelpModal, dxOpenHelp, dxCloseHelp, dxGetHelp,
             bioStep, bioResult, bioApplied, bioChecks, bioCheckLabels, bioAllOk, bioNext, bioReset, bioApplyToR8, bioHelpModal, bioOpenHelp, bioCloseHelp, bioGetHelp,
             ztStep, ztR7, ztResult, ztApplied, ztChecks, ztCheckLabels, ztAllOk, ztNext, ztBack, ztReset, ztApplyToR8,
             zt2Step, zt2Result, zt2Checks, zt2CheckLabels, zt2AllOk, zt2Next, zt2Back, zt2Reset, zt2ApplyToR8,
             ztHelpModal, ztOpenHelp, ztCloseHelp, ztGetHelp,
             buRxCount, buBonusLinked, buStaff, buIsTarget, buRate, buBearAmount, buAssociated, buPersonTotal, buTargetCount, buRequiredTotal, buRequiredWithFukuri, buAddStaff, buRemoveStaff, buApplyVal, buApplied, buApplyToR8, formatYen, fmtC: v=>(v||0).toLocaleString(), parseNum,
             JUDGE_PAGES, judgePageIds, jpChecked, jpToggle, jpSelectedOption, jpSelectOption, jpApply, jpApplied,
             fukuyakuJudge, saveFukuyakuJudge, fjNext, fjReset, fjApplyToR8 }
  },
  template: `<div>
    <div v-if="!hideNav" class="sub-tabs-row">
      <button class="sub-tab-item" :class="{active:subCategory==='chinage'}" @click="subCategory='chinage';sub='k_baseup'">賃上げ</button>
      <button class="sub-tab-item" :class="{active:subCategory==='taisei'}" @click="subCategory='taisei';sub='k_kihon'">体制加算</button>
      <button class="sub-tab-item" :class="{active:subCategory==='sonota_kasan'}" @click="subCategory='sonota_kasan';sub='ot_chozai'">薬剤調製料・薬剤料</button>
      <button class="sub-tab-item" :class="{active:subCategory==='yakugaku'}" @click="subCategory='yakugaku';sub='yg_kanri'">薬学管理料</button>
      <button class="sub-tab-item" :class="{active:subCategory==='zaitaku'}" @click="subCategory='zaitaku';sub='yg_zaitaku'">在宅</button>
      <button class="sub-tab-item" :class="{active:subCategory==='memo'}" @click="subCategory='memo';sub='memo'">メモ</button>
    </div>
    <div v-if="subCategory==='chinage'" style="margin-bottom:12px">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
        <button class="btn" :style="sub==='k_baseup'?'background:var(--teal);color:white':''" @click="sub='k_baseup'" style="font-size:12px;padding:6px 12px">調剤ベースアップ評価料</button>
        <button class="btn" :style="sub==='k_bukka'?'background:var(--teal);color:white':''" @click="sub='k_bukka'" style="font-size:12px;padding:6px 12px">調剤物価対応料</button>
      </div>
    </div>
    <div v-if="subCategory==='taisei'" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      <button class="btn" :style="sub==='k_kihon'?'background:var(--teal);color:white':''" @click="sub='k_kihon'" style="font-size:12px;padding:6px 12px">調剤基本料</button>
      <button class="btn" :style="sub==='k_chiiki'?'background:var(--teal);color:white':''" @click="sub='k_chiiki'" style="font-size:12px;padding:6px 12px">地域支援・医薬品供給対応体制</button>
      <button class="btn" :style="sub==='k_renkei'?'background:var(--teal);color:white':''" @click="sub='k_renkei'" style="font-size:12px;padding:6px 12px">連携強化</button>
      <button class="btn" :style="sub==='k_dx8'?'background:var(--teal);color:white':''" @click="sub='k_dx8'" style="font-size:12px;padding:6px 12px">電子的調剤情報連携体制整備</button>
      <button class="btn" :style="sub==='k_zaitaku'?'background:var(--teal);color:white':''" @click="sub='k_zaitaku'" style="font-size:12px;padding:6px 12px">在宅薬学総合体制</button>
      <button class="btn" :style="sub==='k_jikangai'?'background:var(--teal);color:white':''" @click="sub='k_jikangai'" style="font-size:12px;padding:6px 12px">時間外加算</button>
      <button class="btn" :style="sub==='k_yakan'?'background:var(--teal);color:white':''" @click="sub='k_yakan'" style="font-size:12px;padding:6px 12px">夜間・休日等加算</button>
      <button class="btn" :style="sub==='k_bio'?'background:var(--teal);color:white':''" @click="sub='k_bio'" style="font-size:12px;padding:6px 12px">バイオ後続品調剤体制</button>
    </div>
    <div v-if="subCategory==='sonota_kasan'" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      <button class="btn" :style="sub==='ot_chozai'?'background:var(--teal);color:white':''" @click="sub='ot_chozai'" style="font-size:12px;padding:6px 12px">薬剤調製料</button>
      <button class="btn" :style="sub==='ot_mukin'?'background:var(--teal);color:white':''" @click="sub='ot_mukin'" style="font-size:12px;padding:6px 12px">無菌製剤処理加算</button>
      <button class="btn" :style="sub==='ot_mayaku'?'background:var(--teal);color:white':''" @click="sub='ot_mayaku'" style="font-size:12px;padding:6px 12px">麻薬等加算</button>
      <button class="btn" :style="sub==='ot_jika'?'background:var(--teal);color:white':''" @click="sub='ot_jika'" style="font-size:12px;padding:6px 12px">自家製剤・計量混合</button>
      <button class="btn" :style="sub==='ot_yakuzai'?'background:var(--teal);color:white':''" @click="sub='ot_yakuzai'" style="font-size:12px;padding:6px 12px">薬剤料・材料料</button>
    </div>
    <div v-if="sub==='k_kihon'">
      <div class="section">
        <div class="section-title">調剤基本料 <span class="badge badge-modified">改定</span></div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          <div style="margin-bottom:4px"><b>概要：</b>処方箋受付1回につき算定。薬局の規模・集中率等に応じて基本料1〜3、特別A・Bの区分で算定。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき。同時受付の場合、2枚目以降は80/100。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>全ての患者（処方箋を受け付けた場合）</div>
          <div style="margin-bottom:4px"><b>併算定：</b>注4（100分の50）該当薬局は、加算等と合算して3点未満の場合は3点を算定。</div>
          <div style="margin-bottom:4px"><b>届出：</b>必要（処方箋受付回数等の実績は前年5月1日〜当年4月30日で判定）</div>
          <div style="margin-bottom:4px"><b>届出受付期間：</b>令和8年5月7日〜6月1日（必着）</div>
          <div style="margin-bottom:4px"><b>R8変更点：</b>基本料1・3ハ増点、基本料2の対象拡大（都市部）、300店舗区分撤廃、特別A除外規定撤廃、門前薬局等立地依存減算（▲15点）新設。</div>
          <div style="margin-bottom:4px"><b style="color:var(--neg)">報告（妥結率）：</b>毎年4月1日〜9月30日の妥結率の実績を報告。妥結率5割以下の場合は特別調剤基本料Bを算定。</div>
          <div><b style="color:var(--neg)">報告（後発品取組状況）：</b>後発医薬品の使用促進の取組状況を地方厚生局長に報告。未報告の場合は注4（100分の50）が適用。</div>
        </div>
        <img src="img/r8_kihon_chart.png" alt="調剤基本料の見直し（R8改定後）" style="width:100%;border-radius:var(--radius);border:1px solid #e0e0e0">
      </div>
      <div class="section">
        <div class="section-title">判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          <div style="font-weight:600;color:var(--text)">基準期間</div>
          <div>処方箋受付回数・集中率は<strong>前年5月1日～当年4月30日</strong>の1年間の実績で判定します。</div>
          <div>R8（令和8年6月施行）の場合：<strong>令和7年5月1日～令和8年4月30日</strong></div>
          <div>届出受付期間：令和8年5月7日～6月1日（必着）</div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{jStep}} / 5</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(jStep*20)+'%'}"></div></div>

        <div v-if="jStep===1" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：薬局の種別</div>
          <div style="margin-bottom:12px">
            <div style="font-weight:600;margin-bottom:6px">調剤基本料の届出をしていますか？</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="j1Todokede" value="yes">はい（届出している）</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="j1Todokede" value="no">いいえ（届出していない）→ 特別B（3点）</label>
          </div>
          <div v-if="j1Todokede==='yes'" style="margin-bottom:12px">
            <div style="font-weight:600;margin-bottom:6px">同一敷地内薬局ですか？（医療機関と不動産取引等の特別な関係があり、集中率50%超）<button class="btn" style="font-size:11px;padding:2px 8px;margin-left:6px;background:var(--teal);color:white;border-radius:4px;cursor:pointer" @click="showShikichiModal=true">？同一敷地内薬局とは</button></div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="j1Shikichi" value="no">いいえ</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="j1Shikichi" value="yes">はい → 特別A（5点）</label>
          </div>
          <div v-if="showShikichiModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="showShikichiModal=false">
            <div style="background:white;border-radius:12px;padding:24px;max-width:640px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:17px;margin-bottom:16px">同一敷地内薬局（特別調剤基本料A）とは</div>
              <div style="font-size:13px;line-height:1.9;color:var(--text)">
                <div style="font-weight:600;margin-bottom:6px">定義（施設基準）</div>
                <div style="padding:10px 14px;background:var(--surface2);border-radius:8px;margin-bottom:12px">
                  次の<b>いずれか</b>に該当する保険薬局：
                  <ol style="padding-left:20px;margin:6px 0 0">
                    <li style="margin-bottom:4px"><b>イ</b>　医療機関と<b style="color:var(--neg)">不動産取引等その他の特別な関係</b>を有している保険薬局であって、当該医療機関に係る処方箋による調剤の割合が<b style="color:var(--neg)">5割を超える</b>こと。</li>
                    <li><b>ロ</b>　同一敷地内において<b style="color:var(--neg)">オンライン診療受診施設</b>を設置していること。<br><span style="font-size:11px;color:var(--text-muted)">※ただし、無医地区・準無医地区に所在する薬局は除く。</span></li>
                  </ol>
                </div>
                <div style="font-weight:600;margin-bottom:6px">R8改定での変更点</div>
                <ul style="padding-left:18px;margin-bottom:12px">
                  <li style="margin-bottom:4px"><b>同一建物内の診療所の除外規定を削除</b>：従来は同一建物内に診療所がある場合は特別Aの対象外だったが、R8改定でこの除外規定を撤廃。</li>
                  <li style="margin-bottom:4px"><b>オンライン診療受診施設の新設</b>：同一敷地内にオンライン診療の受診施設を設置する場合も特別Aの対象に追加。</li>
                  <li><b>点数の引下げ</b>：32点 → 5点。</li>
                </ul>
                <div style="font-weight:600;margin-bottom:6px">経過措置</div>
                <div style="padding:10px 14px;background:#fff8e1;border-radius:8px;font-size:12px;margin-bottom:12px">
                  R8年3月4日時点で同一建物内に診療所が所在していた薬局については、<b>新たに他の医療機関と特別な関係を有しない</b>かつ<b>当該診療所が所在し続ける</b>場合に限り、<b>当面の間</b>、イに該当しないものとみなす。
                </div>
                <div style="font-size:11px;color:var(--text-muted)">出典：令和8年度診療報酬改定の概要【調剤】p.18、告示第71号（特掲診療料の施設基準等）</div>
              </div>
              <div style="margin-top:16px;text-align:right"><button class="btn" style="background:var(--text);color:white;padding:6px 20px" @click="showShikichiModal=false">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="jStep===2" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：グループ薬局かどうか</div>
          <div style="margin-bottom:12px">
            <div style="font-weight:600;margin-bottom:6px">同一法人・同一経営主体が運営する薬局が他にありますか？</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="j2IsChain" value="no">いいえ（個人経営・自薬局のみ）</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="j2IsChain" value="yes">はい（グループ・チェーンに属する）</label>
          </div>
          <div v-if="j2IsChain==='yes'" style="margin-top:12px">
            <div style="font-weight:600;margin-bottom:6px">グループ全店舗の処方箋受付回数の月合計</div>
            <div style="display:flex;align-items:center;gap:8px"><input type="number" class="fee-input" style="max-width:150px;font-size:16px" v-model.number="j2GroupTotal"> 回/月</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">※グループ本部等にご確認ください</div>
          </div>
        </div>

        <div v-if="jStep===3" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：受付回数・集中率</div>
          <table style="font-size:13px;width:100%;max-width:600px;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;width:260px">年間処方箋受付回数（自薬局）</td><td><input type="number" class="fee-input" style="max-width:120px" v-model.number="j3RxAnnual"> 回</td></tr>
            <tr><td style="padding:8px 0;font-weight:600">集計期間</td><td><input type="number" class="fee-input" style="max-width:60px" v-model.number="j3RxMonths" min="1" max="12"> ヶ月<div style="font-size:11px;color:var(--text-muted)">※基準期間: R7.5.1〜R8.4.30の12ヶ月</div></td></tr>
            <tr><td style="padding:8px 0;font-weight:600">→ 月あたり処方箋受付回数</td><td style="font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:700;color:var(--teal)">{{j3RxCount.toLocaleString()}} 回/月</td></tr>
            <tr><td style="padding:8px 0;font-weight:600">処方箋集中率（特定医療機関）</td><td><input type="number" class="fee-input" style="max-width:80px" step="0.1" v-model.number="j3Conc"> %<div style="font-size:11px;color:var(--text-muted)">※医療モール内は複数医療機関を1つとみなす</div></td></tr>
            <tr v-if="j3RxCount>4000"><td style="padding:8px 0;font-weight:600">上位3医療機関の集中率合計</td><td><input type="number" class="fee-input" style="max-width:80px" step="0.1" v-model.number="j3Top3Conc"> %</td></tr>
            <tr><td style="padding:8px 0;font-weight:600">特定医療機関からの月受付回数</td><td><input type="number" class="fee-input" style="max-width:120px" v-model.number="j3SpecificRx"> 回<div style="font-size:11px;color:var(--text-muted)">※最も多い1医療機関からの回数</div></td></tr>
            <tr><td style="padding:8px 0" colspan="2"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" v-model="j3IsCity" style="width:16px;height:16px"><span style="font-weight:600">都市部に所在</span><span style="color:var(--text-muted)">（特別区・政令指定都市。半径500m以内に他の薬局あり）</span></label></td></tr>
          </table>
        </div>

        <div v-if="jStep===4" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 4：新規開設（減算判定）</div>
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" v-model="j4IsNew" style="width:16px;height:16px"><span style="font-weight:600">令和8年6月1日以降に新規開設した薬局</span></label>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">※既存薬局（R8年5月31日以前に開設）は当面の間、対象外</div>
          </div>
          <div v-if="j4IsNew && j3IsCity && j3Conc>85" style="padding:8px;background:#fee;border-radius:var(--radius);font-size:13px;color:var(--del-text)">→ 門前薬局等立地依存減算（▲15点）の対象になる可能性があります</div>
        </div>

        <div v-if="jStep===5">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 5：判定結果</div>
          <div v-if="jResult" style="padding:20px;background:var(--new-bg);border:1px solid #b3d4f7;border-radius:var(--radius);margin-bottom:12px">
            <div style="font-size:22px;font-weight:700;margin-bottom:6px">{{jResult.label}}</div>
            <div style="font-size:14px;color:var(--text-muted);margin-bottom:4px">{{jResult.cat}}</div>
            <div v-if="jResult.gensan>0" style="font-size:15px;font-weight:700;color:var(--del-text);margin-top:12px">門前薬局等立地依存減算：▲{{jResult.gensan}}点</div>
            <div v-if="jResult.gensan>0" style="font-size:14px;color:var(--text-muted)">実質：{{jResult.pts - jResult.gensan}}点</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="jApplyToR8()">R8予測に反映</button><span v-if="jApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            <button class="btn" @click="jReset()">最初からやり直す</button>
          </div>
        </div>

        <div v-if="jError" style="margin-top:12px;padding:8px 12px;background:#fee;border:1px solid #f5c6c6;border-radius:var(--radius);font-size:13px;color:var(--del-text)">{{jError}}</div>
        <div v-if="jStep<5" style="margin-top:20px;display:flex;gap:8px">
          <button v-if="jStep>1" class="btn" @click="jBack()">戻る</button>
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="jNext()">次へ</button>
        </div>
      </div>
    </div>
    <div v-if="sub==='k_chiiki'">
      <div class="section">
        <div class="section-title">地域支援・医薬品供給対応体制加算 <span class="badge badge-merged">統合</span></div>
        <div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          <div style="margin-bottom:4px"><b>概要：</b>旧「地域支援体制加算」と「後発医薬品調剤体制加算」を統合。5段階に再編。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき。特別調剤基本料Aの薬局は100分の10。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>全ての患者。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="margin-bottom:4px"><b>区分：</b><strong>イ</strong> 医薬品の安定供給体制 + <strong>ロ</strong> 後発品85%以上 → 加算1（27点）。加算1 + 地域医療への貢献実績 → 加算2～5。</div>
          <div style="margin-bottom:4px"><b>併算定：</b>連携強化加算、バイオ後続品調剤体制加算等と併算定可。</div>
          <div style="margin-bottom:4px"><b>届出：</b>必要（新設のため全薬局が届出要）。届出受付期間：R8.5.7〜6.1</div>
          <div style="margin-bottom:4px"><b>経過措置：</b>旧・後発医薬品調剤体制加算はR9.5.31まで算定可。</div>
          <div><b>R8変更点：</b>旧2加算を統合し名称変更。加算1（27点）を新設。全区分で後発品85%以上が基本要件に。</div>
        </div>
        <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap"><iframe width="48%" height="200" src="https://www.youtube.com/embed/wMeB4mvPZZk" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius)"></iframe><iframe width="48%" height="200" src="https://www.youtube.com/embed/JG_xkkXPyJY" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius)"></iframe></div>
      </div>
      <div class="section">
        <div class="section-title">加算1 施設基準判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{Math.min(cStep,4)}} / 4</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(Math.min(cStep,4)/4*100)+'%'}"></div></div>

        <div v-if="cStep===1" style="font-size:14px;line-height:1.8">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：イ — 医薬品の安定供給体制</div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">告示第71号の(1)～(8)。全て満たす必要があります。</p>
          <ul class="task-list">
            <li v-for="chk in cBaseChecksA" :key="chk.key" class="task-item" style="align-items:center">
              <input type="checkbox" class="task-check" v-model="cBase[chk.key]">
              <div style="font-size:13px;flex:1" :style="(cBase[chk.key]?'text-decoration:line-through;opacity:0.5;':'') + (chk.highlight?'color:var(--r6);font-weight:700':'')">{{chk.label}}</div>
              <button class="btn" style="font-size:10px;padding:2px 8px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="openHelp(chk.key)">チェック！</button>
            </li>
          </ul>
          <div v-if="cHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="closeHelp()">
            <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{cBaseChecksA.find(c=>c.key===cHelpModal)?.label}}</div>
              <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="getHelp(cHelpModal)"></div>
              <div style="margin-top:16px;text-align:right"><button class="btn" @click="closeHelp()" style="background:var(--text);color:white">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="cStep===2" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：ロの経過措置の確認</div>
          <div style="padding:12px;background:var(--amber-l);border:1px solid var(--amber);border-radius:var(--radius);margin-bottom:12px;font-size:13px;line-height:1.8">
            <div style="font-weight:700;color:var(--amber);margin-bottom:4px">〔経過措置〕</div>
            <div>後発医薬品調剤体制加算1、2又は3の届出を行っている薬局は、<strong>R9.5.31まで</strong>ロの要件（後発品85%以上）を満たしているとみなす。</div>
          </div>
          <div style="font-weight:600;margin-bottom:8px">後発医薬品調剤体制加算1～3の届出をしていましたか？</div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="cKeikaSochi" :value="true">はい → R9.5.31まで85%要件みなし（経過措置適用）</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="cKeikaSochi" :value="false">いいえ</label>
        </div>

        <div v-if="cStep===3" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：ロ — 後発医薬品使用率</div>
          <div v-if="cKeikaSochi" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-bottom:12px">経過措置適用: R9.5.31まで85%要件を満たしているとみなされます。</div>
          <div v-else style="margin-bottom:12px">
            <div style="margin-bottom:12px">後発医薬品のある先発医薬品及び後発医薬品を合算した規格単位数量に占める後発医薬品の規格単位数量の割合が<strong>85%以上</strong>であること。</div>
            <div style="font-size:12px;color:var(--amber);margin-bottom:12px;padding:8px;background:var(--amber-l);border-radius:var(--radius)">※算出期間: 届出前<strong>直近3か月</strong>の実績（R8年6月届出の場合: <strong>R8年2月～4月</strong>）<br>※後発医薬品の調剤数量割合が<strong>50%以下</strong>の薬局は調剤基本料を<strong style="color:var(--neg)">5点減算</strong>（注8、月600回以下の薬局は除く）</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;margin-bottom:8px">
              <input type="checkbox" v-model="cGe85actual" style="width:18px;height:18px">
              <span style="font-weight:600">直近3か月の後発医薬品の使用率が85%以上である</span>
            </label>
            <div v-if="!cGe85actual" style="padding:8px;background:#fee;border-radius:var(--radius);font-size:12px;color:var(--del-text);margin-bottom:8px">85%未満の場合、加算1は算定できません。</div>
          </div>
        </div>

        <div v-if="cStep===4">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 4：加算1の判定結果</div>
          <div style="padding:16px;border-radius:var(--radius);margin-bottom:16px" :style="cBaseOk?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px">{{cBaseOk ? '加算1（27点）算定可能' : '算定不可'}}</div>
            <div v-if="!cBaseOk" style="font-size:13px;color:var(--del-text)">
              <span v-if="!cRoOk">ロ（後発品85%）が未充足。</span>
              <span v-if="!cIchiOk">イ（安定供給体制）に未チェック項目があります。</span>
            </div>
          </div>
          <div v-if="cBaseOk" style="display:flex;gap:8px;align-items:center">
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="cApplyToR8()">加算1（27点）をR8予測に反映</button><span v-if="cApplied && (!cResult || cResult.pts===27)" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            <button class="btn" @click="cReset()">最初からやり直す</button>
          </div>
        </div>

        <div v-if="cError" style="margin-top:12px;padding:8px 12px;background:#fee;border:1px solid #f5c6c6;border-radius:var(--radius);font-size:13px;color:var(--del-text)">{{cError}}</div>
        <div v-if="cStep<4" style="margin-top:20px;display:flex;gap:8px">
          <button v-if="cStep>1" class="btn" @click="cBack()">戻る</button>
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="cNext()">次へ</button>
        </div>
      </div>
      <div class="section">
        <div class="section-title">加算2～5 施設基準判定ツール</div>
        <div v-if="!cBaseOk" style="padding:12px;background:#fee;border:1px solid #f5c6c6;border-radius:var(--radius);font-size:13px;color:var(--del-text)">加算1の要件を先に満たしてください。加算2～5は加算1の要件に加えて実績指標が必要です。</div>
        <template v-if="cBaseOk">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{c2Step}} / 4</div>
          <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(c2Step/4*100)+'%'}"></div></div>

          <div v-if="c2Step===1" style="font-size:14px;line-height:2">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：調剤基本料の種別</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="cKihonType" value="kihon1">調剤基本料1 → 加算2（59点）/ 加算3（67点）</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="cKihonType" value="other">調剤基本料1以外 → 加算4（37点）/ 加算5（59点）</label>
          </div>

          <div v-if="c2Step===2" style="font-size:14px;line-height:1.6">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：実績9指標</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px;background:var(--surface2);border-radius:var(--radius)">
              <div v-if="cKihonType==='kihon1'"><strong>加算2（59点）:</strong> ④を含む3つ以上 / <strong>加算3（67点）:</strong> 7つ以上</div>
              <div v-else><strong>加算4（37点）:</strong> ④⑥を含む3つ以上 / <strong>加算5（59点）:</strong> 7つ以上</div>
              <div style="margin-top:4px">※①～⑧は処方箋1万枚当たりの年間回数、⑨は薬局当たりの年間回数</div>
            </div>
            <div style="margin-bottom:16px;padding:12px;background:var(--surface2);border-radius:var(--radius)">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <div style="font-weight:600;font-size:13px">年間処方箋受付枚数</div>
                <div style="display:flex;gap:6px">
                  <button class="btn" style="font-size:13px;padding:8px 20px;background:var(--r6);color:white;border:none;font-weight:700;border-radius:var(--radius);box-shadow:0 2px 6px rgba(26,115,232,0.3)" @click="cIndLoadR7()">R7実績読込</button>
                  <button class="btn" style="font-size:11px;padding:6px 12px" @click="cIndClear()">クリア</button>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px"><input type="number" class="fee-input" style="max-width:150px" v-model.number="cIndRxAnnual"> 枚/年</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:6px 4px;color:var(--text-muted)">指標</th><th style="text-align:right;padding:6px 4px;color:var(--text-muted);width:90px">年間算定回数</th><th style="text-align:right;padding:6px 4px;color:var(--text-muted);width:80px">1万枚当たり</th><th style="text-align:right;padding:6px 4px;color:var(--text-muted);width:70px">基準値</th><th style="text-align:center;padding:6px 4px;width:50px">判定</th></tr>
              <tr v-for="ind in cIndLabels" :key="ind.key" style="border-bottom:0.5px solid var(--border)">
                <td style="padding:6px 4px"><div style="display:flex;align-items:flex-start;gap:4px"><span>{{ind.label}}</span><button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="c2OpenHelp(ind.key)">?</button></div><span v-if="cKihonType==='kihon1'&&ind.reqK1" style="font-size:10px;color:var(--neg)">{{ind.reqK1}}</span><span v-if="cKihonType!=='kihon1'&&ind.reqOther" style="font-size:10px;color:var(--neg)">{{ind.reqOther}}</span><span v-if="ind.isPerPharmacy" style="font-size:10px;color:var(--text-muted)">（薬局当たり）</span><div v-if="ind.note2" style="font-size:10px;color:var(--amber)">{{ind.note2}}</div></td>
                <td style="text-align:right;padding:6px 4px"><input type="number" class="fee-input" :class="{'empty-input':ind.manual}" :style="'max-width:80px;font-size:11px;height:26px'+(ind.manual?';border-color:var(--neg)':'')" v-model.number="cIndActual[ind.key]"><div v-if="ind.manual" style="font-size:9px;color:var(--neg)">手入力</div></td>
                <td style="text-align:right;padding:6px 4px;font-family:'IBM Plex Mono',monospace" :style="cIndMet(ind.key)?'color:var(--pos);font-weight:700':'color:var(--text-muted)'">{{cIndPer10k(ind.key)}}</td>
                <td style="text-align:right;padding:6px 4px;color:var(--teal);font-weight:600">{{cKihonType==='kihon1' ? ind.k1s : ind.others}}</td>
                <td style="text-align:center;padding:6px 4px"><input type="checkbox" v-model="cInd[ind.key]" style="width:16px;height:16px"></td>
              </tr>
            </table>
            <div style="margin-top:8px;padding:8px;background:var(--surface2);border-radius:var(--radius);font-size:13px">クリア: <strong>{{cIndCount}}</strong> / 9指標</div>
            <div v-if="c2HelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="c2CloseHelp()">
              <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
                <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{cIndLabels.find(i=>i.key===c2HelpModal)?.label}}</div>
                <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="c2GetHelp(c2HelpModal)"></div>
                <div style="margin-top:16px;text-align:right"><button class="btn" @click="c2CloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
              </div>
            </div>
          </div>

          <div v-if="c2Step===3" style="font-size:14px;line-height:1.6">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：施設基準の確認</div>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">加算2～5の算定には、加算1の要件に加えて以下の施設基準を全て満たす必要があります。</p>
            <p style="font-size:13px;font-weight:700;color:var(--amber);margin-bottom:12px">※令和７年度に地域支援体制加算を取っている場合は、青字（新規・変更）のみチェック</p>
            <div v-for="grp in c2FacilityChecks" :key="grp.group" style="margin-bottom:16px">
              <div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--text)">{{grp.group}}</div>
              <ul class="task-list">
                <li v-for="item in grp.items" :key="item.key" class="task-item" style="align-items:center">
                  <input type="checkbox" class="task-check" v-model="c2Facility[item.key]">
                  <div style="font-size:12px;flex:1" :style="(c2Facility[item.key]?'text-decoration:line-through;opacity:0.5;':'') + (item.isNew?'color:var(--r6);font-weight:600':'')">{{item.label}}<span v-if="item.labelBlue" style="color:var(--r6);font-weight:700">{{item.labelBlue}}</span><span v-if="item.labelAfter">{{item.labelAfter}}</span><span v-if="item.isNew" class="badge badge-new" style="margin-left:6px">新規</span><span v-if="item.isChanged" class="badge badge-modified" style="margin-left:6px">変更</span></div>
                  <button v-if="item.help" class="btn" style="font-size:10px;padding:2px 8px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="c2FacOpenHelp(item.key)">チェック！</button>
                </li>
              </ul>
            </div>
            <div v-if="!c2FacilityOk" style="padding:8px;background:#fee;border-radius:var(--radius);font-size:12px;color:var(--del-text)">未チェックの項目があります。全て満たす必要があります。</div>
            <div v-if="c2FacHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="c2FacCloseHelp()">
              <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
                <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{c2FacGetLabel(c2FacHelpModal)}}</div>
                <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="c2FacGetHelp(c2FacHelpModal)"></div>
                <div style="margin-top:16px;text-align:right"><button class="btn" @click="c2FacCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
              </div>
            </div>
          </div>

          <div v-if="c2Step===4">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 4：判定結果</div>
            <div v-if="cResult" style="padding:20px;border-radius:var(--radius);margin-bottom:12px" :style="cResult.pts>27?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
              <div style="font-size:22px;font-weight:700;margin-bottom:6px">{{cResult.label}}</div>
              <div style="font-size:14px;color:var(--text-muted)">{{cResult.reason}}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button v-if="cResult&&cResult.pts>27" class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="cApplyToR8()">{{cResult.label}}をR8予測に反映</button><span v-if="cApplied && cResult && cResult.pts>27" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
              <button class="btn" @click="c2Reset()">最初からやり直す</button>
            </div>
          </div>

          <div v-if="c2Step<4" style="margin-top:20px;display:flex;gap:8px">
            <button v-if="c2Step>1" class="btn" @click="c2Back()">戻る</button>
            <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="c2Next()">次へ</button>
          </div>
        </template>
      </div>
    </div>
    <div v-if="sub==='k_renkei'">
      <div class="section">
        <div class="section-title">連携強化加算 <span style="font-size:12px;font-weight:400;color:var(--pos)">5点</span></div>
        <div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          <div style="margin-bottom:4px"><b>概要：</b>感染対策向上加算の届出を行った医療機関と連携し、感染防止対策に関する取組を実施する薬局を評価。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき5点。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>全ての患者。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="margin-bottom:4px"><b>併算定：</b>地域支援・医薬品供給対応体制加算等と併算定可。特別調剤基本料Aの薬局で連携先が感染対策向上加算の届出医療機関の場合は算定不可。</div>
          <div style="margin-bottom:4px"><b>届出：</b>R7で算定済みの場合は届出不問（表3）。新規算定の場合は届出が必要。</div>
          <div><b>R8変更点：</b>施設基準の変更なし。</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{rkStep}} / 3</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(rkStep/3*100)+'%'}"></div></div>

        <div v-if="rkStep===1" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：加算算定状況</div>
          <div style="font-weight:600;margin-bottom:8px">令和7年度に連携強化加算を届出していましたか？</div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="rkR7" :value="true">はい → 変更がなければ、引き続き算定可能</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="rkR7" :value="false">いいえ → 施設基準を確認</label>
        </div>

        <div v-if="rkStep===2" style="font-size:14px;line-height:1.8">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：施設基準の確認</div>
          <div v-if="rkR7" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-bottom:12px">R7で届出済み。R8改定で施設基準の変更はありません。以下の要件に変更がないことを確認してください。</div>
          <p v-else style="font-size:12px;color:var(--text-muted);margin-bottom:12px">新規に算定する場合、以下の施設基準を全て満たす必要があります。</p>
          <ul class="task-list">
            <li v-for="chk in rkCheckLabels" :key="chk.key" class="task-item" style="align-items:center">
              <input type="checkbox" class="task-check" v-model="rkChecks[chk.key]">
              <div style="font-size:13px;flex:1" :style="(rkChecks[chk.key]?'text-decoration:line-through;opacity:0.5;':'') + (chk.highlight?'color:var(--r6);font-weight:700':'')">{{chk.label}}</div>
              <button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="rkOpenHelp(chk.key)">?</button>
            </li>
          </ul>
          <div v-if="rkHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="rkCloseHelp()">
            <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{rkCheckLabels.find(c=>c.key===rkHelpModal)?.label}}</div>
              <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="rkGetHelp(rkHelpModal)"></div>
              <div style="margin-top:16px;text-align:right"><button class="btn" @click="rkCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="rkStep===3">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：判定結果</div>
          <div v-if="rkResult" style="padding:20px;border-radius:var(--radius);margin-bottom:12px" :style="rkResult.pts>0?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
            <div style="font-size:22px;font-weight:700;margin-bottom:6px">{{rkResult.label}}</div>
            <div style="font-size:14px;color:var(--text-muted)">{{rkResult.reason}}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="rkApplyToR8()">R8予測に反映</button><span v-if="rkApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            <button class="btn" @click="rkReset()">最初からやり直す</button>
          </div>
        </div>

        <div v-if="rkStep<3" style="margin-top:20px;display:flex;gap:8px">
          <button v-if="rkStep>1" class="btn" @click="rkBack()">戻る</button>
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="rkNext()">次へ</button>
        </div>
      </div>
    </div>
    <div v-if="sub==='k_dx8'">
      <div class="section">
        <div class="section-title">電子的調剤情報連携体制整備加算 <span class="badge badge-merged">統合</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">8点（月1回）</span></div>
        <div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8;margin-bottom:12px">
          <div style="margin-bottom:4px"><b>概要：</b>医療DX推進体制整備加算（3区分）＋医療情報取得加算を廃止し一本化。電子処方箋システムによる重複投薬等チェック体制の整備を評価。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき8点。<b>患者1人につき月1回</b>に限る。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>全ての患者。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="margin-bottom:4px"><b>算定要件：</b>オンライン資格確認等システムや電子処方箋管理サービスの重複投薬等チェックを通じて取得した情報を閲覧・活用し、調剤・服薬指導等を行うこと。</div>
          <div style="margin-bottom:4px"><b>併算定：</b>調剤基本料の加算として算定。他の加算と併算定可。</div>
          <div style="margin-bottom:4px"><b>届出：</b>R7でDX加算を算定済みの場合は届出不問（表3）。新規の場合は届出が必要。</div>
          <div><b>R8変更点：</b>旧3区分（6/8/10点）＋医療情報取得加算（1点）→ 8点に一本化。名称変更。</div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.8">旧加算との対比</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:12px">
          <tr style="background:var(--surface2)"><th style="padding:6px 8px;text-align:left;border:1px solid var(--border)"></th><th style="padding:6px 8px;text-align:center;border:1px solid var(--border)">現行</th><th style="padding:6px 8px;text-align:center;border:1px solid var(--border)">改定後</th></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">イ 医療DX推進体制整備加算1</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">10点</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border);color:var(--r6);font-weight:700" rowspan="3">電子的調剤情報連携体制整備加算<br>8点（月1回）</td></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">ロ 医療DX推進体制整備加算2</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">8点</td></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">ハ 医療DX推進体制整備加算3</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">6点</td></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">医療情報取得加算</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">1点（年1回）</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border);color:var(--neg)">削除</td></tr>
        </table>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">R7でDX加算を算定済みの場合、届出不問（表3）。ただし変更要件の確認が必要。</div>
      </div>
      <div class="section">
        <div class="section-title">判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{dxStep}} / 3</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(dxStep/3*100)+'%'}"></div></div>

        <div v-if="dxStep===1" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：加算算定状況</div>
          <div style="font-weight:600;margin-bottom:8px">令和7年度に医療DX推進体制整備加算を届出していましたか？</div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="dxR7" :value="true">はい → 変更がなければ、引き続き算定可能（届出不問）</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="dxR7" :value="false">いいえ → 施設基準を確認</label>
        </div>

        <div v-if="dxStep===2" style="font-size:14px;line-height:1.8">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：施設基準の確認（告示第71号 五の四）</div>
          <div v-if="dxR7" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-bottom:12px">R7で届出済み。施設基準に変更がないことを確認してください。変更がなければ届出不問です。<div style="margin-top:6px;color:var(--r6);font-weight:700;font-size:12px">※青字（新規・変更）を中心にチェック</div></div>
          <p v-else style="font-size:12px;color:var(--text-muted);margin-bottom:12px">新規に算定する場合、以下の施設基準を全て満たす必要があります。</p>
          <ul class="task-list">
            <li v-for="chk in dxCheckLabels" :key="chk.key" class="task-item" style="align-items:center">
              <input type="checkbox" class="task-check" v-model="dxChecks[chk.key]">
              <div style="font-size:12px;flex:1" :style="(dxChecks[chk.key]?'text-decoration:line-through;opacity:0.5;':'') + (chk.highlight?'color:var(--r6);font-weight:700':'')">{{chk.label}} <span v-if="chk.badge" class="badge" :class="chk.badge==='新設'?'badge-new':'badge-modified'" style="font-size:10px;vertical-align:middle">{{chk.badge}}</span></div>
              <button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="dxOpenHelp(chk.key)">?</button>
            </li>
          </ul>
          <div v-if="dxHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="dxCloseHelp()">
            <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{dxCheckLabels.find(c=>c.key===dxHelpModal)?.label}}</div>
              <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="dxGetHelp(dxHelpModal)"></div>
              <div style="margin-top:16px;text-align:right"><button class="btn" @click="dxCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="dxStep===3">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：判定結果</div>
          <div v-if="dxResult" style="padding:20px;border-radius:var(--radius);margin-bottom:12px" :style="dxResult.pts>0?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
            <div style="font-size:22px;font-weight:700;margin-bottom:6px">{{dxResult.label}}</div>
            <div style="font-size:14px;color:var(--text-muted)">{{dxResult.reason}}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="dxApplyToR8()">R8予測に反映</button><span v-if="dxApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            <button class="btn" @click="dxReset()">最初からやり直す</button>
          </div>
        </div>

        <div v-if="dxStep<3" style="margin-top:20px;display:flex;gap:8px">
          <button v-if="dxStep>1" class="btn" @click="dxBack()">戻る</button>
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="dxNext()">次へ</button>
        </div>
      </div>
    </div>

    <div v-if="sub==='k_zaitaku'">
      <div class="section">
        <div class="section-title">在宅薬学総合体制加算 <span class="badge badge-modified">改定</span></div>
        <div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8;margin-bottom:12px">
          <div style="margin-bottom:4px"><b>概要：</b>在宅訪問を十分に行うための体制を整備する薬局を、実績に基づき評価。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき。加算1: 30点、加算2イ: 100点（個人宅）、加算2ロ: 50点（施設等）。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>厚生労働大臣が定める患者（在宅患者の処方箋に基づく対応の場合）。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="margin-bottom:4px"><b>併算定：</b>加算1と加算2は併算定不可（いずれかを算定）。特別調剤基本料Aの薬局は100分の10。</div>
          <div style="margin-bottom:4px"><b>届出：</b>加算2は再届出が必要（様式87の3の5）。加算1は区分変更がなければ届出不問。</div>
          <div style="margin-bottom:4px"><b>免許：</b>施設基準の実績要件に「麻薬管理指導加算の実績」があるため、実質的に<b style="color:var(--neg)">麻薬小売業者免許</b>が必要。</div>
          <div><b>R8変更点：</b>加算1を15→30点に倍増。加算2をイ（個人宅100点）・ロ（施設50点）に区分。要件強化。</div>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:12px">
          <tr style="background:var(--surface2)"><th style="padding:6px 8px;text-align:left;border:1px solid var(--border)"></th><th style="padding:6px 8px;text-align:center;border:1px solid var(--border)">現行</th><th style="padding:6px 8px;text-align:center;border:1px solid var(--border)">改定後</th></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">加算1</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">15点</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border);color:var(--r6);font-weight:700">30点</td></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">加算2イ <span style="color:var(--r6);font-weight:600">（新）</span><br><span style="font-size:11px">単一建物1人（個人宅）</span></td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)" rowspan="2">50点</td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border);color:var(--r6);font-weight:700">100点</td></tr>
          <tr><td style="padding:6px 8px;border:1px solid var(--border)">加算2ロ <span style="color:var(--r6);font-weight:600">（新）</span><br><span style="font-size:11px">イ以外（施設等）</span></td><td style="padding:6px 8px;text-align:center;border:1px solid var(--border)">50点</td></tr>
        </table>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">施設基準が改正。区分変更がない場合は届出不問。</div>
      </div>
      <div class="section">
        <div class="section-title">加算1 判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{Math.min(ztStep,3)}} / 3</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(Math.min(ztStep,3)/3*100)+'%'}"></div></div>

        <div v-if="ztStep===1" style="font-size:14px;line-height:2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：R7の届出状況</div>
          <div>令和7年度の在宅薬学総合体制加算の届出状況を選択してください。</div>
          <label style="cursor:pointer;display:block;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px" :style="ztR7==='zt1'?'border-color:var(--pos);background:var(--green-l)':''"><input type="radio" value="zt1" v-model="ztR7" style="margin-right:8px">加算1を届出していた</label>
          <label style="cursor:pointer;display:block;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px" :style="ztR7==='zt2'?'border-color:var(--pos);background:var(--green-l)':''"><input type="radio" value="zt2" v-model="ztR7" style="margin-right:8px">加算2を届出していた</label>
          <label style="cursor:pointer;display:block;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px" :style="ztR7==='none'?'border-color:var(--amber);background:var(--amber-l)':''"><input type="radio" value="none" v-model="ztR7" style="margin-right:8px">届出していない → 施設基準を確認</label>
        </div>

        <div v-if="ztStep===2" style="font-size:14px;line-height:1.8">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：加算1の施設基準</div>
          <div v-if="ztR7!=='none'" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-bottom:12px">R7で{{ztR7==='zt2'?'加算2':'加算1'}}を届出済み。以下の要件に変更がないことを確認してください。<div style="margin-top:6px;color:var(--r6);font-weight:700;font-size:12px">※青字（新規・変更）を中心にチェック</div></div>
          <p v-else style="font-size:12px;color:var(--text-muted);margin-bottom:12px">以下の施設基準を全て満たす必要があります。</p>
          <ul class="task-list">
            <li v-for="chk in ztCheckLabels" :key="chk.key" class="task-item" style="align-items:center">
              <input type="checkbox" class="task-check" v-model="ztChecks[chk.key]">
              <div style="font-size:13px;flex:1" :style="ztChecks[chk.key]?'text-decoration:line-through;opacity:0.5':''"><span v-if="chk.partialHighlight" v-html="chk.label.replace(chk.partialHighlight, '&lt;b style=&quot;color:var(--r6)&quot;&gt;'+chk.partialHighlight+'&lt;/b&gt;')"></span><span v-else :style="chk.highlight?'color:var(--r6);font-weight:700':''">{{chk.label}}</span> <span v-if="chk.badge" class="badge" :class="chk.badge==='新設'?'badge-new':'badge-modified'" style="font-size:10px;vertical-align:middle">{{chk.badge}}</span></div>
              <button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="ztOpenHelp(chk.key)">?</button>
            </li>
          </ul>
          <div v-if="ztHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="ztCloseHelp()">
            <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{[...ztCheckLabels,...zt2CheckLabels].find(c=>c.key===ztHelpModal)?.label}}</div>
              <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="ztGetHelp(ztHelpModal)"></div>
              <div style="margin-top:16px;text-align:right"><button class="btn" @click="ztCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="ztStep===3">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 3：加算1の判定結果</div>
          <div style="padding:16px;border-radius:var(--radius);margin-bottom:16px" :style="ztAllOk?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px">{{ztAllOk ? '加算1（30点）算定可能' : '算定不可'}}</div>
            <div v-if="ztAllOk" style="font-size:13px;color:var(--text-muted)">{{ztR7!=='none' ? '区分変更がなければ届出不問。' : '新規届出が必要（様式87の3の5）。'}}</div>
            <div v-else style="font-size:13px;color:var(--del-text)">施設基準に未チェック項目があります。</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button v-if="ztAllOk" class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="ztApplyToR8()">加算1（30点）をR8予測に反映</button><span v-if="ztApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            <button class="btn" @click="ztReset()">最初からやり直す</button>
          </div>
        </div>

        <div v-if="ztStep<3" style="margin-top:20px;display:flex;gap:8px">
          <button v-if="ztStep>1" class="btn" @click="ztBack()">戻る</button>
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="ztNext()">次へ</button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">加算2 判定ツール</div>
        <div v-if="!ztAllOk" style="padding:12px;background:#fee;border:1px solid #f5c6c6;border-radius:var(--radius);font-size:13px;color:var(--del-text)">加算1の要件を先に満たしてください。加算2は加算1の要件に加えて追加要件が必要です。</div>
        <template v-if="ztAllOk">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{zt2Step}} / 2</div>
          <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(zt2Step/2*100)+'%'}"></div></div>

          <div v-if="zt2Step===1" style="font-size:14px;line-height:1.8">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：加算2の追加要件</div>
            <div v-if="ztR7==='zt2'" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-bottom:12px">R7で加算2を届出済み。以下の要件に変更がないことを確認してください。<div style="margin-top:6px;color:var(--r6);font-weight:700;font-size:12px">※青字（新規・変更）を中心にチェック</div></div>
            <p v-else style="font-size:12px;color:var(--text-muted);margin-bottom:12px">加算1の基準に加え、以下の全てを満たす必要があります。</p>
            <ul class="task-list">
              <li v-for="chk in zt2CheckLabels" :key="chk.key" class="task-item" style="align-items:center">
                <input type="checkbox" class="task-check" v-model="zt2Checks[chk.key]">
                <div style="font-size:13px;flex:1" :style="zt2Checks[chk.key]?'text-decoration:line-through;opacity:0.5':''">
                  <span :style="chk.highlight?'color:var(--r6);font-weight:700':''">{{chk.label}}</span>
                  <span v-if="chk.badge" class="badge" :class="chk.badge==='新設'?'badge-new':'badge-modified'" style="font-size:10px;vertical-align:middle;margin-left:4px">{{chk.badge}}</span>
                  <div v-if="chk.table" v-html="chk.table"></div>
                  <div v-if="chk.subItems" style="margin-top:4px;padding-left:12px">
                    <div v-for="(si,idx) in chk.subItems" :key="idx" :style="si.highlight?'color:var(--r6);font-weight:700;text-decoration:underline':''">{{si.text}}</div>
                  </div>
                </div>
                <button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="ztOpenHelp(chk.key)">?</button>
              </li>
            </ul>
            <div v-if="ztHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="ztCloseHelp()">
              <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
                <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{[...ztCheckLabels,...zt2CheckLabels].find(c=>c.key===ztHelpModal)?.label}}</div>
                <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="ztGetHelp(ztHelpModal)"></div>
                <div style="margin-top:16px;text-align:right"><button class="btn" @click="ztCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
              </div>
            </div>
          </div>

          <div v-if="zt2Step===2">
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：加算2の判定結果</div>
            <div style="padding:16px;border-radius:var(--radius);margin-bottom:16px" :style="zt2AllOk?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
              <div style="font-size:20px;font-weight:700;margin-bottom:4px">{{zt2AllOk ? '加算2（イ100点／ロ50点）算定可能' : '加算2は算定不可'}}</div>
              <div v-if="zt2AllOk" style="font-size:13px;color:var(--text-muted)">{{ztR7==='zt2' ? '区分変更がなければ届出不問。' : '届出が必要（様式87の3の5）。'}}</div>
              <div v-else style="font-size:13px;color:var(--del-text)">追加要件に未チェック項目があります。加算1（30点）で算定可能です。</div>
            </div>
            <div v-if="zt2AllOk" style="display:flex;gap:8px;align-items:center">
              <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="zt2ApplyToR8()">加算2でR8予測に反映</button><span v-if="ztApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
            </div>
            <button class="btn" style="margin-top:12px;font-size:12px" @click="zt2Reset()">加算2をやり直す</button>
          </div>

          <div v-if="zt2Step<2" style="margin-top:20px;display:flex;gap:8px">
            <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="zt2Next()">次へ</button>
          </div>
        </template>
      </div>
    </div>

    <div v-if="sub==='k_jikangai'">
      <div class="section">
        <div class="section-title">時間外加算（時間外・休日・深夜）</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          開局時間外に調剤した場合の加算。R8改定での変更なし。<br>
          <b>対象患者：</b>開局時間外に来局した急病等やむを得ない理由の患者。常態として開局している時間に来局した患者は対象外。
        </div>
      </div>
      <div class="section">
        <div class="section-title">概要・点数</div>
        <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th>時間帯</th><th style="text-align:right">加算率</th></tr></thead><tbody>
          <tr><td style="font-weight:600">時間外加算</td><td>概ね午前8時前・午後6時以降、終日休業日</td><td style="text-align:right">基礎額の100%</td></tr>
          <tr><td style="font-weight:600">休日加算</td><td>日曜・祝日・年末年始（12/29〜1/3）</td><td style="text-align:right">基礎額の140%</td></tr>
          <tr><td style="font-weight:600">深夜加算</td><td>午後10時〜午前6時</td><td style="text-align:right">基礎額の200%</td></tr>
        </tbody></table>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">※時間外・休日・深夜加算は重複算定不可。</div>
      </div>
      <div class="section">
        <div class="section-title">算定要件</div>
        <div style="font-size:13px;line-height:1.8">
          <div style="font-weight:600;margin-bottom:6px">基礎額の計算</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:var(--radius)">
            基礎額 ＝ 調剤基本料（注1〜16適用後）＋ 薬剤調製料 ＋ 無菌製剤処理加算 ＋ 調剤管理料<br>
            <span style="color:var(--neg)">※含まないもの：</span>麻薬等加算、自家製剤加算、計量混合調剤加算、調剤時残薬調整加算、薬学的有害事象等防止加算
          </div>
          <div style="font-weight:600;margin-bottom:6px">時間外加算（基礎額×100%）</div>
          <ul style="padding-left:18px;font-size:12px;color:var(--text-muted);margin-bottom:10px">
            <li>開局時間外であること（常態として調剤応需の態勢をとっている時間は対象外）</li>
            <li>処方箋の受付時間を薬剤服用歴等に記載すること</li>
          </ul>
          <div style="font-weight:600;margin-bottom:6px">休日加算（基礎額×140%）</div>
          <ul style="padding-left:18px;font-size:12px;color:var(--text-muted);margin-bottom:10px">
            <li>輪番制による休日当番薬局、救急医療対策の一環の薬局、行政要請による開局の場合</li>
            <li>休日を開局しない薬局で急病等やむを得ない理由による場合</li>
            <li>常態として休日に開局している薬局の開局時間内は算定不可</li>
          </ul>
          <div style="font-weight:600;margin-bottom:6px">深夜加算（基礎額×200%）</div>
          <ul style="padding-left:18px;font-size:12px;color:var(--text-muted);margin-bottom:10px">
            <li>午後10時〜午前6時。常態として深夜開局している場合は対象外</li>
            <li>処方箋の受付時間を薬剤服用歴等に記載すること</li>
          </ul>
        </div>
      </div>
      <div class="section">
        <div class="section-title">施設基準・届出</div>
        <div style="padding:10px;background:#e8f5e9;border-radius:var(--radius);font-size:12px">
          施設基準なし。<b>届出不要</b>。要件を満たせば算定可能。開局時間を薬局の内側・外側に表示すること。
        </div>
        <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：保医発0305第6号 別添3 (9)、告示第69号 別表第三 区分01 注4</div>
      </div>
    </div>

    <div v-if="sub==='k_yakan'">
      <div class="section">
        <div class="section-title">夜間・休日等加算</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          開局時間内の夜間・休日に調剤した場合の加算。時間外加算とは異なり<b>開局時間内</b>が対象。R8改定での変更なし。<br>
          <b>対象患者：</b>開局時間内の夜間・休日時間帯に来局した全ての患者。
        </div>
      </div>
      <div class="section">
        <div class="section-title">概要・点数</div>
        <table class="fee-table" style="font-size:12px"><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody>
          <tr><td style="font-weight:600">点数</td><td>処方箋受付1回につき <b>40点</b></td></tr>
          <tr><td style="font-weight:600">対象時間</td><td>午後7時（土曜日は午後1時）〜 午前8時、休日の開局時間内</td></tr>
          <tr><td style="font-weight:600">算定単位</td><td>薬剤調製料の加算として算定</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="section-title">算定要件</div>
        <ul style="padding-left:18px;font-size:12px;color:var(--text-muted);line-height:2">
          <li>当該保険薬局が表示する<b>開局時間内</b>の時間において調剤を行った場合に算定</li>
          <li>時間外加算等の要件を満たす場合は、夜間・休日等加算ではなく<b>時間外加算等を算定</b>すること</li>
          <li>開局時間を薬局の<b>内側・外側</b>の分かりやすい場所に表示すること</li>
          <li>夜間・休日等加算の<b>対象日・受付時間帯</b>を薬局内の分かりやすい場所に掲示すること</li>
          <li>平日・土曜日に算定する場合は、処方箋の<b>受付時間を薬剤服用歴等に記載</b>すること</li>
        </ul>
      </div>
      <div class="section">
        <div class="section-title">施設基準・届出</div>
        <div style="padding:10px;background:#e8f5e9;border-radius:var(--radius);font-size:12px">
          施設基準なし。<b>届出不要</b>。開局時間の掲示・表示が必要。
        </div>
        <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：保医発0305第6号 別添3 (10)、告示第69号 別表第三 区分01 注5</div>
      </div>
    </div>

    <div v-if="sub==='k_bio'">
      <div class="section">
        <div class="section-title">バイオ後続品調剤体制加算 <span class="badge badge-new">新設</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">50点</span></div>
        <div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">
          <div style="margin-bottom:4px"><b>概要：</b>バイオ後続品（インスリン製剤を除く）の使用促進のための体制評価。</div>
          <div style="margin-bottom:4px"><b>算定単位：</b>処方箋受付1回につき50点。バイオ後続品を調剤した場合に算定。</div>
          <div style="margin-bottom:4px"><b>対象患者：</b>バイオ後続品（インスリン製剤を除く）が処方された患者。</div>
          <div style="margin-bottom:4px"><b>併算定：</b>調剤基本料の加算として算定。特別調剤基本料Aの薬局は100分の10。特別調剤基本料Bの薬局は算定不可。後発医薬品減算の対象外。</div>
          <div style="margin-bottom:4px"><b style="color:var(--neg)">届出：必要（様式87の3の7）</b>　新設のためR7実績なし。</div>
          <div><b>届出受付期間：</b>令和8年5月7日〜6月1日（必着）</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">判定ツール</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ステップ {{bioStep}} / 2</div>
        <div class="req-progress" style="margin-bottom:16px"><div class="req-progress-bar" :style="{width:(bioStep/2*100)+'%'}"></div></div>

        <div v-if="bioStep===1" style="font-size:14px;line-height:1.8">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 1：施設基準の確認（告示第71号 五）</div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">以下の施設基準を全て満たす必要があります。</p>
          <ul class="task-list">
            <li v-for="chk in bioCheckLabels" :key="chk.key" class="task-item" style="align-items:center">
              <input type="checkbox" class="task-check" v-model="bioChecks[chk.key]">
              <div style="font-size:13px;flex:1" :style="bioChecks[chk.key]?'text-decoration:line-through;opacity:0.5':''">{{chk.label}}</div>
              <button class="btn" style="font-size:9px;padding:1px 5px;flex-shrink:0;background:var(--amber-l);color:var(--amber);border:1px solid var(--amber)" @click.stop="bioOpenHelp(chk.key)">?</button>
            </li>
          </ul>
          <div v-if="bioHelpModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center" @click="bioCloseHelp()">
            <div style="background:white;border-radius:var(--radius-lg);padding:24px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)" @click.stop>
              <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{bioCheckLabels.find(c=>c.key===bioHelpModal)?.label}}</div>
              <div style="font-size:13px;color:var(--text-muted);line-height:1.8;white-space:pre-line" v-html="bioGetHelp(bioHelpModal)"></div>
              <div style="margin-top:16px;text-align:right"><button class="btn" @click="bioCloseHelp()" style="background:var(--text);color:white">閉じる</button></div>
            </div>
          </div>
        </div>

        <div v-if="bioStep===2">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px">Step 2：判定結果</div>
          <div v-if="bioResult" style="padding:20px;border-radius:var(--radius);margin-bottom:12px" :style="bioResult.pts>0?'background:var(--new-bg);border:1px solid #b3d4f7':'background:#fee;border:1px solid #f5c6c6'">
            <div style="font-size:22px;font-weight:700;margin-bottom:6px">{{bioResult.label}}</div>
            <div style="font-size:14px;color:var(--text-muted)">{{bioResult.reason}}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 16px" @click="bioApplyToR8()">R8予測に反映</button><span v-if="bioApplied" style="font-size:12px;color:var(--pos);font-weight:600;margin-left:8px">反映しました</span>
          </div>
          <button class="btn" style="margin-top:12px;font-size:12px" @click="bioReset()">最初からやり直す</button>
        </div>

        <div v-if="bioStep<2" style="margin-top:20px;display:flex;gap:8px">
          <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="bioNext()">次へ</button>
        </div>
      </div>
    </div>

    <div v-if="sub==='k_bukka'">
      <div class="section">
        <div class="section-title">調剤物価対応料 <span class="badge badge-new">新設</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">1点（3月に1回）</span></div>
        <div style="display:grid;grid-template-columns:2fr 3fr;gap:16px;margin-bottom:16px">
          <img src="img/r8_bukka_overview.png" alt="物価対応に係る全体像" style="width:100%;border-radius:var(--radius);border:1px solid #e0e0e0;align-self:start">
          <div style="align-self:start;font-size:12px;line-height:1.8">
            <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
            <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
              R8年度及びR9年度の物価上昇に段階的に対応するため、調剤基本料等の算定に併せて算定可能な加算として新設。処方箋受付1回につき<b>1点</b>、<b style="color:var(--neg)">3月に1回に限り</b>算定。R9年6月以降は<b>2点</b>（100分の200）。調剤基本料に包括。
            </div>
            <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
            <div style="color:var(--text-muted);margin-bottom:8px">全ての患者。処方箋を受け付けた場合に算定。患者の同意等は不要。</div>
            <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
              <li>処方箋を提出した患者に対して調剤した場合に、<b>3月に1回に限り</b>算定</li>
              <li>併算定：調剤基本料等と併せて算定可能。他の加算との制限なし</li>
            </ul>
            <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
            <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:#e8f5e9;border-radius:6px"><b>施設基準なし。届出不要。</b>全ての保険薬局で算定可能。</div>
            <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
              <li>R8年度以降の物価上昇（医療材料費・光熱水費・委託費等）への対応分</li>
              <li>R6年度以降の経営環境の悪化を踏まえた緊急対応分</li>
            </ul>
            <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
            <div style="color:var(--text-muted)">保医発0305第6号 別添3 区分41。疑義解釈での特段のQ&Aなし。</div>
          </div>
        </div>
      </div>
    </div>

    ` + YAKUGAKU_TEMPLATE + `    <div v-if="sub==='memo'">
      <div class="section">
        <div class="section-title">加算の整理方針</div>
        <div style="font-size:13px;line-height:2;padding:14px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:8px">加算は以下の内容で必要なものを整理する</div>
          <ol style="padding-left:24px;margin:0">
            <li style="margin-bottom:4px"><b>概要</b> ─ 加算の趣旨、算定単位、点数、算定回数・頻度の制限</li>
            <li style="margin-bottom:4px"><b>対象患者</b> ─ どの患者に算定できるか、除外条件</li>
            <li style="margin-bottom:4px"><b>算定要件</b> ─ 算定に必要な行為・条件、併算定の可否</li>
            <li style="margin-bottom:4px"><b>施設基準</b> ─ 届出に必要な体制・実績要件</li>
            <li style="margin-bottom:4px"><b>改定内容・狙い</b> ─ R7→R8での変更点、改定の背景・目的、経過措置</li>
            <li style="margin-bottom:4px"><b>通知・疑義解釈</b> ─ 留意事項通知の該当箇所、疑義解釈Q&A</li>
            <li><b>届出・免許・報告・その他</b> ─ 届出様式・届出方法・届出期限、必要な免許・許可、報告義務、その他留意事項</li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="sub==='ot_chozai'">
      <div class="section">
        <div class="section-title">薬剤調製料（区分01）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            処方箋に基づき薬剤を調製した場合に、剤種ごとに算定する技術料。R8改定での点数変更なし。施設基準なし、届出不要。
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 点数一覧</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:12px"><thead><tr><th>剤種</th><th>算定単位</th><th style="text-align:right">点数</th><th>備考</th></tr></thead><tbody>
            <tr><td style="font-weight:600">内服薬</td><td>1剤につき</td><td style="text-align:right">24点</td><td>服用時点同一＝1剤。4剤分以上は算定不可。</td></tr>
            <tr><td style="font-weight:600">内服用滴剤</td><td>1調剤につき</td><td style="text-align:right">10点</td><td>内服薬の注1による。</td></tr>
            <tr><td style="font-weight:600">屯服薬</td><td>受付1回につき</td><td style="text-align:right">21点</td><td>剤数にかかわらず1回のみ。</td></tr>
            <tr><td style="font-weight:600">浸煎薬</td><td>1調剤につき</td><td style="text-align:right">190点</td><td>4調剤以上は算定不可。</td></tr>
            <tr><td style="font-weight:600">湯薬</td><td>1調剤につき</td><td style="text-align:right">190〜400点</td><td>7日以下190点、8〜28日は190点+10点/日、29日以上400点。4調剤以上は算定不可。</td></tr>
            <tr><td style="font-weight:600">注射薬</td><td>受付1回につき</td><td style="text-align:right">26点</td><td>調剤数にかかわらず1回のみ。</td></tr>
            <tr><td style="font-weight:600">外用薬</td><td>1調剤につき</td><td style="text-align:right">10点</td><td>4調剤以上は算定不可。</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件のポイント</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:12px">
            <li><b>「1剤」の考え方：</b>服用時点が同一であれば、投与日数にかかわらず1剤として算定。例：毎食後の2種類の薬＝1剤。</li>
            <li><b>4剤制限：</b>内服薬は4剤分以上、浸煎薬・湯薬・外用薬は4調剤以上の部分は算定不可。</li>
            <li><b>分割調剤：</b>14日分超の投薬で保存困難等の理由による場合は2回目以降1分割調剤につき5点。医師の分割指示による場合は点数を分割回数で除して算定。</li>
            <li><b>リフィル処方箋：</b>2回目以降の調剤でも薬剤調製料は算定可能。</li>
          </ul>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示第69号 別表第三 区分01、保医発0305第6号 別添3</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='ot_mukin'">
      <div class="section">
        <div class="section-title">無菌製剤処理加算 <span class="badge badge-modified">改定</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            注射薬について無菌製剤処理を行った場合に、1日につき所定点数を加算。R8で対象年齢を6歳未満→<b>15歳未満</b>に拡大、中心静脈栄養法用は<b>137→237点</b>に増点。
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">中心静脈栄養法用輸液、抗悪性腫瘍剤又は麻薬が処方された患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 点数</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>薬剤</th><th style="text-align:right">一般</th><th style="text-align:right">15歳未満</th></tr></thead><tbody>
            <tr><td>中心静脈栄養法用輸液</td><td style="text-align:right">69点</td><td style="text-align:right;color:var(--pos);font-weight:600">237点 <span class="badge badge-modified">改定</span></td></tr>
            <tr><td>抗悪性腫瘍剤</td><td style="text-align:right">79点</td><td style="text-align:right">147点</td></tr>
            <tr><td>麻薬</td><td style="text-align:right">69点</td><td style="text-align:right">137点</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">無菌製剤処理を行うための設備（無菌室・クリーンベンチ・安全キャビネット等）を有していること。届出が必要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">対象を6歳未満の乳幼児→15歳未満の小児に拡大。小児に対しても投与量調整が発生することを踏まえた評価の見直し。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">告示第69号 別表第三 区分01 注2。保医発0305第6号 別添3 (7)。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・その他</div>
          <ul style="padding-left:18px;color:var(--text-muted)">
            <li>届出が必要（施設基準の届出）</li>
            <li>特段の免許は不要だが、無菌調剤室を<b>共同利用</b>する場合は薬事法施行規則に基づく要件を遵守すること。費用は両者の合議。</li>
            <li>麻薬の無菌製剤処理を行う場合は<b style="color:var(--neg)">麻薬小売業者免許</b>が必要</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="sub==='ot_mayaku'">
      <div class="section">
        <div class="section-title">麻薬・向精神薬等加算</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            麻薬、向精神薬、覚醒剤原料又は毒薬を調剤した場合の加算。R8改定での変更なし。
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 点数</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>薬剤</th><th>算定単位</th><th style="text-align:right">点数</th></tr></thead><tbody>
            <tr><td style="font-weight:600">麻薬</td><td>1調剤につき</td><td style="text-align:right">70点</td></tr>
            <tr><td style="font-weight:600">向精神薬・覚醒剤原料・毒薬</td><td>1調剤につき</td><td style="text-align:right">8点</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>重複した規制を受けている薬剤：麻薬の場合は70点、それ以外は8点</li>
            <li>内服薬のほか、屯服薬、注射薬、外用薬についても算定可</li>
            <li>予製剤等で規制含有量以下の場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">施設基準なし。届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 届出・免許・その他</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li><b style="color:var(--neg)">麻薬小売業者免許</b>が必要（麻薬及び向精神薬取締法に基づき都道府県知事に申請）</li>
            <li>覚醒剤原料を取り扱う場合は<b>覚醒剤原料取扱者指定</b>が必要</li>
            <li>向精神薬・毒薬の取扱いには特段の免許は不要だが、保管・管理の法的義務あり</li>
          </ul>
          <div style="font-size:11px;color:var(--text-faint)">出典：告示第69号 別表第三 区分01 注3、保医発0305第6号 別添3 (8)、麻薬及び向精神薬取締法</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='ot_jika'">
      <div class="section">
        <div class="section-title">自家製剤加算・計量混合調剤加算</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 自家製剤加算</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            薬剤を自家製剤の上調剤した場合の加算。1調剤につき算定（内服薬の錠剤等は投与日数7日ごと）。予製剤・錠剤分割の場合は100分の20。R8改定での変更なし。
          </div>
          <table class="fee-table" style="font-size:12px;margin-bottom:12px"><thead><tr><th style="width:55%">区分</th><th style="width:22%;text-align:right">点数</th><th style="width:23%;text-align:right">予製剤（20/100）</th></tr></thead><tbody>
            <tr><td>内服薬 錠剤・カプセル剤・散剤等</td><td style="text-align:right">20点（7日ごと）</td><td style="text-align:right">4点</td></tr>
            <tr><td>内服薬 屯服薬 錠剤・散剤等</td><td style="text-align:right">90点</td><td style="text-align:right">18点</td></tr>
            <tr><td>内服薬・屯服薬 液剤</td><td style="text-align:right">45点</td><td style="text-align:right">9点</td></tr>
            <tr><td>外用薬 錠剤・軟膏剤・坐剤等</td><td style="text-align:right">90点</td><td style="text-align:right">18点</td></tr>
            <tr><td>外用薬 点眼剤・点鼻剤等</td><td style="text-align:right">75点</td><td style="text-align:right">15点</td></tr>
            <tr><td>外用薬 液剤</td><td style="text-align:right">45点</td><td style="text-align:right">9点</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">2. 計量混合調剤加算</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            2種以上の薬剤を計量・混合して調剤した場合の加算。1調剤につき算定。自家製剤加算と併算定不可。R8改定での変更なし。
          </div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th style="width:55%">区分</th><th style="width:22%;text-align:right">点数</th><th style="width:23%;text-align:right">予製剤（20/100）</th></tr></thead><tbody>
            <tr><td>液剤</td><td style="text-align:right">35点</td><td style="text-align:right">7点</td></tr>
            <tr><td>散剤・顆粒剤</td><td style="text-align:right">45点</td><td style="text-align:right">9点</td></tr>
            <tr><td>軟・硬膏剤</td><td style="text-align:right">80点</td><td style="text-align:right">16点</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">施設基準</div>
          <div style="color:var(--text-muted)">いずれも施設基準なし。届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示第69号 別表第三 区分01 注6・7、保医発0305第6号 別添3 (11)(12)</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='ot_yakuzai'">
      <div class="section">
        <div class="section-title">薬剤料（区分20）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            使用薬剤の薬価に基づき算定。R8改定での計算方法の変更なし（<b style="color:var(--r6)">薬価改定率 ▲0.86%、R8年4月施行</b>）
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 計算方法</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>薬価が15円以下 → <b>1点</b></li>
            <li>薬価が15円超 → 10円又はその端数を増すごとに<b>1点加算</b></li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">3. 特記事項</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>特別調剤基本料A・Bの薬局で1処方につき7種類以上の内服薬を調剤した場合は<b>100分の90</b>で算定</li>
          </ul>
          <div style="font-size:11px;color:var(--text-faint)">出典：告示第69号 別表第三 区分20</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">特定保険医療材料料（区分30）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
            特定保険医療材料を支給した場合に算定。材料価格を10円で除して得た点数。R8改定での変更なし（<b style="color:var(--r6)">材料価格改定率 ▲0.01%、R8年6月施行</b>）。
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 計算方法</div>
          <div style="color:var(--text-muted);margin-bottom:8px">材料価格 ÷ 10円 ＝ 点数</div>
          <div style="font-weight:700;margin-bottom:6px">3. 対象</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>在宅医療に係る自己注射用の注射器・注射針等</li>
            <li>別表2に掲げる特定保険医療材料</li>
            <li>在宅医療以外の目的で使用する材料は算定不可</li>
          </ul>
          <div style="font-size:11px;color:var(--text-faint)">出典：告示第69号 別表第三 区分30</div>
        </div>
      </div>
    </div>

    <template v-for="pid in judgePageIds" :key="pid"><div v-if="sub===pid">
      <div class="section">
        <div class="section-title">{{JUDGE_PAGES[pid].title}}</div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">出典：{{JUDGE_PAGES[pid].source}}</p>
        <div v-if="JUDGE_PAGES[pid].desc" style="font-size:12px;color:var(--text-muted);margin-bottom:16px;padding:10px;background:var(--surface2);border-radius:var(--radius);line-height:1.8">{{JUDGE_PAGES[pid].desc}}</div>
        <div style="font-weight:700;margin-bottom:8px">施設基準の要件</div>
        <ul class="task-list">
          <li v-for="chk in JUDGE_PAGES[pid].checks" :key="chk.id" class="task-item">
            <input type="checkbox" class="task-check" :checked="jpChecked(pid, chk.id)" @change="jpToggle(pid, chk.id)">
            <div style="font-size:13px" :style="(jpChecked(pid, chk.id)?'text-decoration:line-through;opacity:0.5;':'') + (chk.highlight?'color:var(--r6);font-weight:700':'')">{{chk.label}}</div>
          </li>
        </ul>
        <div v-if="JUDGE_PAGES[pid].indicators" style="margin-top:16px">
          <div style="font-weight:700;margin-bottom:8px">実績指標（処方箋1万枚当たり/年）</div>
          <ul class="task-list">
            <li v-for="ind in JUDGE_PAGES[pid].indicators" :key="ind.id" class="task-item">
              <input type="checkbox" class="task-check" :checked="jpChecked(pid, ind.id)" @change="jpToggle(pid, ind.id)">
              <div style="font-size:13px" :style="jpChecked(pid, ind.id)?'text-decoration:line-through;opacity:0.5':''">{{ind.label}}</div>
            </li>
          </ul>
        </div>
        <div v-if="JUDGE_PAGES[pid].checks2" style="margin-top:16px">
          <div style="font-weight:700;margin-bottom:8px">加算2の追加要件</div>
          <ul class="task-list">
            <li v-for="chk in JUDGE_PAGES[pid].checks2" :key="chk.id" class="task-item">
              <input type="checkbox" class="task-check" :checked="jpChecked(pid, chk.id)" @change="jpToggle(pid, chk.id)">
              <div style="font-size:13px" :style="jpChecked(pid, chk.id)?'text-decoration:line-through;opacity:0.5':''">{{chk.label}}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="section">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select class="fee-select" :value="jpSelectedOption(pid)" @change="jpSelectOption(pid, $event.target.value)">
            <option :value="null" disabled>選択してください</option>
            <option v-for="opt in JUDGE_PAGES[pid].options" :key="opt.value" :value="opt.value">{{opt.label}}</option>
          </select>
          <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="jpApply(pid)">R8予測に反映</button>
          <span v-if="jpApplied(pid)" style="font-size:13px;color:var(--pos);font-weight:600">反映しました</span>
        </div>
      </div>
    </div></template>

    <div v-if="sub==='k_baseup'">
      <div class="section">
        <div class="section-title">調剤ベースアップ評価料 <span class="badge badge-new">新設</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">4点（受付1回）</span></div>
        <div style="display:grid;grid-template-columns:2fr 3fr;gap:16px;margin-bottom:16px">
          <img src="img/r8_baseup_overview.jpg" alt="賃上げ・物価対応に係る全体像" style="width:100%;border-radius:var(--radius);border:1px solid #e0e0e0;align-self:start">
          <div style="align-self:start;font-size:12px;line-height:1.8">
            <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
            <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">
              薬局職員の賃金改善を図る体制を評価。処方箋の受付1回につき<b>4点</b>を算定。R9年6月以降は<b>8点</b>（100分の200）。収入は全額を対象職員の賃上げに充当する必要がある。
            </div>
            <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
            <div style="color:var(--text-muted);margin-bottom:8px">全ての患者。処方箋を受け付けた場合に算定。頻度制限なし（受付の都度算定可能）。</div>
            <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
              <li>収入は対象職員の<b>基本給又は毎月の手当の引上げ</b>及びそれに伴う賞与・時間外手当・法定福利費等の増加分にのみ充当可能</li>
              <li>賞与だけの引き上げは不可。「処遇改善手当」等の新設はOK</li>
              <li>原則として算定開始月から賃金改善を実施し、算定する月は継続すること</li>
              <li>併算定：他の加算との制限なし</li>
            </ul>
            <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:4px">
              <li>当該保険薬局に勤務する職員がいること</li>
              <li>対象職員の賃金の改善を実施するにつき必要な体制が整備されていること</li>
            </ul>
            <div style="padding:8px 10px;background:#e8f5e9;border-radius:6px;color:var(--text);margin-bottom:8px">
              <b>対象職員：</b>40歳未満の薬局勤務薬剤師、事務職員（年齢不問）<br>
              <b>除外：</b>事業主・使用者・開設者・管理薬剤師・業務委託者・本部職員等<br>
              <b>届出：</b>必要（<b>様式103</b>、原則メール提出）。届出前1月の給与支払い実績が必要。<br>
              <b>必要賃上げ水準：</b>R8・R9各年度 +3.2%（事務職員は+5.7%）
            </div>
            <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
            <div style="color:var(--text-muted);margin-bottom:8px">R8新設。薬剤師・事務職員の確実な賃上げを実現するための原資措置。R8・R9の2年間で段階的にベースアップを支援。</div>
            <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
            <div style="color:var(--text-muted)">
              保医発0305第6号 別添3 区分40。<br>
              疑義解釈その1 問2（派遣職員）、問3（管理薬剤師は対象外）。<br>
              疑義解釈その2 問7（3.2%未達でも算定可）、問8-9（除外対象者）、問10（出向元職員）。
            </div>
            <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告・その他</div>
            <ul style="padding-left:18px;color:var(--text-muted)">
              <li><b>届出：</b>様式103（原則メール提出）。届出前1月の給与支払い実績が必要。</li>
              <li><b style="color:var(--neg)">報告：賃金改善実績報告書</b>（年1回・8月まで提出）＋<b>賃金改善中間報告書</b>の提出義務あり。</li>
              <li>原則として算定開始月から賃金改善を実施し、算定する月は継続すること。</li>
              <li>R8年6月〜R9年5月の収入は原則としてR9年5月までの賃金改善に用いること（翌年度への繰越は原則不可）。</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">よくある疑問</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:8px">
            <div style="font-weight:700;color:var(--text);margin-bottom:4px">Q. パート・アルバイトは対象に含まれるか？</div>
            <div style="color:var(--text-muted)"><b style="color:var(--pos)">含まれます。</b>雇用形態による除外規定はありません。直接雇用であれば対象です。派遣職員も一定要件のもと対象にできます（疑義解釈その1 問2）。<br>
            <b>除外されるのは：</b>事業主・使用者・開設者・<span style="color:var(--neg)">管理薬剤師</span>・40歳以上の薬剤師・業務委託者・調剤業務に直接従事しない本部職員等（疑義解釈その2 問8-9）</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:8px">
            <div style="font-weight:700;color:var(--text);margin-bottom:4px">Q. 対象職員全員の賃上げが必要か？</div>
            <div style="color:var(--text-muted)"><b style="color:var(--pos)">はい。</b>評価料により得られる収入は<b>全て</b>対象職員の基本給又は毎月の手当の引上げに充当する必要があります。一部の職員だけ上げて他は据え置きは不可です（疑義解釈その2 問7）。</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:8px">
            <div style="font-weight:700;color:var(--text);margin-bottom:4px">Q. 40歳未満の薬剤師がいない場合は？</div>
            <div style="color:var(--text-muted)"><b style="color:var(--pos)">事務職員がいれば届出可能です。</b>施設基準は「勤務する職員がいること」であり、対象職員が1名以上いれば足ります。</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:8px">
            <div style="font-weight:700;color:var(--text);margin-bottom:4px">Q. 3.2%（5.7%）のベースアップを達成できなくても届出できるか？</div>
            <div style="color:var(--text-muted)"><b style="color:var(--pos)">算定できます。</b>ただし得られた収入は全額を対象職員の賃上げに用いること。3.2%に届かなくても、収入全額を賃上げに充てていれば問題ありません（疑義解釈その2 問7）。</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius)">
            <div style="font-weight:700;color:var(--text);margin-bottom:4px">Q. 賞与（ボーナス）での引き上げは可能か？</div>
            <div style="color:var(--text-muted)"><b style="color:var(--neg)">賞与だけの引き上げは不可。</b>まず<b>基本給又は毎月の手当を引き上げ</b>ることが必須で、「<b>それに伴う</b>」賞与・時間外手当・法定福利費の増加分も充当対象です。基本給を据え置いて賞与のみ上乗せすることはできません（保医発0305第6号 別添3 区分40(2)）。<br><b style="color:var(--pos)">「処遇改善手当」等の新設はOK。</b>毎月固定で支払われる手当であれば、新たに創設する形でも認められます。</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">試算：届出すべきか？</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">ベースアップ評価料の収入と、対象職員（薬剤師は40歳未満、事務職員は年齢不問）への必要賃上げ額を比較します。<br>薬剤師は+3.2%、事務職員は+5.7%が水準です。</div>

        <div style="margin-bottom:16px">
          <div style="font-weight:700;margin-bottom:8px">収入見込み</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:12px;color:var(--text-muted);min-width:140px">年間処方箋受付回数</span>
            <input type="text" class="fee-input" style="max-width:120px;text-align:right" :value="fmtC(buRxCount)" @change="buRxCount=parseNum($event.target.value)">
            <span style="font-size:12px">回</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px">→ 年間収入: <b style="color:var(--pos)">{{formatYen(buRxCount * 40)}}</b> 円（R9: {{formatYen(buRxCount * 80)}} 円）</span>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div style="font-weight:700;margin-bottom:4px">対象職員の入力</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">対象外: 事業主・開設者・管理薬剤師・40歳以上の薬剤師・業務委託者</div>
          <table class="fee-table" style="font-size:12px">
            <thead><tr><th style="width:30px"></th><th style="width:100px">職種</th><th style="width:50px;text-align:center">年齢</th><th style="width:120px;text-align:right"><div>月額給与</div><div style="font-weight:400;font-size:10px;color:var(--text-faint)">基本給＋固定手当（通勤手当除く）</div></th><th style="width:100px;text-align:right"><div><label style="display:flex;align-items:center;justify-content:flex-end;gap:4px;cursor:pointer"><input type="checkbox" v-model="buBonusLinked" style="margin:0"> 賞与（年額）</label></div><div style="font-weight:400;font-size:10px;color:var(--text-faint)">基本給連動の場合</div></th><th style="width:40px;text-align:right">率</th><th style="width:100px;text-align:right"><div>ベア等</div><div style="font-weight:400;font-size:10px;color:var(--text-faint)">基本給等×率×12</div></th><th style="width:100px;text-align:right"><div>伴う増加分</div><div style="font-weight:400;font-size:10px;color:var(--text-faint)">賞与増＋法定福利費増</div></th><th style="width:100px;text-align:right">必要額</th></tr></thead>
            <tbody>
              <tr v-for="(s, i) in buStaff" :key="i">
                <td style="text-align:center;color:var(--text-faint)">{{i+1}}</td>
                <td><select class="fee-select" style="font-size:12px;padding:2px 4px" v-model="s.type"><option value="pharmacist">薬剤師</option><option value="clerk">事務職員</option></select></td>
                <td style="text-align:center"><input v-if="s.type==='pharmacist'" type="number" class="fee-input" style="max-width:45px;text-align:center;font-size:12px" v-model.number="s.age"><span v-else style="color:var(--text-faint);font-size:11px">不問</span></td>
                <td style="text-align:right"><input type="text" class="fee-input" style="max-width:110px;text-align:right;font-size:12px" :value="fmtC(s.monthlySalary)" @change="s.monthlySalary=parseNum($event.target.value)"></td>
                <td style="text-align:right"><input v-if="buBonusLinked" type="text" class="fee-input" style="max-width:90px;text-align:right;font-size:12px" :value="fmtC(s.bonus||0)" @change="s.bonus=parseNum($event.target.value)"><span v-else style="color:var(--text-faint);font-size:11px">-</span></td>
                <td style="text-align:right"><span v-if="buIsTarget(s)">{{s.type==='clerk'?'5.7%':'3.2%'}}</span><span v-else>-</span></td>
                <td style="text-align:right"><span v-if="buIsTarget(s)&&s.monthlySalary>0">{{formatYen(buBearAmount(s))}}</span><span v-else style="color:var(--text-faint)">-</span></td>
                <td style="text-align:right"><span v-if="buIsTarget(s)&&s.monthlySalary>0">{{formatYen(buAssociated(s))}}</span><span v-else style="color:var(--text-faint)">-</span></td>
                <td style="text-align:right"><span v-if="buIsTarget(s)&&s.monthlySalary>0">{{formatYen(buPersonTotal(s))}}</span><span v-else>-</span></td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="font-weight:700"><td colspan="8" style="text-align:right">合計</td><td style="text-align:right;color:var(--neg)">{{formatYen(buRequiredTotal)}}</td></tr>
            </tfoot>
          </table>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn" style="font-size:11px;padding:4px 12px" @click="buAddStaff()">＋ 職員追加</button>
            <button v-if="buStaff.length>1" class="btn" style="font-size:11px;padding:4px 12px" @click="buRemoveStaff()">－ 削除</button>
          </div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:6px">※様式104に準拠。ベア等＝基本給等(月額)×賃上げ率×12ヶ月。伴う増加分＝賞与増＋法定福利費増(15%)。</div>
        </div>

        <div style="padding:14px;border-radius:var(--radius);font-size:14px;line-height:1.8" :style="buRxCount>0&&buRequiredTotal>0?(buRxCount*40>=buRequiredTotal?'background:#e8f5e9;border:2px solid var(--pos)':'background:#fff3e0;border:2px solid var(--amber)'):'background:var(--surface2)'">
          <template v-if="buRxCount>0&&buRequiredTotal>0">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:8px;font-size:13px">
              <div><div style="color:var(--text-muted);font-size:11px">評価料収入</div><div style="font-weight:700;color:var(--pos)">{{formatYen(buRxCount*40)}} 円</div></div>
              <div><div style="color:var(--text-muted);font-size:11px">賃上げ必要額</div><div style="font-weight:700;color:var(--neg)">{{formatYen(buRequiredTotal)}} 円</div></div>
              <div><div style="color:var(--text-muted);font-size:11px">差額</div><div style="font-weight:700" :style="buRxCount*40>=buRequiredTotal?'color:var(--pos)':'color:var(--neg)'">{{formatYen(buRxCount*40 - buRequiredTotal)}} 円</div></div>
            </div>
            <div style="font-weight:700;margin-bottom:4px">
              <span v-if="buRxCount*40>=buRequiredTotal" style="color:var(--pos)">収入が賃上げ必要額を上回ります</span>
              <span v-else style="color:var(--amber)">収入が賃上げ必要額を下回ります（持ち出しが発生）</span>
            </div>
          </template>
          <template v-else>
            <div style="color:var(--text-muted)">処方箋受付回数と対象職員の情報を入力すると、試算結果を表示します。</div>
          </template>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px">
        <select class="fee-select" :value="buApplyVal" @change="buApplyVal=$event.target.value">
          <option value="4">届出する（4点）</option>
          <option value="0">届出しない（0点）</option>
        </select>
        <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="buApplyToR8()">R8予測に反映</button>
        <span v-if="buApplied" style="font-size:13px;color:var(--pos);font-weight:600">反映しました</span>
      </div>
    </div>

  </div>`
}
