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
  template: `<div>
<div class="section">
  <div class="section-title">令和8年度 調剤報酬改定の概要</div>
  <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">令和8年6月1日施行（薬価はR8年4月施行）。出典：厚生労働省「令和8年度診療報酬改定の概要【調剤】」令和8年3月5日版</p>
  <p style="font-size:13px;margin-bottom:16px;line-height:1.8">
    <a href="https://www.mhlw.go.jp/stf/newpage_67729.html" target="_blank" style="color:var(--teal);text-decoration:underline">令和8年度診療報酬改定について（厚生労働省）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/iryo_shido/r08_shinryohoshu_00001.html" target="_blank" style="color:var(--teal);text-decoration:underline">令和8年度診療報酬改定について（九州厚生局）</a><br>
    <a href="https://www.youtube.com/playlist?list=PLMG33RKISnWjFBIQEEGRuzwFbGAsk7uLD" target="_blank" style="color:var(--teal);text-decoration:underline">説明会動画（薬局：リスト番号1、18、21）</a><br>
    <a href="https://www.mhlw.go.jp/stf/newpage_71068.html" target="_blank" style="color:var(--teal);text-decoration:underline">説明会資料（薬局：資料番号0、18、19）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/000456078.pdf" target="_blank" style="color:var(--teal);text-decoration:underline">九州厚生局：令和8年度調剤報酬改定に伴う施設基準の届出等について</a><br>
    <a href="https://ika.shaho.co.jp/r06_ika_kaishaku/tokkei_todokede/" target="_blank" style="color:var(--teal);text-decoration:underline">施設基準等に係る届出書・届出様式（社会保険研究所）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/shinsei/online-shinsei.html" target="_blank" style="color:var(--teal);text-decoration:underline">電子申請について（九州厚生局）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/about/jimushoichiran.html" target="_blank" style="color:var(--teal);text-decoration:underline">お問合せ（九州厚生局事務所一覧）</a>
  </p>
  <div class="kpi-grid" style="margin-bottom:20px">
    <div class="kpi-card positive"><div class="kpi-label">診療報酬全体</div><div class="kpi-value" style="font-size:18px">+3.09%</div><div style="font-size:11px;color:var(--text-muted)">2年度平均</div></div>
    <div class="kpi-card positive"><div class="kpi-label">調剤改定率</div><div class="kpi-value" style="font-size:18px">+0.08%</div></div>
    <div class="kpi-card negative"><div class="kpi-label">薬価改定率</div><div class="kpi-value" style="font-size:18px">▲0.86%</div><div style="font-size:11px;color:var(--text-muted)">R8年4月施行</div></div>
    <div class="kpi-card"><div class="kpi-label">経過措置期限</div><div class="kpi-value" style="font-size:18px">R9.5.31</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">調剤報酬の体系（令和8年改定後）</div>
  <img src="img/r8_taikei.png" alt="調剤報酬の体系（令和8年改定後）" style="width:100%;border-radius:var(--radius);border:1px solid #e0e0e0">
</div>

<div class="section">
  <div class="section-title">1. 賃上げ・物価対応</div>
  <div style="font-size:13px;line-height:1.8;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
      <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:4px">調剤ベースアップ評価料（新設）</div>
        <div style="color:var(--text-muted)">処方箋受付1回につき4点。R9年度は8点に引上げ予定。対象：40歳未満の薬局勤務薬剤師・事務職員。全額を賃金改善に充当。R8・R9各年度+3.2%（事務職員+5.7%）のベア実現。</div>
      </div>
      <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:4px">調剤物価対応料（新設）</div>
        <div style="color:var(--text-muted)">処方箋受付1回につき1点（3月に1回）。R9年度は2点に引上げ予定。医療材料費・光熱水費・委託費等の物件費高騰への対応。</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">2. 体制評価の見直し</div>
  <div style="font-size:13px;line-height:1.8">
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">調剤基本料の見直し</div>
      <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
        <tr><td>基本料1</td><td style="text-align:right">45点</td><td style="text-align:right;color:var(--pos);font-weight:600">47点</td></tr>
        <tr><td>基本料2</td><td style="text-align:right">29点</td><td style="text-align:right;color:var(--pos);font-weight:600">30点</td></tr>
        <tr><td>基本料3イ</td><td style="text-align:right">24点</td><td style="text-align:right;color:var(--pos);font-weight:600">25点</td></tr>
        <tr><td>基本料3ロ</td><td style="text-align:right">19点</td><td style="text-align:right;color:var(--pos);font-weight:600">20点</td></tr>
        <tr><td>基本料3ハ</td><td style="text-align:right">35点</td><td style="text-align:right;color:var(--pos);font-weight:600">37点</td></tr>
        <tr><td>特別A</td><td style="text-align:right">32点</td><td style="text-align:right">5点</td></tr>
        <tr><td>特別B</td><td style="text-align:right">5点</td><td style="text-align:right">3点</td></tr>
      </tbody></table>
      <ul style="padding-left:16px;color:var(--text-muted);margin-top:6px;font-size:12px">
        <li>同一グループ300店舗以上の区分を撤廃（3ロ・3ハ統合）</li>
        <li>医療モール内の複数医療機関を1つとみなす集中率計算に変更</li>
        <li>都市部の新規開設薬局に門前薬局等立地依存減算（▲15点）を新設</li>
        <li>特別Aの同一建物内診療所の除外規定を撤廃</li>
      </ul>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">加算の統合・新設・廃止</div>
      <table class="fee-table" style="font-size:12px"><thead><tr><th>項目</th><th>変更</th><th>内容</th></tr></thead><tbody>
        <tr><td>地域支援体制加算<br>+後発医薬品調剤体制加算</td><td><span class="badge badge-merged">統合</span></td><td>地域支援・医薬品供給対応体制加算1〜5に再編（27/59/67/37/59点）</td></tr>
        <tr><td>後発医薬品調剤体制加算</td><td><span class="badge badge-abolished-merged">統合廃止</span></td><td>上記に統合。経過措置R9.5.31</td></tr>
        <tr><td>在宅薬学総合体制加算</td><td><span class="badge badge-modified">改定</span></td><td>加算1: 15→30点、加算2イ: 50→100点、加算2ロ: 50点据置</td></tr>
        <tr><td>バイオ後続品調剤体制加算</td><td><span class="badge badge-new">新設</span></td><td>50点（バイオ後続品調剤時）</td></tr>
        <tr><td>医療DX推進体制整備加算</td><td><span class="badge badge-modified">改定</span></td><td>3区分を廃止し電子的調剤情報連携体制整備加算（8点）に一本化</td></tr>
      </tbody></table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">3. 対人業務の評価見直し</div>
  <div style="font-size:13px;line-height:1.8">
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">かかりつけ薬剤師：包括評価から実績重視へ転換</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:10px;background:var(--del-bg);border-radius:var(--radius);border:1px solid #f5c6c6">
          <div style="font-weight:700;color:var(--del-text);margin-bottom:4px;font-size:12px">廃止</div>
          <ul style="padding-left:16px;color:var(--del-text);font-size:12px;line-height:1.6"><li>かかりつけ薬剤師指導料（76点）</li><li>かかりつけ薬剤師包括管理料（291点）</li></ul>
        </div>
        <div style="padding:10px;background:var(--new-bg);border-radius:var(--radius);border:1px solid #b3d4f7">
          <div style="font-weight:700;color:var(--new-text);margin-bottom:4px;font-size:12px">新設（実績評価）</div>
          <ul style="padding-left:16px;color:var(--new-text);font-size:12px;line-height:1.6"><li>フォローアップ加算（50点/3月に1回）</li><li>訪問加算（230点/6月に1回）</li></ul>
        </div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">調剤管理料の見直し</div>
      <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
        <tr><td>7日以下</td><td style="text-align:right">4点</td><td style="text-align:right" rowspan="3">27日以下: 10点</td></tr>
        <tr><td>8〜14日</td><td style="text-align:right">28点</td></tr>
        <tr><td>15〜28日</td><td style="text-align:right">50点</td></tr>
        <tr><td>29日以上</td><td style="text-align:right">60点</td><td style="text-align:right">28日以上: 60点（据置）</td></tr>
      </tbody></table>
      <p style="color:var(--text-muted);font-size:12px;margin-top:4px">調剤管理加算は廃止。内服以外の調剤管理料は4→10点。</p>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">残薬対策・薬学的介入の強化</div>
      <table class="fee-table" style="font-size:12px"><thead><tr><th>項目</th><th>変更</th><th>内容</th></tr></thead><tbody>
        <tr><td>重複投薬・相互作用等防止加算</td><td><span class="badge badge-abolished-merged">統合廃止</span></td><td>下記2つに発展的再編</td></tr>
        <tr><td>調剤時残薬調整加算</td><td><span class="badge badge-new">新設</span></td><td>30点/50点</td></tr>
        <tr><td>薬学的有害事象等防止加算</td><td><span class="badge badge-new">新設</span></td><td>30点/50点</td></tr>
        <tr><td>医療情報取得加算</td><td><span class="badge badge-abolished-merged">統合廃止</span></td><td>電子的調剤情報連携体制整備加算に統合</td></tr>
      </tbody></table>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">在宅訪問の充実</div>
      <ul style="padding-left:16px;color:var(--text-muted);font-size:12px;line-height:1.8">
        <li>訪問薬剤管理医師同時指導料（新設 150点/6月に1回）：医師と薬剤師の同時訪問</li>
        <li>複数名薬剤管理指導訪問料（新設 300点）：複数名での訪問</li>
        <li>訪問薬剤管理指導の算定間隔：「中6日以上」→「週1回」に緩和</li>
        <li>服用薬剤調整支援料2：110点→1,000点（R9年6月適用、かかりつけ薬剤師による包括的介入）</li>
      </ul>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">4. その他</div>
  <ul style="padding-left:16px;font-size:13px;line-height:1.8;color:var(--text-muted)">
    <li>無菌製剤処理加算の増点対象を6歳未満→15歳未満に拡大</li>
    <li>吸入薬指導加算の対象にインフルエンザ吸入薬を追加（算定上限: 3月→6月に1回）</li>
    <li>バイオ後続品の品質等に関する説明を特定薬剤管理指導加算3ロで評価</li>
    <li>在宅患者オンライン薬剤管理指導料と服薬管理指導料を一本化</li>
    <li>夜間休日における調剤の選定療養化</li>
  </ul>
</div>

<div class="section">
  <div class="section-title">このシステムの使い方</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:12px">
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">1. R7実績</div><div style="color:var(--text-muted)">レセコンPDFから実績データを取り込みます。</div></div>
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">2. R8予測</div><div style="color:var(--text-muted)">R8改定後の点数で売上予測を確認できます。</div></div>
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">3. 経営影響</div><div style="color:var(--text-muted)">R7→R8のカテゴリ別増減を試算します。</div></div>
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">4. 事務タスク</div><div style="color:var(--text-muted)">届出変更・システム更新等をチェックリストで管理。</div></div>
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)"><div style="font-weight:700;margin-bottom:4px">5. 施設基準</div><div style="color:var(--text-muted)">地域支援体制等の施設基準の要件を確認。</div></div>
  </div>
</div>
</div>`
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
<div class="section"><div class="section-title">経営影響</div>
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
</tbody></table></div></div>`
}

const TasksTab = {
  setup() {

    // Reactive task store (loaded from API)
    const store = reactive({ categories: [], tasks: {} })
    const loading = ref(true)

    // API helpers
    async function loadTasks() {
      try {
        const res = await fetch('/api/tasks')
        if (!res.ok) throw new Error(res.status)
        const json = await res.json()
        store.categories = json.categories || []
        store.tasks = json.tasks || {}
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
        try { await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: store.categories, tasks: store.tasks }) }) }
        catch (e) { console.error('保存失敗:', e.message) }
      }, 300)
    }
    loadTasks()

    // Status
    function status(id) { return store.tasks[id]?.status || 'todo' }
    function setStatus(id, s) { if (store.tasks[id]) { store.tasks[id].status = s; saveTasks() } }
    function cycleStatus(id) {
      const s = status(id)
      setStatus(id, s === 'todo' ? 'wip' : s === 'wip' ? 'done' : 'todo')
    }
    const statusLabel = { todo: '未着手', wip: '進行中', done: '完了' }

    const columns = [{ key: 'todo', label: '未着手' }, { key: 'wip', label: '進行中' }, { key: 'done', label: '完了' }]
    const allTasks = computed(() => {
      const list = []
      for (const cat of store.categories) {
        for (const tid of cat.keys) {
          if (store.tasks[tid]) list.push({ id: tid, task: store.tasks[tid], cat: cat.label })
        }
      }
      return list
    })
    const totalTasks = computed(() => allTasks.value.length)
    const doneTasks = computed(() => allTasks.value.filter(t => status(t.id) === 'done').length)
    const wipTasks = computed(() => allTasks.value.filter(t => status(t.id) === 'wip').length)
    const pct = computed(() => totalTasks.value ? Math.round(doneTasks.value / totalTasks.value * 100) : 0)
    function tasksInColumn(col) { return allTasks.value.filter(t => status(t.id) === col) }

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

    // Add task
    const showAddForm = ref(false)
    const addForm = reactive({ title: '', detail: '', deadline: '', category: '' })
    function openAddForm() {
      addForm.title = ''; addForm.detail = ''; addForm.deadline = ''
      addForm.category = store.categories.length ? store.categories[0].id : ''
      showAddForm.value = true
    }
    function addTask() {
      if (!addForm.title.trim()) return
      const id = 'u' + Date.now()
      store.tasks[id] = { title: addForm.title.trim(), detail: addForm.detail.trim(), deadline: addForm.deadline.trim(), status: 'todo' }
      let cat = store.categories.find(c => c.id === addForm.category)
      if (!cat) {
        cat = { id: 'custom', label: 'カスタム', keys: [] }
        store.categories.push(cat)
      }
      cat.keys.push(id)
      showAddForm.value = false
      saveTasks()
    }

    // Delete task
    function deleteTask(id) {
      if (!confirm('このタスクを削除しますか？')) return
      delete store.tasks[id]
      for (const cat of store.categories) { cat.keys = cat.keys.filter(k => k !== id) }
      expandedCard.value = null
      saveTasks()
    }

    return { store, loading, status, setStatus, cycleStatus, statusLabel, totalTasks, doneTasks, wipTasks, pct,
             columns, tasksInColumn, dragId, onDragStart, onDragOver, onDrop, onDragEnd,
             expandedCard, toggleExpand, editingCard, editForm, startEdit, saveEdit, cancelEdit,
             showAddForm, addForm, openAddForm, addTask, deleteTask }
  },
  template: `<div>
    <div v-if="loading" class="section" style="text-align:center;padding:40px;color:var(--text-muted)">読み込み中...</div>
    <template v-else>
    <div class="section">
      <div class="section-title">事務タスク進捗</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi-card"><div class="kpi-label">未着手</div><div class="kpi-value" style="font-size:18px">{{totalTasks - doneTasks - wipTasks}}</div></div>
        <div class="kpi-card" style="border-color:var(--amber)"><div class="kpi-label" style="color:var(--amber)">進行中</div><div class="kpi-value" style="font-size:18px;color:var(--amber)">{{wipTasks}}</div></div>
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">完了</div><div class="kpi-value" style="font-size:18px">{{doneTasks}} / {{totalTasks}}</div></div>
        <div class="kpi-card" :class="pct===100?'positive':''"><div class="kpi-label">進捗率</div><div class="kpi-value" style="font-size:18px">{{pct}}%</div></div>
      </div>
      <div class="req-progress"><div class="req-progress-bar" :style="{width:pct+'%'}"></div></div>
    </div>
    <div style="margin-bottom:12px;text-align:right">
      <button class="btn" @click="openAddForm" style="background:var(--text);color:white;border:none">+ タスク追加</button>
    </div>
    <div v-if="showAddForm" class="section" style="margin-bottom:12px">
      <div class="section-title">タスクを追加</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="addForm.title" placeholder="タスク名（必須）">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="addForm.detail" placeholder="詳細（任意）">
        <input class="fee-input" style="max-width:100%;text-align:left" v-model="addForm.deadline" placeholder="期限（例: R8.6.1）">
        <select class="fee-select" v-model="addForm.category" style="max-width:100%">
          <template v-for="cat in store.categories" :key="cat.id"><option :value="cat.id">{{cat.label}}</option></template>
          <option value="__new__">+ 新しいカテゴリ</option>
        </select>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="showAddForm=false">キャンセル</button>
          <button class="btn" @click="addTask" style="background:var(--pos);color:white;border:none">追加</button>
        </div>
      </div>
    </div>
    <div class="kb-board">
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
            <div v-if="t.task.deadline" class="kb-card-dl">{{t.task.deadline}}</div>
            <div class="kb-card-foot">
              <span class="kb-card-tag">{{t.cat}}</span>
              <span class="kb-status-pill" :class="'kb-pill-'+col.key" @click.stop="cycleStatus(t.id)">{{statusLabel[col.key]}}</span>
            </div>
            <div v-if="expandedCard===t.id" class="kb-card-expand" @click.stop>
              <template v-if="editingCard===t.id">
                <input class="fee-input" style="max-width:100%;text-align:left;margin-bottom:4px" v-model="editForm.title" placeholder="タスク名">
                <input class="fee-input" style="max-width:100%;text-align:left;margin-bottom:4px" v-model="editForm.detail" placeholder="詳細">
                <input class="fee-input" style="max-width:100%;text-align:left;margin-bottom:8px" v-model="editForm.deadline" placeholder="期限">
                <div style="display:flex;gap:4px">
                  <button class="kb-move-btn" @click.stop="cancelEdit">キャンセル</button>
                  <button class="kb-move-btn kb-move-active" @click.stop="saveEdit(t.id)">保存</button>
                </div>
              </template>
              <template v-else>
                <div class="kb-card-desc">{{t.task.detail}}</div>
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
    </template>
  </div>`
}

const RequirementsTab = {
  props:['data','r8Data','activeSub'],
  emits:['update:activeSub'],
  setup(props, { emit }) {
    const sub = computed({ get:()=>props.activeSub||'checklist', set:v=>emit('update:activeSub',v) })
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
        help: '<b>必要な対応:</b>\n・卸売業者との価格交渉を<b style="color:var(--r6)">品目ごと</b>に実施（総価交渉ではなく単品単価）\n・<b style="color:var(--r6);text-decoration:underline">交渉記録の保存</b>\n・<b style="color:var(--r6);text-decoration:underline">様式85「妥結率等に係る報告書」を提出していること</b>\n・<b style="color:var(--neg)">【重要】直近に提出した報告書で、様式85の「単品単価交渉を行っていない」に非該当であること。該当（＝行っていない）の場合、本要件を満たさないものとして取り扱われる</b>\n・妥結率の管理（未妥結減算の回避にも関連）\n\n※「医療用医薬品の流通改善に関する懇談会」の流通改善ガイドラインに基づく' },
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
        help: '<b>対象:</b>\n・服薬情報等提供料1の算定回数\n・服薬情報等提供料2の算定回数\n・服薬情報等提供料3の算定回数\n\n医療機関への情報提供（トレーシングレポート等）の実績。「相当する実績」のため、算定していなくても情報提供の記録があれば含められる可能性あり。' },
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
      else if (c2Step.value === 3) { cJudgeHigher(); c2Step.value = 4 }
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

    const JUDGE_PAGES = {
      k_renkei: {
        title: '連携強化加算',
        source: 'docu/ 届出資料 p.18（表３）、別添3 p.4',
        desc: 'R8改定で施設基準の変更なし。R7で算定済みの場合、届出不要（表３）。新規算定の場合は届出が必要。',
        options: [
          { value: 0, label: '算定なし' },
          { value: 5, label: '加算（5点）' },
        ],
        checks: [
          { id: 'r7_santei', label: '【Step①】R7（令和7年度）で連携強化加算を算定していた', highlight: true },
          { id: 'kyotei', label: '第二種協定指定医療機関の指定を受けている' },
          { id: 'kenshu', label: '年1回以上、感染症に係る研修を実施している' },
          { id: 'kunren', label: '年1回以上、新興感染症対応訓練を実施している' },
          { id: 'dis_plan', label: '災害時の医薬品供給・地域衛生対応の計画を作成し実施している' },
          { id: 'dis_renkei', label: '地域の協議会、研修又は訓練等に参加している' },
          { id: 'shuuchi', label: '対応可能な体制を行政機関・薬剤師会等のHP等で周知している' },
          { id: 'saigai_mode', label: '災害時モード（オンライン資格確認等システム）の活用体制がある' },
        ],
      },
      k_dx8: {
        title: '電子的調剤情報連携体制整備加算',
        source: 'docu/ 改定概要 p.15',
        options: [
          { value: 0, label: '算定なし' },
          { value: 8, label: '加算（8点）' },
        ],
        checks: [
          { id: 'eshoho', label: '電子処方箋の応需体制が整備されている' },
          { id: 'dup_check', label: '電子処方箋による重複投薬等チェック機能が有効' },
          { id: 'inter_check', label: '相互作用チェック機能が有効' },
          { id: 'online', label: 'オンライン資格確認の導入' },
          { id: 'mainy', label: '電子薬歴への対応' },
        ],
      },
      k_zaitaku_taisei: {
        title: '在宅薬学総合体制加算',
        source: 'docu/ 改定概要 p.24',
        options: [
          { value: 0, label: '算定なし' },
          { value: 30, label: '加算1（30点）' },
          { value: 100, label: '加算2イ（100点）— 単一建物1人' },
          { value: 50, label: '加算2ロ（50点）— イ以外' },
        ],
        checks: [
          { id: 'zt_todoke', label: '在宅患者訪問薬剤管理指導を行う旨の届出' },
          { id: 'zt_48', label: '訪問薬剤管理指導の実績 48回以上/年' },
          { id: 'zt_offhour', label: '開局時間外における在宅業務対応体制' },
          { id: 'zt_shuuchi', label: '在宅業務実施体制に係る地域への周知' },
          { id: 'zt_kenshu', label: '在宅業務に関する研修（認知症・緩和・ターミナル）' },
          { id: 'zt_zairyo', label: '医療材料及び衛生材料の供給体制' },
          { id: 'zt_mayaku', label: '麻薬小売業者の免許' },
          { id: 'zt_kakaritsuke', label: '服薬管理指導料の届出' },
        ],
        checks2: [
          { id: 'zt2_all1', label: '加算1の施設基準を全て満たす' },
          { id: 'zt2_240', label: '個人宅の訪問薬剤指導実績 240回以上かつ2割以上、又は480回以上かつ1割以上' },
          { id: 'zt2_mayaku10', label: '訪問時の医療用麻薬に関する指導実績10回/年、又は無菌製剤処理加算1回/年、又は小児在宅6回/年' },
          { id: 'zt2_3nin', label: '常勤換算3名以上の薬剤師、開局時間中2名以上常駐' },
          { id: 'zt2_kodo', label: '高度管理医療機器販売業の許可' },
        ],
      },
      k_bio: {
        title: 'バイオ後続品調剤体制加算',
        source: 'docu/ 改定概要 p.25',
        options: [
          { value: 0, label: '算定なし' },
          { value: 50, label: '加算（50点）' },
        ],
        checks: [
          { id: 'bio_hokan', label: 'バイオ医薬品の適切な保管体制が整備されている' },
          { id: 'bio_setsu', label: '患者への適切な説明体制が整備されている' },
          { id: 'bio_80', label: 'バイオ後続品の使用割合が80%以上の成分が、調剤実績のある成分数の60%以上（望ましい）' },
          { id: 'bio_keiji', label: 'バイオ後続品の調剤を積極的に行っている旨の掲示' },
        ],
      },
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
    const judgePageIds = Object.keys(JUDGE_PAGES)

    return { sub, groups, isChecked, toggle, groupDone, groupPct, totalItems, doneItems, pct,
             jStep, jResult, jError, jApplied, j1Todokede, j1Shikichi, j2IsChain, j2GroupTotal, j3RxAnnual, j3RxMonths, j3RxCount, j3Conc, j3Top3Conc, j3SpecificRx, j3IsCity, j4IsNew, jJudge, jApplyToR8, jReset, jNext, jBack,
             cStep, c2Step, cKihonType, cKeikaSochi, cGe85actual, cRoOk, cBase, cBaseChecksA, cIchiOk, cBaseOk, cAimHigher, cInd, cIndLabels, cIndCount, cIndRxAnnual, cIndActual, cIndPer10k, cIndMet, cIndLoadR7, cIndClear, c2HelpModal, c2OpenHelp, c2CloseHelp, c2GetHelp, c2Facility, c2FacilityChecks, c2FacilityOk, c2FacHelpModal, c2FacOpenHelp, c2FacCloseHelp, c2FacGetHelp, c2FacGetLabel, cResult, cApplied, cError, cNext, cBack, cReset, c2Next, c2Back, c2Reset, cJudgeHigher, cApplyToR8,
             cHelpModal, openHelp, closeHelp, getHelp,
             JUDGE_PAGES, judgePageIds, jpChecked, jpToggle, jpSelectedOption, jpSelectOption, jpApply, jpApplied }
  },
  template: `<div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      <button class="btn" :class="{active:sub==='checklist'}" :style="sub==='checklist'?'background:var(--text);color:white':''" @click="sub='checklist'" style="font-size:12px;padding:6px 12px">チェックリスト</button>
      <button class="btn" :class="{active:sub==='k_kihon'}" :style="sub==='k_kihon'?'background:var(--teal);color:white':''" @click="sub='k_kihon'" style="font-size:12px;padding:6px 12px">調剤基本料</button>
      <button class="btn" :style="sub==='k_chiiki'?'background:var(--teal);color:white':''" @click="sub='k_chiiki'" style="font-size:12px;padding:6px 12px">地域支援・医薬品供給対応体制</button>
      <button v-for="pid in judgePageIds" :key="pid" class="btn" :style="sub===pid?'background:var(--teal);color:white':''" @click="sub=pid" style="font-size:12px;padding:6px 12px">{{JUDGE_PAGES[pid].title.replace(/加算$/,'').replace(/体制整備加算$/,'')}}</button>
    </div>
    <div v-if="sub==='checklist'">
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
    </div>
    <div v-if="sub==='k_kihon'">
      <div class="section">
        <div class="section-title">調剤基本料の施設基準 <span class="badge badge-modified">改定</span></div>
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
            <div style="font-weight:600;margin-bottom:6px">同一敷地内薬局ですか？（医療機関と不動産取引等の特別な関係があり、集中率50%超）</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="j1Shikichi" value="no">いいえ</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="j1Shikichi" value="yes">はい → 特別A（5点）</label>
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
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="jApplyToR8()">R8予測に反映</button>
            <button class="btn" @click="jReset()">最初からやり直す</button>
            <span v-if="jApplied" style="font-size:13px;color:var(--pos);font-weight:600">反映しました。シミュレータ→R8予測で確認できます。</span>
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
          <div>旧「地域支援体制加算」と「後発医薬品調剤体制加算」を統合。5段階に再編。</div>
          <div><strong>イ</strong> 医薬品の安定供給体制 + <strong>ロ</strong> 後発品85%以上 → 加算1（27点）</div>
          <div>加算1 + 地域医療への貢献実績 → 加算2～5</div>
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
            <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="cApplyToR8()">加算1（27点）をR8予測に反映</button>
            <button class="btn" @click="cReset()">最初からやり直す</button>
            <span v-if="cApplied && (!cResult || cResult.pts===27)" style="font-size:13px;color:var(--pos);font-weight:600">反映済み</span>
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
              <button v-if="cResult&&cResult.pts>27" class="btn" style="background:var(--pos);color:white;font-weight:600;padding:8px 24px" @click="cApplyToR8()">{{cResult.label}}をR8予測に反映</button>
              <button class="btn" @click="c2Reset()">最初からやり直す</button>
              <span v-if="cApplied && cResult && cResult.pts>27" style="font-size:13px;color:var(--pos);font-weight:600">反映済み</span>
            </div>
          </div>

          <div v-if="c2Step<4" style="margin-top:20px;display:flex;gap:8px">
            <button v-if="c2Step>1" class="btn" @click="c2Back()">戻る</button>
            <button class="btn" style="background:var(--teal);color:white;font-weight:600;padding:8px 24px" @click="c2Next()">次へ</button>
          </div>
        </template>
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
        <div v-if="JUDGE_PAGES[pid].checks.some(c=>c.id==='r7_santei') && jpChecked(pid,'r7_santei')" style="padding:12px;background:var(--green-l);border:1px solid var(--pos);border-radius:var(--radius);font-size:13px;color:var(--pos);margin-top:8px">R7で算定済み → R8改定で施設基準の変更なし。届出不要（表３）。引き続き算定可能。</div>
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
        <div class="section-title">R8予測に反映</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select class="fee-select" :value="jpSelectedOption(pid)" @change="jpSelectOption(pid, $event.target.value)">
            <option :value="null" disabled>選択してください</option>
            <option v-for="opt in JUDGE_PAGES[pid].options" :key="opt.value" :value="opt.value">{{opt.label}}</option>
          </select>
          <button class="btn" style="background:var(--pos);color:white;font-weight:600;padding:6px 16px" @click="jpApply(pid)">R8予測に反映</button>
          <span v-if="jpApplied(pid)" style="font-size:13px;color:var(--pos);font-weight:600">反映済み</span>
        </div>
      </div>
    </div></template>
  </div>`
}
