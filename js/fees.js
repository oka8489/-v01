// ====================================================================
// Constants
// ====================================================================
const POINT_TO_YEN = 10
const CHANGE_TYPES = {
  new: { label: '新設', class: 'badge-new' },
  abolished: { label: '廃止', class: 'badge-abolished' },
  abolished_merged: { label: '統合廃止', class: 'badge-abolished-merged' },
  modified: { label: '改定', class: 'badge-modified' },
  merged: { label: '統合', class: 'badge-merged' },
  renamed: { label: '名称変更', class: 'badge-renamed' },
  same: { label: '据置', class: 'badge-same' },
}

// ====================================================================
// Formatters
// ====================================================================
function formatYen(v) { return (v || 0).toLocaleString() }
function formatDiff(v) { if (v == null) return '-'; return (v >= 0 ? '+' : '') + v.toLocaleString() }
function formatDiffPercent(v) { if (v == null) return ''; return (v >= 0 ? '+' : '') + v.toFixed(2) + '%' }
function fmt(v) { if (v == null || v === '') return '0'; const n = Number(v); return isNaN(n) ? '0' : n.toLocaleString() }
function parseNum(s) { return Number(String(s).replace(/,/g, '')) || 0 }

// ====================================================================
// Fee Definitions
// ====================================================================
const BASIC_FEES = [
  {
    id: 'k_bukka', label: '調剤物価対応料', category: 'basic', inputType: 'fixed',
    changeType: 'new', changeNote: 'R8新設。処方箋受付1回につき1点、3月に1回算定可。R9年度は2点に引上げ予定。令和8年度以降の物価上昇に段階的に対応するための措置。',
    changePurpose: '医療材料費・光熱水費・委託費等の物件費高騰を踏まえ、薬局経営の安定を図るための物価対応措置。',
    r6: null,
  },
  {
    id: 'k_baseup', label: '調剤ベースアップ評価料', category: 'basic', inputType: 'select',
    changeType: 'new', changeNote: 'R8新設。処方箋受付1回につき4点。対象は40歳未満の薬局勤務薬剤師と事務職員。全額を賃金改善に充当が要件。R9年度は8点（200/100）に引上げ予定。',
    changePurpose: '薬剤師・事務職員の確実な賃上げ（R8・R9各年度+3.2%、事務職員+5.7%のベースアップ）を実現するための原資措置。',
    r6: null,
  },
  {
    id: 'k_kihon', label: '調剤基本料', category: 'basic', inputType: 'select',
    changeType: 'modified', changeNote: '面分業推進の観点から基本料1（45→47点）と3ハ（35→37点）を引上げ。基本料2の対象拡大: 都市部で600回超1,800回以下かつ集中率85%超の薬局が新たに対象（当面既存薬局は適用除外）。医療モール内の複数医療機関を1つとみなす集中率計算方法に変更。同一グループ300店舗以上の区分を撤廃（3ロ・3ハ統合）。特別Aは同一建物内診療所の除外規定を撤廃（32→7点）。都市部の新規開設薬局への門前薬局等立地依存減算（▲15点）を新設。',
    changePurpose: '薬局ビジョン策定後10年経過も門前薬局割合はむしろ増加。立地依存型経営から地域密着型への転換を促進し、面分業推進と都市部の新規門前出店を抑制。',
    r6: { options: [
      { value: 45, label: '基本料1（45点）' },
      { value: 29, label: '基本料2（29点）' },
      { value: 24, label: '基本料3イ（24点）' },
      { value: 19, label: '基本料3ロ（19点）' },
      { value: 35, label: '基本料3ハ（35点）' },
      { value: 32, label: '特別A（32点）' },
      { value: 5, label: '特別B（5点）' },
    ]},
  },
  {
    id: 'k_kihon_santei_nashi', label: '算定なし', category: 'basic', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 0 },
  },
  {
    id: 'k_kihon_doji', label: '調剤基本料※同時受付', category: 'basic', inputType: 'fixed',
    changeType: 'same',
    linkedTo: 'k_kihon', linkedRate: 0.8,
    r6: {},
  },
  {
    id: 'k_chiiki', label: '地域支援体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'merged', changeNote: '後発医薬品調剤体制加算と地域支援体制加算を統合し、地域支援・医薬品供給対応体制加算として5区分に再編。基本料1の薬局向けに加算1（27点）を新設、加算2（59点）/加算3（67点）を設定。基本料1以外の薬局向けに加算4（37点）/加算5（59点）を設定。後発品調剤割合85%以上が全区分の基本要件に。',
    changePurpose: '地域での医薬品供給を通じた適切な医療提供体制の充実を促進する観点から、後発品調剤体制と地域支援体制を一体的に評価する体系へ移行。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 32, label: '加算1（32点）' },
      { value: 40, label: '加算2（40点）' },
      { value: 10, label: '加算3（10点）' },
      { value: 32, label: '加算4（32点）' },
    ]},
  },
  {
    id: 'k_kouhatsu', label: '後発医薬品調剤体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged', changeNote: '地域支援・医薬品供給対応体制加算に統合され廃止。後発品調剤割合85%以上が統合先の基本要件として組み込まれた。経過措置R9.5.31まで算定可。R6: 加算1〜3（21/28/30点）。',
    changePurpose: '後発品使用促進の評価を地域支援体制と一体化し、地域の医薬品供給拠点としての総合的な体制評価へ移行。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 21, label: '加算1（21点）' },
      { value: 28, label: '加算2（28点）' },
      { value: 30, label: '加算3（30点）' },
    ]},
  },
  {
    id: 'k_renkei', label: '連携強化加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'same',
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 5, label: '加算（5点）' }] },
  },
  {
    id: 'k_dx8', label: '医療DX推進体制整備加算（8点）', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'merged', changeNote: '医療DX推進体制整備加算（8点/6点/10点の3区分）を廃止し、電子的調剤情報連携体制整備加算（8点・月1回）として一本化。電子処方箋システムによる重複投薬等チェック体制が要件に。',
    changePurpose: '医療DX推進の評価を電子処方箋・調剤情報連携の実装段階に移行し、DX加算体系を簡素化。重複投薬等チェック体制の構築を促進。',
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 8, label: '加算（8点）' }] },
  },
  {
    id: 'k_dx6', label: '医療DX推進体制整備加算（6点）', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged', changeNote: 'R8で電子的調剤情報連携体制整備加算（8点）に統合され廃止。',
    changePurpose: 'DX加算体系を簡素化し、電子処方箋・調剤情報連携の実装段階に一本化。',
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 6, label: '加算（6点）' }] },
  },
  {
    id: 'k_dx10', label: '医療DX推進体制整備加算（10点）', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged', changeNote: 'R8で電子的調剤情報連携体制整備加算（8点）に統合され廃止。',
    changePurpose: 'DX加算体系を簡素化し、電子処方箋・調剤情報連携の実装段階に一本化。',
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 10, label: '加算（10点）' }] },
  },
  {
    id: 'k_zaitaku_taisei', label: '在宅薬学総合体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'modified', changeNote: '加算1: 15→30点に倍増、加算2イ（個人宅）: 50→100点に倍増、加算2ロ（施設）: 50点据置。',
    changePurpose: '薬局による在宅医療提供体制の整備を促進し、個人宅への訪問薬剤管理を重点的に評価。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 15, label: '加算1（15点）' },
      { value: 50, label: '加算2（50点）' },
    ]},
  },
  {
    id: 'k_jikangai', label: '時間外加算', category: 'basic', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: {},
  },
  {
    id: 'k_yakan', label: '夜間・休日等加算', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 40 },
  },
  {
    id: 'k_bio', label: 'バイオ後続品調剤体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'new', changeNote: 'R8新設。バイオ後続品を調剤する体制を有する薬局に50点（バイオ後続品調剤時）。バイオ後続品の調剤割合が一定以上であることが施設基準。',
    changePurpose: 'バイオ後続品（バイオシミラー）の使用促進の観点から、調剤体制の整備を評価し医療費適正化を図る。',
    r6: null,
  },
]

const PREPARATION_FEES = [
  {
    id: 'naifuku', label: '内服', category: 'preparation', inputType: 'fixed',
    unit: '1剤につき（3剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 24 },
  },
  {
    id: 'sinsenn', label: '浸煎', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    noCntInPdf: true,
    r6: { fixedPoints: 24 },
  },
  {
    id: 'yuyaku', label: '湯薬', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    noCntInPdf: true,
    r6: { fixedPoints: 190 },
  },
  {
    id: 'tonpuku', label: '屯服', category: 'preparation', inputType: 'fixed',
    unit: '処方箋受付1回につき',
    changeType: 'same',
    r6: { fixedPoints: 21 },
  },
  {
    id: 'gaiyou', label: '外用', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 10 },
  },
  {
    id: 'chusya', label: '注射', category: 'preparation', inputType: 'fixed',
    unit: '1処方箋につき',
    changeType: 'same',
    r6: { fixedPoints: 26 },
  },
  {
    id: 'naiteki', label: '内滴', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき',
    changeType: 'same',
    r6: { fixedPoints: 10 },
  },
  {
    id: 'zairyo', label: '材料', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
  // 薬剤料（薬価改定で変動）
  {
    id: 'yakuzai_total', label: '薬剤料', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
  // 薬剤調製料加算
  {
    id: 'kaz_mayaku', label: '麻薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 70 },
  },
  {
    id: 'kaz_doku', label: '毒薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
  },
  {
    id: 'kaz_kakusei', label: '覚醒剤原料加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
  },
  {
    id: 'kaz_mukyoko', label: '向精神薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
  },
  {
    id: 'kaz_keiryo', label: '計量混合加算', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
  {
    id: 'kaz_keiryo_yo', label: '計量混合加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
  },
  {
    id: 'kaz_jika', label: '自家製剤加算', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
  {
    id: 'kaz_jika_yo', label: '自家製剤加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 10 },
  },
  {
    id: 'kaz_mukin', label: '無菌製剤処理加算', category: 'preparation', inputType: 'select',
    changeType: 'modified', changeNote: '無菌製剤処理加算の増点対象を6歳未満から15歳未満の小児に拡大。中心静脈栄養法の15歳未満: 137→237点に引上げ。基本点数80点は据置。',
    changePurpose: '小児在宅医療（特に小児がん治療等）における薬局の貢献を評価し、対象年齢拡大で小児医療の充実を図る。',
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 80, label: '80点' }] },
  },
  {
    id: 'kaz_jikou', label: '時間外加算（調製料）', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
]

const MANAGEMENT_FEES = [
  {
    id: 't_kanri_nai', label: '調剤管理料（内服）', category: 'management', inputType: 'count-only',
    changeType: 'modified', changeNote: '調剤管理料の日数区分を4区分（7日以下4点/8-14日28点/15-28日50点/29日以上60点）から2区分（27日以下10点/28日以上60点）に統合。調剤管理加算も廃止。重複投薬・相互作用等防止加算を廃止し、調剤時残薬調整加算・薬学的有害事象等防止加算に再編。',
    changePurpose: '調剤管理料の算定体系を簡素化し事務負担を軽減するとともに、残薬調整・薬学的有害事象防止の評価を独立化して対人業務を充実。',
    r6: {},
  },
  {
    id: 't_kanri_7', label: '7日以下', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: '4→10点。旧4区分の7日以下・8-14日・15-28日を「27日以下」に統合。短期処方の管理料を一律10点に簡素化。', changePurpose: '日数区分の簡素化により算定事務を軽減し、短期処方の管理を統一的に評価。', isDetail: true, needsDb: true,
    r6: { fixedPoints: 4 },
  },
  {
    id: 't_kanri_8_14', label: '8-14日', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: '28→10点。旧8-14日区分を「27日以下」に統合。長期処方推進に伴い短期処方の評価を統一。', changePurpose: '日数区分の簡素化により算定事務を軽減し、長期処方・リフィル処方の取組強化に対応。', isDetail: true, needsDb: true,
    r6: { fixedPoints: 28 },
  },
  {
    id: 't_kanri_15_28', label: '15-28日', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: '50→10点。旧15-28日区分を「27日以下」に統合。大幅な減点だが長期処方（28日以上60点）との二区分化で体系を簡素化。', changePurpose: '日数区分の簡素化により算定事務を軽減し、長期処方・リフィル処方の取組強化に対応。', isDetail: true, needsDb: true,
    r6: { fixedPoints: 50 },
  },
  {
    id: 't_kanri_29', label: '29日以上', category: 'management', inputType: 'fixed',
    changeType: 'same', isDetail: true, needsDb: true,
    r6: { fixedPoints: 60 },
  },
  {
    id: 't_kanri_gaiyou', label: '調剤管理料（内服以外）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 4 },
  },
  {
    id: 't_chmgr_kazan', label: '調剤管理加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished',
    r6: { fixedPoints: 3 },
  },
  {
    id: 't_jufuku_other', label: '重複防止加算（残薬以外）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged', changeNote: '重複投薬・相互作用等防止加算を廃止し、薬学的有害事象等防止加算（30/50点）に発展的再編。R6は40点。処方変更に繋がる疑義照会等の薬学的介入をより広く評価する体系に。',
    changePurpose: '重複投薬等防止の評価を薬学的有害事象防止として再定義し、薬剤師による積極的な処方介入を促進。',
    r6: { fixedPoints: 40 },
  },
  {
    id: 't_yugai', label: '薬学的有害事象等防止加算', category: 'management', inputType: 'select', isSub: true,
    changeType: 'new', changeNote: 'R8新設。旧「重複投薬・相互作用等防止加算（残薬以外）」を発展的に再編。重複投薬・相互作用・副作用等の薬学的有害事象防止に係る介入内容により30点または50点。',
    changePurpose: '薬学的有害事象（重複投薬・相互作用・副作用等）の防止に向けた薬剤師の積極的介入と処方変更に繋がる疑義照会を推進。',
    r6: null,
  },
  {
    id: 't_jufuku_zan', label: '重複防止加算（残薬）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged', changeNote: '重複投薬・相互作用等防止加算（残薬）を廃止し、調剤時残薬調整加算（30/50点）に発展的再編。R6は20点。処方箋上での減数調剤指示を可能とする様式見直しと連動。',
    changePurpose: '残薬対策の強化を目的に評価を独立化し、残薬量を勘案した減数調剤等の積極的な取組みを促進。',
    r6: { fixedPoints: 20 },
  },
  {
    id: 't_zanyaku', label: '調剤時残薬調整加算', category: 'management', inputType: 'select', isSub: true,
    changeType: 'new', changeNote: 'R8新設。旧「重複投薬・相互作用等防止加算（残薬）」を発展的に再編。残薬調整の内容により30点または50点。処方箋上で残薬量を勘案した減数調剤指示が可能となる様式見直しと連動。',
    changePurpose: '残薬対策の強化を目的に評価を独立化し、薬剤師による積極的な残薬調整と服薬アドヒアランス向上を促進。',
    r6: null,
  },
  {
    id: 't_iryo_joho', label: '医療情報取得加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged', changeNote: 'R8で廃止。医療情報取得加算1・2ともに電子的調剤情報連携体制整備加算（8点・月1回）に統合。R6は1点。マイナ保険証の普及に伴う整理。',
    changePurpose: 'マイナ保険証の普及を踏まえ、医療情報取得の評価を電子的調剤情報連携体制の中に包含して一本化。',
    r6: { fixedPoints: 1 },
  },
  {
    id: 't_jikangai_kanri', label: '時間外加算（調剤管理料）', category: 'management', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: {},
  },
  {
    id: 't_fukuyaku_a', label: '服薬管理指導料1（3月以内・手帳あり）', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'かかりつけ薬剤師指導料（76点）・包括管理料（291点）の廃止に伴い、服薬管理指導料1イ（かかりつけ薬剤師）/1ロ（その他）に再編。点数45点は据置。',
    changePurpose: 'かかりつけ薬剤師の包括的評価を廃止し、フォローアップ加算（50点）・訪問加算（230点）等の実績に応じた評価体系へ転換。',
    r6: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_b', label: '服薬管理指導料2（3月以内・手帳なし→2で算定）', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'R6では3月以内でも手帳なしは2（59点）で算定。R8では1イ/1ロ・2イ/2ロのかかりつけ薬剤師区分を新設。',
    changePurpose: 'かかりつけ薬剤師の包括的評価から実績重視の評価への転換に伴う体系再編。',
    r6: { fixedPoints: 59 },
  },
  {
    id: 't_fukuyaku_c', label: '服薬管理指導料2（3月超）', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'R8では服薬管理指導料2イ（かかりつけ薬剤師）/2ロ（その他）に再編。点数59点は据置。', changePurpose: 'かかりつけ薬剤師の包括的評価から実績重視の評価への転換に伴う体系再編。',
    r6: { fixedPoints: 59 },
  },
  {
    id: 't_fukuyaku_3', label: '服薬管理指導料3（介護施設入所者）', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'R8で服薬管理指導料3に名称変更。点数45点は据置。', changePurpose: '服薬管理指導料の体系再編に伴い、特養入居者向けを服薬管理指導料3として整理。',
    r6: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_online', label: '服薬管理指導料4イ（情報通信・3月以内）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_online_ro_r6', label: '服薬管理指導料4ロ（情報通信・4イ以外）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 59 },
  },
  {
    id: 't_fukuyaku_renkei', label: '服薬管理指導料（注14特例・連携薬剤師）', category: 'management', inputType: 'count-only',
    changeType: 'abolished_merged', changeNote: 'R8で廃止。R6ではかかりつけ薬剤師が不在時に同一薬局の他の薬剤師が連携して指導した場合の特例（59点）。かかりつけ薬剤師指導料の廃止に伴いこの特例も廃止。R8では1ロ・2ロ（かかりつけ薬剤師以外）で算定。',
    changePurpose: 'かかりつけ薬剤師指導料の廃止に伴い、連携薬剤師の特例も不要となり廃止。',
    r6: {},
  },
  {
    id: 't_kakaritsuke_shido', label: 'かかりつけ薬剤師指導料', category: 'management', inputType: 'fixed',
    changeType: 'abolished_merged', changeNote: 'R8で廃止（76点）。代わりに服薬管理指導料に1イ/2イ（かかりつけ薬剤師）区分を新設し、フォローアップ加算（50点）・訪問加算（230点）で実績を評価する体系に転換。',
    changePurpose: 'かかりつけ薬剤師の包括的評価を廃止し、電話等による患者フォローアップや残薬調整に係る患家訪問等の実務に対する実績重視の評価へ転換。',
    r6: { fixedPoints: 76 },
  },
  {
    id: 't_kakaritsuke_hokatsu', label: 'かかりつけ薬剤師包括管理料', category: 'management', inputType: 'fixed',
    changeType: 'abolished_merged', changeNote: 'R8で廃止（291点）→1イ・2イで算定。医療機関で地域包括診療加算等を算定している患者に対し、かかりつけ薬剤師が指導した場合に調剤基本料・調製料・管理料等を包括して算定する仕組みだった。廃止後は通常通り各項目を個別算定。',
    changePurpose: 'かかりつけ薬剤師の包括的評価を廃止し、実績重視の評価へ転換。',
    r6: { fixedPoints: 291 },
  },
  {
    id: 't_kakaritsuke_fu', label: 'かかりつけ薬剤師フォローアップ加算', category: 'management', inputType: 'fixed',
    changeType: 'new', changeNote: 'R8新設。かかりつけ薬剤師指導料・包括管理料の廃止に伴い、実績重視の評価として新設。かかりつけ薬剤師が服薬後に電話・ICT等でフォローアップを行った場合に50点。3月に1回。',
    changePurpose: 'かかりつけ薬剤師の包括的評価から実績重視の評価への転換の一環として、服薬後のフォローアップ実務を個別に評価。',
    r6: null,
  },
  {
    id: 't_kakaritsuke_houmon', label: 'かかりつけ薬剤師訪問加算', category: 'management', inputType: 'fixed',
    changeType: 'new', changeNote: 'R8新設。かかりつけ薬剤師が患家を訪問し、残薬整理・服薬管理指導を実施し医療機関に情報提供した場合に230点。6月に1回。',
    changePurpose: 'かかりつけ薬剤師の包括的評価から実績重視の評価への転換の一環として、在宅訪問の実務を個別に評価。',
    r6: null,
  },
  {
    id: 't_mayaku_kanri', label: '麻薬管理指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 22 },
  },
  {
    id: 't_tokutei_1i', label: '特定薬剤管理指導加算1イ（ハイリスク新規）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 10 },
  },
  {
    id: 't_tokutei_1ro', label: '特定薬剤管理指導加算1ロ（ハイリスク変更）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 5 },
  },
  {
    id: 't_tokutei_2', label: '特定薬剤管理指導加算2（抗悪性腫瘍）', category: 'management', inputType: 'select', isSub: true,
    changeType: 'same',
    judgeInfo: { title: '特定薬剤管理指導加算2', desc: '届出が必要（地域支援・医薬品供給対応体制加算）', checks: ['連携充実加算を届け出ている医療機関で抗悪性腫瘍剤を注射された患者が対象', 'レジメン等を確認し薬学的管理・指導を実施', '電話等で副作用・服薬状況を確認', '確認結果を医療機関に文書で情報提供', '月1回に限り算定（処方箋受付がない月でも算定可）'] },
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 100, label: '加算（100点）' }] },
  },
  {
    id: 't_tokutei_3i', label: '特定薬剤管理指導加算3イ（RMP）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 5 },
  },
  {
    id: 't_tokutei_3ro', label: '特定薬剤管理指導加算3ロ（選定療養等）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'modified',
    changeNote: 'R8でバイオ後続品の選択に係る説明を算定対象に追加。点数10点は据置。',
    changePurpose: 'バイオ後続品の使用促進に向け、薬剤師による患者への適切な説明を評価。',
    r6: { fixedPoints: 10 },
  },
  {
    id: 't_nyuyoji', label: '乳幼児服薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 12 },
  },
  {
    id: 't_shoni', label: '小児特定加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 350 },
  },
  {
    id: 't_kyunyu', label: '吸入薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'modified', changeNote: 'R8で評価対象にインフルエンザの吸入薬を追加。30点/6月に1回。点数は据置。COPD・気管支喘息に加え吸入薬全般への対応を拡大。',
    changePurpose: '吸入薬指導の対象をインフルエンザ吸入薬等に拡大し、薬剤師による吸入療法の適切な指導を推進。',
    r6: { fixedPoints: 30 },
  },
  {
    id: 't_chozai_go', label: '調剤後薬剤管理指導料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 60 },
  },
  {
    id: 't_joho_1', label: '服薬情報等提供料1（医師の求め）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 30 },
  },
  {
    id: 't_joho_2', label: '服薬情報等提供料2（医療機関等へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
  },
  {
    id: 't_joho_3', label: '服薬情報等提供料3（入院予定先へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 50 },
  },
  {
    id: 't_gairai_1', label: '外来服薬支援料1（服薬整理）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 185 },
  },
  {
    id: 't_gairai_2', label: '外来服薬支援料2（一包化）', category: 'management', inputType: 'count-only',
    changeType: 'same',
    r6: {},
  },
  {
    id: 't_shisetsu_renkei', label: '施設連携加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 50 },
  },
  {
    id: 't_choseihi_1', label: '服用薬剤調整支援料1', category: 'management', inputType: 'fixed',
    description: '2種以上減薬',
    changeType: 'same',
    r6: { fixedPoints: 125 },
  },
  {
    id: 't_choseihi_2', label: '服用薬剤調整支援料2', category: 'management', inputType: 'select',
    description: '医師へ減薬提案',
    changeType: 'same',
    judgeInfo: { title: '服用薬剤調整支援料2', desc: 'イ: かかりつけ薬剤師の届出をしている薬局（110点）\nロ: イ以外（90点）', checks: ['複数の医療機関から6種類以上の内服薬が処方されている患者が対象', '患者又は家族等の求めに応じて実施', '服用中の薬剤を一元的に把握し、重複投薬等が確認された場合に処方医に文書で提案', '3月に1回に限り算定', 'イの届出: かかりつけ薬剤師の施設基準（様式90）の届出があればイで算定可能'] },
    r6: { options: [{ value: 0, label: '算定なし' }, { value: 110, label: 'イ かかりつけ届出あり（110点）' }, { value: 90, label: 'ロ イ以外（90点）' }] },
  },
  {
    id: 't_choseihi_2_r9', label: '服用薬剤調整支援料2（R9年6月以降算定）', category: 'management', inputType: 'fixed', isDetail: true,
    disabled: true,
    changeType: 'modified',
    changeNote: '110点→1,000点に大幅増点（R9年6月1日から適用）。かかりつけ薬剤師（研修修了者に限る）が薬物療法最適化サイクルを実践し処方医に文書で提案した場合に算定。',
    changePurpose: 'MRP/DRP特定→推奨案提示→アウトカムモニターの薬物療法最適化サイクルの実践を促進。',
    r6: null,
  },
  {
    id: 't_keikan', label: '経管投薬支援料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 100 },
  },
  // R8 廃止（kakaritsuke_shido, kakaritsuke_hokatsu は上の特2A/2Bの後に移動済み）
]

const HOMECARE_FEES = [
  {
    id: 't_zaitaku_houmon_1', label: '在宅患者訪問薬剤管理指導料（単一1人）', category: 'homecare', inputType: 'fixed',
    changeType: 'modified',
    changeNote: '算定間隔を中6日以上→週1回に見直し。夜間休日の連絡体制整備を要件に追加。点数650点は据置。',
    changePurpose: '在宅医療の推進に伴い、柔軟な訪問スケジュールを可能にする。',
    r6: { fixedPoints: 650 },
  },
  {
    id: 't_zaitaku_houmon_2', label: '在宅患者訪問薬剤管理指導料（1人以外）', category: 'homecare', inputType: 'count-only',
    changeType: 'modified',
    changeNote: '算定間隔を中6日以上→週1回に見直し。夜間休日の連絡体制整備を要件に追加。点数320点/290点は据置。',
    changePurpose: '在宅医療の推進に伴い、柔軟な訪問スケジュールを可能にする。',
    r6: { pointsNote: '320点/290点' },
  },
  {
    id: 't_kinkyu_houmon_1', label: '在宅患者緊急訪問薬剤管理指導料1', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 500 },
  },
  {
    id: 't_kinkyu_houmon_2', label: '在宅患者緊急訪問薬剤管理指導料2', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 200 },
  },
  {
    id: 't_kinkyu_kyodo', label: '在宅患者緊急時等共同服薬指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 700 },
  },
  {
    id: 't_zaitaku_online', label: '在宅患者オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'abolished_merged',
    r6: { fixedPoints: 59 },
  },
  {
    id: 't_zaitaku_kinkyu_online', label: '在宅患者緊急オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'abolished_merged',
    r6: { fixedPoints: 59 },
  },
  {
    id: 't_zaitaku_mayaku', label: '麻薬管理加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 100 },
  },
  {
    id: 't_zaitaku_nyuyoji', label: '乳幼児加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 100 },
  },
  {
    id: 't_zaitaku_shoni', label: '小児特定加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 350 },
  },
  {
    id: 't_zaitaku_mayaku_chu', label: '医療用麻薬持続注射療法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 250 },
  },
  {
    id: 't_zaitaku_chushin', label: '在宅中心静脈栄養法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 150 },
  },
  {
    id: 't_yakan_homon', label: '夜間訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 400 },
  },
  {
    id: 't_kyujitsu_homon', label: '休日訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 600 },
  },
  {
    id: 't_shinya_homon', label: '深夜訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 1000 },
  },
  {
    id: 't_zaitaku_boushi', label: '在宅患者重複投薬等管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
  },
  {
    id: 't_taiin_kyodo', label: '退院時共同指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 600 },
  },
  {
    id: 't_zaitaku_ikou', label: '在宅移行初期管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 230 },
  },
  // R8 新設（在宅）
  {
    id: 't_fukusu_houmon', label: '複数名薬剤管理指導訪問料', category: 'homecare', inputType: 'select',
    changeType: 'new', changeNote: 'R8新設。複数の薬剤師が同時に患家を訪問して薬剤管理指導を行った場合に300点。在宅訪問薬剤管理指導の促進策の一つとして新設。',
    changePurpose: '複雑な薬物療法を受ける在宅患者への手厚い支援体制を構築し、薬局薬剤師による在宅訪問を促進。',
    r6: null,
  },
]

const LONGTERM_FEES = [
  {
    id: 'k_kaigo_kyotaku_1', label: '薬剤師居宅療養管理指導費Ⅱ（1人・1棟）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 518 },
  },
  {
    id: 'k_kaigo_kyotaku_2', label: '薬剤師居宅療養管理指導費Ⅱ（2-9人）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 379 },
  },
  {
    id: 'k_kaigo_kyotaku_3', label: '薬剤師居宅療養管理指導費Ⅱ（10人以上）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 342 },
  },
  {
    id: 'k_kaigo_tsushin', label: '薬剤師居宅療養管理指導費Ⅱ（通信機器）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 46 },
  },
  {
    id: 'k_kaigo_yobo_kyotaku_1', label: '介護予防居宅療養管理指導費Ⅱ（1人・1棟）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 518 },
  },
  {
    id: 'k_kaigo_chushin', label: '介護中心静脈栄養法加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 150 },
  },
  {
    id: 'k_kaigo_mayaku', label: '介護麻薬管理加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 100 },
  },
]

const ALL_FEES = [
  ...BASIC_FEES,
  ...PREPARATION_FEES,
  ...MANAGEMENT_FEES,
  ...HOMECARE_FEES,
  ...LONGTERM_FEES,
]
