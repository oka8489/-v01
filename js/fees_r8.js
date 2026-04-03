// ====================================================================
// R8 Fee Definitions（令和8年度改定後）
// 共通定数・フォーマッターは fees.js から参照
// ====================================================================

const R8_BASIC_FEES = [
  {
    id: 'k_bukka', label: '調剤物価対応料', category: 'basic', inputType: 'fixed',
    changeType: 'new',
    countHint: '同一患者につき3月に1回。概算: 処方箋受付回数÷3',
    r8: { fixedPoints: 1 },
  },
  {
    id: 'k_baseup', label: '調剤ベースアップ評価料', category: 'basic', inputType: 'fixed',
    changeType: 'new',
    countHint: '処方箋受付1回につき毎回算定。件数＝受付回数',
    r8: { fixedPoints: 4 },
  },
  {
    id: 'k_kihon', label: '調剤基本料', category: 'basic', inputType: 'select',
    changeType: 'modified',
    r8: { options: [
      { value: 47, label: '基本料1（47点）' },
      { value: 30, label: '基本料2（30点）' },
      { value: 25, label: '基本料3イ（25点）' },
      { value: 20, label: '基本料3ロ（20点）' },
      { value: 37, label: '基本料3ハ（37点）' },
      { value: 5, label: '特別A（5点）' },
      { value: 3, label: '特別B（3点）' },
    ]},
  },
  {
    id: 'k_kihon_santei_nashi', label: '算定なし', category: 'basic', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 0 },
  },
  {
    id: 'k_kihon_doji', label: '調剤基本料※同時受付', category: 'basic', inputType: 'fixed',
    changeType: 'same',
    linkedTo: 'k_kihon', linkedRate: 0.8,
    r8: {},
  },
  {
    id: 'k_chiiki', label: '地域支援・医薬品供給対応体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'merged',
    r8: { options: [
      { value: 0, label: '算定なし' },
      { value: 27, label: '加算1（27点）' },
      { value: 59, label: '加算2（59点）' },
      { value: 67, label: '加算3（67点）' },
      { value: 37, label: '加算4（37点）' },
      { value: 59, label: '加算5（59点）' },
    ]},
  },
  {
    id: 'k_kouhatsu', label: '後発医薬品調剤体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 'k_renkei', label: '連携強化加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'same',
    r8: { options: [{ value: 0, label: '算定なし' }, { value: 5, label: '加算（5点）' }] },
  },
  {
    id: 'k_dx8', label: '電子的調剤情報連携体制整備加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'modified',
    r8: { options: [{ value: 0, label: '算定なし' }, { value: 8, label: '加算（8点）' }] },
  },
  {
    id: 'k_dx6', label: '医療DX推進体制整備加算（6点）', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 'k_dx10', label: '医療DX推進体制整備加算（10点）', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 'k_zaitaku_taisei', label: '在宅薬学総合体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'modified',
    r8: { options: [
      { value: 0, label: '算定なし' },
      { value: 30, label: '加算1（30点）' },
      { value: 'zt2', label: '加算2' },
    ]},
    subRows: {
      trigger: 'zt2',
      items: [
        { id: 'k_zaitaku_taisei2i', label: '　イ（個人宅）', pts: 100 },
        { id: 'k_zaitaku_taisei2ro', label: '　ロ（施設等）', pts: 50 },
      ],
    },
  },
  {
    id: 'k_jikangai', label: '時間外加算', category: 'basic', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r8: {},
  },
  {
    id: 'k_yakan', label: '夜間・休日等加算', category: 'basic', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 40 },
  },
  {
    id: 'k_bio', label: 'バイオ後続品調剤体制加算', category: 'basic', inputType: 'select', isSub: true,
    changeType: 'new',
    r8: { options: [{ value: 0, label: '算定なし' }, { value: 50, label: '加算（50点）' }] },
  },
]

const R8_PREPARATION_FEES = [
  {
    id: 'naifuku', label: '内服', category: 'preparation', inputType: 'fixed',
    unit: '1剤につき（3剤まで）', changeType: 'same',
    r8: { fixedPoints: 24 },
  },
  {
    id: 'sinsenn', label: '浸煎', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）', changeType: 'same',
    noCntInPdf: true,
    r8: { fixedPoints: 24 },
  },
  {
    id: 'yuyaku', label: '湯薬', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）', changeType: 'same',
    noCntInPdf: true,
    r8: { fixedPoints: 190 },
  },
  {
    id: 'tonpuku', label: '屯服', category: 'preparation', inputType: 'fixed',
    unit: '処方箋受付1回につき', changeType: 'same',
    r8: { fixedPoints: 21 },
  },
  {
    id: 'gaiyou', label: '外用', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき（3調剤まで）', changeType: 'same',
    r8: { fixedPoints: 10 },
  },
  {
    id: 'chusya', label: '注射', category: 'preparation', inputType: 'fixed',
    unit: '1処方箋につき', changeType: 'same',
    r8: { fixedPoints: 26 },
  },
  {
    id: 'naiteki', label: '内滴', category: 'preparation', inputType: 'fixed',
    unit: '1調剤につき', changeType: 'same',
    r8: { fixedPoints: 10 },
  },
  {
    id: 'zairyo', label: '材料', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
  {
    id: 'yakuzai_total', label: '薬剤料', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
  // 薬剤調製料加算
  {
    id: 'kaz_mayaku', label: '麻薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 70 },
  },
  {
    id: 'kaz_doku', label: '毒薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_kakusei', label: '覚醒剤原料加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_mukyoko', label: '向精神薬加算', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 8 },
  },
  {
    id: 'kaz_keiryo', label: '計量混合加算', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
  {
    id: 'kaz_keiryo_yo', label: '計量混合加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 20 },
  },
  {
    id: 'kaz_jika', label: '自家製剤加算', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
  {
    id: 'kaz_jika_yo', label: '自家製剤加算（予製）', category: 'preparation', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 10 },
  },
  {
    id: 'kaz_mukin', label: '無菌製剤処理加算', category: 'preparation', inputType: 'select',
    changeType: 'modified',
    r8: { options: [{ value: 0, label: '算定なし' }, { value: 80, label: '80点' }] },
  },
  {
    id: 'kaz_jikou', label: '時間外加算（調製料）', category: 'preparation', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
]

const R8_MANAGEMENT_FEES = [
  {
    id: 't_kanri_nai', label: '調剤管理料（内服）', category: 'management', inputType: 'count-only',
    changeType: 'modified',
    r8: {},
  },
  {
    id: 't_kanri_27', label: '27日以下', category: 'management', inputType: 'fixed',
    changeType: 'modified', isDetail: true,
    r8: { fixedPoints: 10 },
  },
  {
    id: 't_kanri_28', label: '28日以上', category: 'management', inputType: 'fixed',
    changeType: 'same', isDetail: true,
    r8: { fixedPoints: 60 },
  },
  {
    id: 't_kanri_gaiyou', label: '調剤管理料（内服以外）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 4 },
  },
  {
    id: 't_chmgr_kazan', label: '調剤管理加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 3 },
  },
  {
    id: 't_jufuku_other', label: '重複防止加算（残薬以外）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_jufuku_zan', label: '重複防止加算（残薬）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_iryo_joho', label: '医療情報取得加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_jikangai_kanri', label: '時間外加算（調剤管理料）', category: 'management', inputType: 'count-only', isSub: true,
    changeType: 'same',
    r8: {},
  },
  {
    id: 't_fukuyaku_a', label: '服薬管理指導料1（手帳あり3月以内）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r8: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_b', label: '服薬管理指導料2（手帳なし3月以内）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r8: { fixedPoints: 59 },
  },
  {
    id: 't_fukuyaku_c', label: '服薬管理指導料2（3月以外）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r8: { fixedPoints: 59 },
  },
  {
    id: 't_fukuyaku_3', label: '服薬管理指導料3（特養入居者）', category: 'management', inputType: 'fixed',
    changeType: 'modified',
    r8: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_online', label: '服薬管理指導料（オンライン服薬指導）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 45 },
  },
  {
    id: 't_fukuyaku_renkei', label: '服薬管理指導料（特2A/2B）連携薬剤師', category: 'management', inputType: 'count-only',
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_kakaritsuke_shido', label: 'かかりつけ薬剤師指導料', category: 'management', inputType: 'fixed',
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_mayaku_kanri', label: '麻薬管理指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 22 },
  },
  {
    id: 't_tokutei_1i', label: '特定薬剤管理指導加算1イ（ハイリスク新規）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 10 },
  },
  {
    id: 't_tokutei_1ro', label: '特定薬剤管理指導加算1ロ（変更時）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 5 },
  },
  {
    id: 't_tokutei_2', label: '特定薬剤管理指導加算2（抗悪性腫瘍）', category: 'management', inputType: 'select', isSub: true,
    changeType: 'same', judgeCategory: 'sonota',
    judgeInfo: { title: '特定薬剤管理指導加算2', desc: '届出が必要（様式92）', checks: ['保険薬剤師として5年以上の勤務経験を有する薬剤師が勤務', 'プライバシーに配慮した独立したカウンター', '麻薬小売業者の免許を取得', '抗悪性腫瘍剤の化学療法に係る研修に年1回以上参加'] },
    r8: { options: [{ value: 0, label: '算定なし' }, { value: 100, label: '加算（100点）' }] },
  },
  {
    id: 't_tokutei_3i', label: '特定薬剤管理指導加算3イ（RMP）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 5 },
  },
  {
    id: 't_tokutei_3ro', label: '特定薬剤管理指導加算3ロ（選定療養等）', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 10 },
  },
  {
    id: 't_nyuyoji', label: '乳幼児服薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 12 },
  },
  {
    id: 't_shoni', label: '小児特定加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 350 },
  },
  {
    id: 't_kyunyu', label: '吸入薬指導加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'modified',
    r8: { fixedPoints: 30 },
  },
  {
    id: 't_chozai_go', label: '調剤後薬剤管理指導料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 60 },
  },
  {
    id: 't_kakaritsuke_hokatsu', label: 'かかりつけ薬剤師包括管理料', category: 'management', inputType: 'fixed',
    changeType: 'abolished_merged',
    r8: null,
  },
  {
    id: 't_joho_1', label: '服薬情報等提供料1（医師の求め）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 30 },
  },
  {
    id: 't_joho_2', label: '服薬情報等提供料2（医療機関等へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 20 },
  },
  {
    id: 't_joho_3', label: '服薬情報等提供料3（入院予定先へ）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 50 },
  },
  {
    id: 't_gairai_1', label: '外来服薬支援料1（服薬整理）', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 185 },
  },
  {
    id: 't_gairai_2', label: '外来服薬支援料2（一包化）', category: 'management', inputType: 'count-only',
    changeType: 'same',
    r8: {},
  },
  {
    id: 't_shisetsu_renkei', label: '施設連携加算', category: 'management', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 50 },
  },
  {
    id: 't_choseihi_1', label: '服用薬剤調整支援料1', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 125 },
  },
  {
    id: 't_choseihi_2', label: '服用薬剤調整支援料2', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 110 },
  },
  {
    id: 't_keikan', label: '経管投薬支援料', category: 'management', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 100 },
  },
  // R8 新設
  {
    id: 't_zanyaku', label: '調剤時残薬調整加算', category: 'management', inputType: 'fixed',
    changeType: 'new',
    r8: { pointsNote: '加算1: 30点 / 加算2: 50点' },
  },
  {
    id: 't_yugai', label: '薬学的有害事象等防止加算', category: 'management', inputType: 'fixed',
    changeType: 'new',
    r8: { pointsNote: '加算1: 30点 / 加算2: 50点' },
  },
  {
    id: 't_kakaritsuke_fu', label: 'かかりつけ薬剤師フォローアップ加算', category: 'management', inputType: 'fixed',
    changeType: 'new',
    r8: { fixedPoints: 50 },
  },
]

const R8_HOMECARE_FEES = [
  {
    id: 't_zaitaku_houmon_1', label: '在宅患者訪問薬剤管理指導料（単一1人）', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 650 },
  },
  {
    id: 't_zaitaku_houmon_2', label: '在宅患者訪問薬剤管理指導料（1人以外）', category: 'homecare', inputType: 'count-only',
    changeType: 'same',
    r8: { pointsNote: '320点/290点' },
  },
  {
    id: 't_kinkyu_houmon_1', label: '在宅患者緊急訪問薬剤管理指導料1', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 500 },
  },
  {
    id: 't_kinkyu_houmon_2', label: '在宅患者緊急訪問薬剤管理指導料2', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 200 },
  },
  {
    id: 't_kinkyu_kyodo', label: '在宅患者緊急時等共同服薬指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 700 },
  },
  {
    id: 't_zaitaku_online', label: '在宅患者オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 59 },
  },
  {
    id: 't_zaitaku_kinkyu_online', label: '在宅患者緊急オンライン薬剤管理指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 59 },
  },
  {
    id: 't_zaitaku_mayaku', label: '麻薬管理加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 100 },
  },
  {
    id: 't_zaitaku_nyuyoji', label: '乳幼児加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 100 },
  },
  {
    id: 't_zaitaku_shoni', label: '小児特定加算（在宅）', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 350 },
  },
  {
    id: 't_zaitaku_mayaku_chu', label: '医療用麻薬持続注射療法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 250 },
  },
  {
    id: 't_zaitaku_chushin', label: '在宅中心静脈栄養法加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 150 },
  },
  {
    id: 't_yakan_homon', label: '夜間訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 400 },
  },
  {
    id: 't_kyujitsu_homon', label: '休日訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 600 },
  },
  {
    id: 't_shinya_homon', label: '深夜訪問加算', category: 'homecare', inputType: 'fixed', isSub: true,
    changeType: 'same',
    r8: { fixedPoints: 1000 },
  },
  {
    id: 't_zaitaku_boushi', label: '在宅患者重複投薬等管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 20 },
  },
  {
    id: 't_taiin_kyodo', label: '退院時共同指導料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 600 },
  },
  {
    id: 't_zaitaku_ikou', label: '在宅移行初期管理料', category: 'homecare', inputType: 'fixed',
    changeType: 'same',
    r8: { fixedPoints: 230 },
  },
  // R8 新設
  {
    id: 't_kakaritsuke_houmon', label: 'かかりつけ薬剤師訪問加算', category: 'homecare', inputType: 'fixed',
    changeType: 'new',
    r8: { fixedPoints: 230 },
  },
  {
    id: 't_fukusu_houmon', label: '複数名薬剤管理指導訪問料', category: 'homecare', inputType: 'fixed',
    changeType: 'new',
    r8: { fixedPoints: 300 },
  },
]

const R8_LONGTERM_FEES = [
  {
    id: 'k_kaigo_kyotaku_1', label: '薬剤師居宅療養管理指導費Ⅱ（1人・1棟）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 518 },
  },
  {
    id: 'k_kaigo_kyotaku_2', label: '薬剤師居宅療養管理指導費Ⅱ（2-9人）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 379 },
  },
  {
    id: 'k_kaigo_kyotaku_3', label: '薬剤師居宅療養管理指導費Ⅱ（10人以上）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 342 },
  },
  {
    id: 'k_kaigo_tsushin', label: '薬剤師居宅療養管理指導費Ⅱ（通信機器）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 46 },
  },
  {
    id: 'k_kaigo_yobo_kyotaku_1', label: '介護予防居宅療養管理指導費Ⅱ（1人・1棟）', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 518 },
  },
  {
    id: 'k_kaigo_chushin', label: '介護中心静脈栄養法加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 150 },
  },
  {
    id: 'k_kaigo_mayaku', label: '介護麻薬管理加算', category: 'longterm', inputType: 'fixed',
    unit: '単位', changeType: 'same',
    r8: { fixedPoints: 100 },
  },
]

const R8_ALL_FEES = [
  ...R8_BASIC_FEES,
  ...R8_PREPARATION_FEES,
  ...R8_MANAGEMENT_FEES,
  ...R8_HOMECARE_FEES,
  ...R8_LONGTERM_FEES,
]
