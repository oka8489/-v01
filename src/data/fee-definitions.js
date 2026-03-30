// ====================================================================
// 報酬項目定義 - R6/R8 全項目
// inputType: 'select' | 'fixed' | 'count-only'
// changeType: 'new' | 'abolished' | 'modified' | 'merged' | 'renamed' | 'same'
// r6/r8: null = その改定には存在しない
// ====================================================================

// A. 調剤基本料・体制加算
export const BASIC_FEES = [
  {
    id: 'kihon', label: '調剤基本料', category: 'basic', inputType: 'select',
    changeType: 'modified', changeNote: '基本料1: 45→47点。集中率厳格化。',
    r6: { options: [
      { value: 45, label: '基本料1（45点）' },
      { value: 29, label: '基本料2（29点）' },
      { value: 24, label: '基本料3イ（24点）' },
      { value: 19, label: '基本料3ロ（19点）' },
      { value: 35, label: '基本料3ハ（35点）' },
      { value: 32, label: '特別A（32点）' },
      { value: 5, label: '特別B（5点）' },
    ]},
    r8: { options: [
      { value: 47, label: '基本料1（47点）' },
      { value: 30, label: '基本料2（30点）' },
      { value: 25, label: '基本料3イ（25点）' },
      { value: 20, label: '基本料3ロ（20点）' },
      { value: 37, label: '基本料3ハ（37点）' },
      { value: 7, label: '特別A（7点）' },
      { value: 5, label: '特別B（5点）' },
    ]},
  },
  {
    id: 'kihon_santei_nashi', label: '算定なし', category: 'basic', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  {
    id: 'kihon_doji', label: '調剤基本料※同時受付', category: 'basic', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 36 },
    r8: { fixedPoints: 37, label: '同時受付（37点）' },
  },
  {
    id: 'chiiki', label: '地域支援体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'merged', changeNote: 'R8で後発品加算と統合→地域支援・医薬品供給対応体制加算に再編。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 32, label: '加算1（32点）' },
      { value: 40, label: '加算2（40点）' },
      { value: 10, label: '加算3（10点）' },
      { value: 32, label: '加算4（32点）' },
    ]},
    r8: { label: '地域支援・医薬品供給対応体制加算', options: [
      { value: 0, label: '算定なし' },
      { value: 27, label: '加算1（27点）' },
      { value: 59, label: '加算2（59点）' },
      { value: 67, label: '加算3（67点）' },
      { value: 37, label: '加算4（37点）' },
    ]},
  },
  {
    id: 'kouhatsu', label: '後発医薬品調剤体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished', changeNote: '地域支援・医薬品供給対応体制加算に統合。経過措置R9.5.31まで。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 21, label: '加算1（21点）' },
      { value: 28, label: '加算2（28点）' },
      { value: 30, label: '加算3（30点）' },
    ]},
    r8: null,
  },
  {
    id: 'renkei', label: '連携強化加算', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 5 },
    r8: { fixedPoints: 5 },
  },
  {
    id: 'dx8', label: '医療DX推進体制整備加算（8点）', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'modified', changeNote: 'R8で電子的調剤情報連携体制整備加算に名称変更。',
    r6: { fixedPoints: 8 },
    r8: { fixedPoints: 7, label: '電子的調剤情報連携体制整備加算（7点）' },
  },
  {
    id: 'dx6', label: '医療DX推進体制整備加算（6点）', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'modified',
    r6: { fixedPoints: 6 },
    r8: null,
  },
  {
    id: 'dx10', label: '医療DX推進体制整備加算（10点）', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'modified',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 6, label: '電子的調剤情報連携体制整備加算（6点）' },
  },
  {
    id: 'zaitaku_taisei', label: '在宅薬学総合体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'modified', changeNote: '15点→3区分（30/100/50点）に再編。要件強化。',
    r6: { options: [
      { value: 0, label: '算定なし' },
      { value: 15, label: '加算（15点）' },
    ]},
    r8: { options: [
      { value: 0, label: '算定なし' },
      { value: 30, label: '加算1（30点）' },
      { value: 100, label: '加算2イ（100点）' },
      { value: 50, label: '加算2ロ（50点）' },
    ]},
  },
  {
    id: 'jikangai', label: '時間外加算', category: 'basic', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  {
    id: 'yakan', label: '夜間・休日等加算', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 40 },
    r8: { fixedPoints: 40 },
  },
  {
    id: 'bukka', label: '調剤物価対応料', category: 'basic', inputType: 'fixed',
    changeType: 'new', changeNote: '1点。3月に1回算定可。',
    r6: null,
    r8: { fixedPoints: 1, frequency: '3月に1回' },
  },
  {
    id: 'baseup', label: '調剤ベースアップ評価料', category: 'basic', inputType: 'fixed',
    changeType: 'new', changeNote: '4点（R9: 8点予定）。',
    r6: null,
    r8: { fixedPoints: 4 },
  },
  {
    id: 'bio', label: 'バイオ後続品調剤体制加算', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'new', changeNote: '50点。バイオ後続品の適切な使用推進。',
    r6: null,
    r8: { fixedPoints: 50 },
  },
]

// B. 薬剤調製料
export const PREPARATION_FEES = [
  {
    id: 'naifuku', label: '内服', category: 'preparation', inputType: 'fixed',
    unit: '1剤につき（3剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 24 },
    r8: { fixedPoints: 24 },
  },
  {
    id: 'sinsenn', label: '浸煎', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 24 },
    r8: { fixedPoints: 24 },
  },
  {
    id: 'yuyaku', label: '湯薬', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 190 },
    r8: { fixedPoints: 190 },
  },
  {
    id: 'tonpuku', label: '屯服', category: 'preparation', inputType: 'fixed',
    unit: '処方箋受付1回につき',
    changeType: 'same',
    r6: { fixedPoints: 21 },
    r8: { fixedPoints: 21 },
  },
  {
    id: 'gaiyou', label: '外用', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）',
    changeType: 'same',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 10 },
  },
  {
    id: 'chusya', label: '注射', category: 'preparation', inputType: 'fixed',
    unit: '1処方箋につき',
    changeType: 'same',
    r6: { fixedPoints: 26 },
    r8: { fixedPoints: 26 },
  },
  {
    id: 'naiteki', label: '内滴', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき',
    changeType: 'same',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 10 },
  },
  {
    id: 'zairyo', label: '材料', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  // 薬剤調製料加算
  {
    id: 'kaz_mayaku', label: '麻薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 70 },
    r8: { fixedPoints: 70 },
  },
  {
    id: 'kaz_doku', label: '毒薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_kakusei', label: '覚醒剤原料加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_mukyoko', label: '向精神薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 8 },
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_keiryo', label: '計量混合加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 45 },
    r8: { fixedPoints: 45 },
  },
  {
    id: 'kaz_keiryo_yo', label: '計量混合加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
    r8: { fixedPoints: 20 },
  },
  {
    id: 'kaz_jika', label: '自家製剤加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
    r8: { fixedPoints: 20 },
  },
  {
    id: 'kaz_jika_yo', label: '自家製剤加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 10 },
  },
  {
    id: 'kaz_mukin', label: '無菌製剤処理加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 80 },
    r8: { fixedPoints: 80 },
  },
  {
    id: 'kaz_jikou', label: '時間外加算（調製料）', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
]

// C. 薬学管理料
export const MANAGEMENT_FEES = [
  {
    id: 'kanri_nai', label: '調剤管理料（内服）', category: 'management', inputType: 'count-only',
    changeType: 'modified', changeNote: 'R6の4区分→R8は2区分に統合',
    r6: {}, r8: {},
  },
  {
    id: 'kanri_7', label: '7日以下', category: 'management', inputType: 'fixed',
    changeType: 'modified', isDetail: true,
    r6: { fixedPoints: 4 },
    r8: { fixedPoints: 10, label: '27日以下（10点）' },
  },
  {
    id: 'kanri_8_14', label: '8-14日', category: 'management', inputType: 'fixed',
    changeType: 'modified', isDetail: true,
    r6: { fixedPoints: 28 },
    r8: { fixedPoints: 10, label: '27日以下（10点）' },
  },
  {
    id: 'kanri_15_28', label: '15-28日', category: 'management', inputType: 'fixed',
    changeType: 'modified', isDetail: true,
    r6: { fixedPoints: 50 },
    r8: { fixedPoints: 10, label: '27日以下（10点）' },
  },
  {
    id: 'kanri_29', label: '29日以上', category: 'management', inputType: 'fixed',
    changeType: 'same', isDetail: true,
    r6: { fixedPoints: 60 },
    r8: { fixedPoints: 60 },
  },
  {
    id: 'kanri_gaiyou', label: '調剤管理料（内服以外）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 4 },
    r8: { fixedPoints: 4 },
  },
  {
    id: 'chmgr_kazan', label: '調剤管理加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 3 },
    r8: { fixedPoints: 3 },
  },
  {
    id: 'jufuku_other', label: '重複防止加算（残薬以外）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished', changeNote: '薬学的有害事象等防止加算に再編。',
    r6: { fixedPoints: 40 },
    r8: null,
  },
  {
    id: 'jufuku_zan', label: '重複防止加算（残薬）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished', changeNote: '調剤時残薬調整加算に再編。',
    r6: { fixedPoints: 30 },
    r8: null,
  },
  {
    id: 'iryo_joho', label: '医療情報取得加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished', changeNote: '電子的調剤情報連携体制整備加算に統合。',
    r6: { fixedPoints: 1 },
    r8: null,
  },
  {
    id: 'jikangai_kanri', label: '時間外加算（調剤管理料）', category: 'management', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: {}, r8: {},
  },
  {
    id: 'fukuyaku_a', label: '服薬管理指導料（薬A）手帳あり3月以内', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'R8で1イ/1ロに再編。',
    r6: { fixedPoints: 45 },
    r8: { fixedPoints: 45, label: '服薬管理指導料 1イ/1ロ（45点）' },
  },
  {
    id: 'fukuyaku_b', label: '服薬管理指導料（薬B）手帳なし3月以内', category: 'management', inputType: 'fixed',
    changeType: 'modified', changeNote: 'R8で2イ/2ロに再編。',
    r6: { fixedPoints: 59 },
    r8: { fixedPoints: 59, label: '服薬管理指導料 2イ/2ロ（59点）' },
  },
  {
    id: 'fukuyaku_c', label: '服薬管理指導料（薬C）3月以外', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 59 },
    r8: { fixedPoints: 59, label: '服薬管理指導料 2イ/2ロ（59点）' },
  },
  {
    id: 'fukuyaku_3', label: '服薬管理指導料（薬3）特養入居者', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 45 },
    r8: { fixedPoints: 45, label: '服薬管理指導料 3（45点）' },
  },
  {
    id: 'fukuyaku_online', label: '服薬管理指導料（オンライン服薬指導）', category: 'management', inputType: 'fixed',
    r6: { fixedPoints: 45 },
    r8: { fixedPoints: 45 },
  },
  {
    id: 'fukuyaku_toku2a', label: '服薬管理指導料（特2A/2B）連携薬剤師', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r6: { fixedPoints: 59 },
    r8: null,
  },
  {
    id: 'kakaritsuke_shido', label: 'かかりつけ薬剤師指導料', category: 'management', inputType: 'fixed',
    changeType: 'abolished', changeNote: '服薬管理指導料1イ/2イに統合。',
    r6: { fixedPoints: 76 },
    r8: null,
  },
  {
    id: 'mayaku_kanri', label: '麻薬管理指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 22 },
    r8: { fixedPoints: 22, frequency: '※R6: 22点' },
  },
  {
    id: 'tokutei_1i', label: '特定薬剤管理指導加算1イ（ハイリスク新規）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 10 },
  },
  {
    id: 'tokutei_1ro', label: '特定薬剤管理指導加算1ロ（変更時）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 5 },
    r8: { fixedPoints: 5 },
  },
  {
    id: 'tokutei_2', label: '特定薬剤管理指導加算2（抗悪性腫瘍）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 100 },
    r8: { fixedPoints: 100 },
  },
  {
    id: 'tokutei_3i', label: '特定薬剤管理指導加算3イ（RMP）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 5 },
    r8: { fixedPoints: 5 },
  },
  {
    id: 'tokutei_3ro', label: '特定薬剤管理指導加算3ロ（選定療養等）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 10 },
    r8: { fixedPoints: 10 },
  },
  {
    id: 'nyuyoji', label: '乳幼児服薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 12 },
    r8: { fixedPoints: 12 },
  },
  {
    id: 'shoni', label: '小児特定加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 350 },
    r8: { fixedPoints: 350 },
  },
  {
    id: 'kyunyu', label: '吸入薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'modified', changeNote: '対象疾患拡大。30点/6月に1回。',
    r6: { fixedPoints: 30 },
    r8: { fixedPoints: 30 },
  },
  {
    id: 'chozai_go', label: '調剤後薬剤管理指導料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 60 },
    r8: { fixedPoints: 60 },
  },
  {
    id: 'kakaritsuke_hokatsu', label: 'かかりつけ薬剤師包括管理料', category: 'management', inputType: 'fixed',
    changeType: 'abolished', changeNote: '服薬管理指導料に統合。',
    r6: { fixedPoints: 291 },
    r8: null,
  },
  {
    id: 'joho_1', label: '服薬情報等提供料1（医師の求め）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 30 },
    r8: { fixedPoints: 30 },
  },
  {
    id: 'joho_2', label: '服薬情報等提供料2（医療機関等へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
    r8: { fixedPoints: 20 },
  },
  {
    id: 'joho_3', label: '服薬情報等提供料3（入院予定先へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 50 },
    r8: { fixedPoints: 50 },
  },
  {
    id: 'gairai_1', label: '外来服薬支援料1（服薬整理）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 185 },
    r8: { fixedPoints: 185 },
  },
  {
    id: 'gairai_2', label: '外来服薬支援料2（一包化）', category: 'management', inputType: 'count-only',
    changeType: 'same',
    r6: {},
    r8: {},
  },
  {
    id: 'shisetsu_renkei', label: '施設連携加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 50 },
    r8: { fixedPoints: 50 },
  },
  {
    id: 'choseihi_1', label: '服用薬剤調整支援料1', category: 'management', inputType: 'fixed',
    description: '2種以上減薬',
    changeType: 'same',
    r6: { fixedPoints: 125 },
    r8: { fixedPoints: 125 },
  },
  {
    id: 'choseihi_2', label: '服用薬剤調整支援料2', category: 'management', inputType: 'fixed',
    description: '医師へ減薬提案',
    changeType: 'same',
    r6: { fixedPoints: 110 },
    r8: { fixedPoints: 110 },
  },
  {
    id: 'keikan', label: '経管投薬支援料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 100 },
    r8: { fixedPoints: 100 },
  },
  // R8 廃止（kakaritsuke_shido, kakaritsuke_hokatsu は上の特2A/2Bの後に移動済み）
  // R8 新設（管理料）
  {
    id: 'zanyaku', label: '調剤時残薬調整加算', category: 'management', inputType: 'select',
    changeType: 'new', changeNote: '旧・重複投薬等防止加算の残薬部分を再編。',
    r6: null,
    r8: { options: [
      { value: 30, label: '30点' },
      { value: 50, label: '50点' },
    ]},
  },
  {
    id: 'yugai', label: '薬学的有害事象等防止加算', category: 'management', inputType: 'select',
    changeType: 'new', changeNote: '旧・重複投薬等防止加算の相互作用部分を再編。',
    r6: null,
    r8: { options: [
      { value: 30, label: '30点' },
      { value: 50, label: '50点' },
    ]},
  },
  {
    id: 'kakaritsuke_fu', label: 'かかりつけ薬剤師フォローアップ加算', category: 'management', inputType: 'fixed',
    changeType: 'new', changeNote: '50点。かかりつけ薬剤師によるフォローアップ。',
    r6: null,
    r8: { fixedPoints: 50 },
  },
]

// D. 在宅等
export const HOMECARE_FEES = [
  {
    id: 'zaitaku_houmon_1', label: '在宅患者訪問薬剤管理指導料（1人・1棟）', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 650 },
    r8: { fixedPoints: 650 },
  },
  {
    id: 'zaitaku_houmon_2', label: '在宅患者訪問薬剤管理指導料（2-9人）', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 320 },
    r8: { fixedPoints: 320 },
  },
  {
    id: 'zaitaku_houmon_3', label: '在宅患者訪問薬剤管理指導料（10人以上）', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 290 },
    r8: { fixedPoints: 290 },
  },
  {
    id: 'kinkyu_houmon_1', label: '在宅患者緊急訪問薬剤管理指導料1', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 500 },
    r8: { fixedPoints: 500 },
  },
  {
    id: 'kinkyu_houmon_2', label: '在宅患者緊急訪問薬剤管理指導料2', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 200 },
    r8: { fixedPoints: 200 },
  },
  {
    id: 'kinkyu_kyodo', label: '在宅患者緊急時等共同服薬指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 700 },
    r8: { fixedPoints: 700 },
  },
  {
    id: 'zaitaku_online', label: '在宅患者オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 59 },
    r8: { fixedPoints: 59 },
  },
  {
    id: 'zaitaku_kinkyu_online', label: '在宅患者緊急オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 59 },
    r8: { fixedPoints: 59 },
  },
  {
    id: 'zaitaku_mayaku', label: '麻薬管理加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 100 },
    r8: { fixedPoints: 100 },
  },
  {
    id: 'zaitaku_nyuyoji', label: '乳幼児加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 100 },
    r8: { fixedPoints: 100 },
  },
  {
    id: 'zaitaku_shoni', label: '小児特定加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 350 },
    r8: { fixedPoints: 350 },
  },
  {
    id: 'zaitaku_mayaku_chu', label: '医療用麻薬持続注射療法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 250 },
    r8: { fixedPoints: 250 },
  },
  {
    id: 'zaitaku_chushin', label: '在宅中心静脈栄養法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 150 },
    r8: { fixedPoints: 150 },
  },
  {
    id: 'yakan_homon', label: '夜間訪問加算', category: 'homecare', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  {
    id: 'kyujitsu_homon', label: '休日訪問加算', category: 'homecare', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  {
    id: 'shinya_homon', label: '深夜訪問加算', category: 'homecare', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r6: { fixedPoints: 0 },
    r8: { fixedPoints: 0 },
  },
  {
    id: 'zaitaku_boushi', label: '在宅患者重複投薬等管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 20 },
    r8: { fixedPoints: 20 },
  },
  {
    id: 'taiin_kyodo', label: '退院時共同指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 600 },
    r8: { fixedPoints: 600 },
  },
  {
    id: 'zaitaku_ikou', label: '在宅移行初期管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r6: { fixedPoints: 230 },
    r8: { fixedPoints: 230 },
  },
  // R8 新設（在宅）
  {
    id: 'kakaritsuke_houmon', label: 'かかりつけ薬剤師訪問加算', category: 'homecare', inputType: 'fixed',
    changeType: 'new', changeNote: '230点。かかりつけ薬剤師による在宅訪問加算。',
    r6: null,
    r8: { fixedPoints: 230 },
  },
  {
    id: 'fukusu_houmon', label: '複数名薬剤管理指導訪問料', category: 'homecare', inputType: 'fixed',
    changeType: 'new', changeNote: '300点。',
    r6: null,
    r8: { fixedPoints: 300 },
  },
]

// E. 介護（単位制）
export const LONGTERM_FEES = [
  {
    id: 'kaigo_kyotaku_1', label: '薬剤師居宅療養管理指導費Ⅱ（1人・1棟）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 518 },
    r8: { fixedPoints: 518 },
  },
  {
    id: 'kaigo_kyotaku_2', label: '薬剤師居宅療養管理指導費Ⅱ（2-9人）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 379 },
    r8: { fixedPoints: 379 },
  },
  {
    id: 'kaigo_kyotaku_3', label: '薬剤師居宅療養管理指導費Ⅱ（10人以上）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 342 },
    r8: { fixedPoints: 342 },
  },
  {
    id: 'kaigo_tsushin', label: '薬剤師居宅療養管理指導費Ⅱ（通信機器）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 46 },
    r8: { fixedPoints: 46 },
  },
  {
    id: 'kaigo_chushin', label: '介護中心静脈栄養法加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 150 },
    r8: { fixedPoints: 150 },
  },
  {
    id: 'kaigo_mayaku', label: '介護麻薬管理加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r6: { fixedPoints: 100 },
    r8: { fixedPoints: 100 },
  },
]

// 全カテゴリまとめ
export const ALL_FEES = [
  ...BASIC_FEES,
  ...PREPARATION_FEES,
  ...MANAGEMENT_FEES,
  ...HOMECARE_FEES,
  ...LONGTERM_FEES,
]
