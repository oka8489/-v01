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
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/iryo_shido/r08_shinryohoshu_00001.html" target="_blank" style="color:var(--teal);text-decoration:underline">令和8年度診療報酬改定について（九州厚生局）</a><br>
    <a href="https://www.youtube.com/playlist?list=PLMG33RKISnWjFBIQEEGRuzwFbGAsk7uLD" target="_blank" style="color:var(--teal);text-decoration:underline">説明会動画（薬局：リスト番号1、18、21）</a><br>
    <a href="https://www.mhlw.go.jp/stf/newpage_71068.html" target="_blank" style="color:var(--teal);text-decoration:underline">説明会資料（薬局：資料番号0、18、19）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/000456078.pdf" target="_blank" style="color:var(--teal);text-decoration:underline">九州厚生局：令和8年度調剤報酬改定に伴う施設基準の届出等について</a><br>
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
    // 調剤基本料判定（ステップ式）
    const jStep = ref(1)
    const jResult = ref(null)
    // Step 1: 届出・敷地内
    const j1Todokede = ref('yes')  // yes/no
    const j1Shikichi = ref('no')   // yes/no
    // Step 2: チェーン薬局・グループ規模
    const j2IsChain = ref('no')  // yes/no
    const j2GroupTotal = ref(0)
    // Step 3: 受付回数・集中率
    const j3RxCount = ref(0)
    const j3Conc = ref(0)
    const j3Top3Conc = ref(0)
    const j3SpecificRx = ref(0)
    const j3IsCity = ref(false)
    // Step 4: 新規開設（減算）
    const j4IsNew = ref(false)
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
      j3RxCount.value = Math.round(annual / jMonths.value)
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
    const jApplied = ref(false)
    function jApplyToR8() {
      if (!jResult.value) return
      if (props.r8Data) {
        if (!props.r8Data.r6) props.r8Data.r6 = {}
        props.r8Data.r6['k_kihon'] = jResult.value.pts
        jApplied.value = true
      }
    }
    function jReset() { jStep.value = 1; jResult.value = null; jApplied.value = false }
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
        if (j3RxCount.value <= 0) { jError.value = '月あたり処方箋受付回数を入力してください'; return }
        jStep.value = 4
      } else if (jStep.value === 4) {
        jStep.value = 5; jJudge()
      }
    }
    function jBack() { if (jStep.value > 1 && jStep.value < 5) jStep.value-- ; else if (jStep.value === 5 && (j1Todokede.value === 'no' || j1Shikichi.value === 'yes')) jStep.value = 1; else if (jStep.value === 5) jStep.value = 4 }
    return { sub, groups, isChecked, toggle, groupDone, groupPct, totalItems, doneItems, pct, jStep, jResult, jError, jApplied, j1Todokede, j1Shikichi, j2IsChain, j2GroupTotal, j3RxCount, j3Conc, j3Top3Conc, j3SpecificRx, j3IsCity, j4IsNew, jJudge, jApplyToR8, jReset, jNext, jBack }
  },
  template: `<div>
    <div class="sub-tabs" style="margin-bottom:12px">
      <button class="sub-tab" :class="{active:sub==='checklist'}" @click="sub='checklist'">チェックリスト</button>
      <button class="sub-tab" :class="{active:sub==='judge'}" @click="sub='judge'">調剤基本料の判定</button>
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
    <div v-if="sub==='judge'">
      <div class="section">
        <div class="section-title">調剤基本料の施設基準（R8改定後）</div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">出典：令和8年度診療報酬改定の概要【調剤】p.13</p>
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
            <div style="font-weight:600;margin-bottom:6px">調剤基本料の届出をしますか？</div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:4px"><input type="radio" v-model="j1Todokede" value="yes">はい（届出する）</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" v-model="j1Todokede" value="no">いいえ（届出しない）→ 特別B（3点）</label>
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
          <table style="font-size:13px;width:100%;max-width:550px;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;width:260px">月あたり処方箋受付回数（自薬局）</td><td><input type="number" class="fee-input" style="max-width:120px" v-model.number="j3RxCount"> 回</td></tr>
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
  </div>`
}
