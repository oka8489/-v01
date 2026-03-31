// ====================================================================
// PDF取込スキーマ - 統計表・加算表の全項目 → DBキー対応
// source: 'tokei'(統計表) | 'kasan'(加算表) | 'both'(両方)
// type: 'cnt'(件数) | 'amt'(金額) | 'pts'(点数) | 'indicator'(指標)
// dbKey: DBに保存するキー名（r6オブジェクト内）
// computed: true = DBから取得せず計算で算出（青表示）
// ====================================================================

// A. 基本指標（統計表の左側）
export const INDICATOR_SCHEMA = [
  { pdfName: '処方箋受付回数', dbKey: 'rx_count', source: 'tokei', type: 'indicator', unit: '回' },
  { pdfName: '処方箋受付枚数', dbKey: 'rx_sheets', source: 'tokei', type: 'indicator', unit: '枚' },
  { pdfName: '後発調剤率', dbKey: 'ge_rate', source: 'tokei', type: 'indicator', unit: '%' },
  { pdfName: '剤数', dbKey: 'zai_count', source: 'tokei', type: 'indicator', unit: '剤' },
  { pdfName: '平均剤数', dbKey: 'avg_zai', source: 'tokei', type: 'indicator', unit: '剤' },
  { pdfName: '調剤報酬金額', dbKey: 'total_reward', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '処方箋単価', dbKey: 'rx_price', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '保険分・患者負担金額', dbKey: 'hoken_futan', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '自費分・患者負担金額', dbKey: 'jihi_futan', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '保険外・患者負担金額', dbKey: 'hokengai_futan', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: 'その他金額', dbKey: 'sonota_kingaku', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: 'ＯＴＣ金額', dbKey: 'otc_kingaku', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '選定療養金額', dbKey: 'sentei_ryoyo', source: 'tokei', type: 'indicator', unit: '円' },
  { pdfName: '手帳活用実績（持参率）', dbKey: 'techo_rate', source: 'tokei', type: 'indicator', unit: '%' },
  { pdfName: '３月以内受付回数', dbKey: 'rx_3month', source: 'tokei', type: 'indicator', unit: '回' },
  { pdfName: 'うち手帳持参有り', dbKey: 'rx_3month_techo', source: 'tokei', type: 'indicator', unit: '回' },
]

// B. 調剤基本料・体制加算（加算表【調剤基本料】+ 統計表）
export const BASIC_FEE_SCHEMA = [
  // 加算表から件数・点数・金額を取得
  { pdfName: '調剤基本料（45点）', dbKey: 'kihon', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '算定なし（0点）', dbKey: 'kihon_santei_nashi', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '調剤基本料※同時受付', dbKey: 'kihon_doji', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '地域支援体制加算', dbKey: 'chiiki', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '後発医薬品調剤体制加算', dbKey: 'kouhatsu', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '連携強化加算', dbKey: 'renkei', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '医療DX推進体制整備加算（8点）', dbKey: 'dx8', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '医療DX推進体制整備加算（6点）', dbKey: 'dx6', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '医療DX推進体制整備加算（10点）', dbKey: 'dx10', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '在宅薬学総合体制加算', dbKey: 'zaitaku_taisei', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '時間外加算', dbKey: 'jikangai', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'], section: 'basic' },
  { pdfName: '夜間・休日等加算', dbKey: 'yakan', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  // 統計表の基本料合計
  { pdfName: '調剤基本料', dbKey: 'kihon_total', source: 'tokei', type: 'summary', fields: ['amt', 'pct'] },
]

// C. 薬剤調製料（加算表【薬剤調製料】+ 統計表マトリクス）
export const PREPARATION_FEE_SCHEMA = [
  // 加算表の薬剤調製料
  { pdfName: '（内服薬適用分）', dbKey: 'naifuku', source: 'kasan', section: 'chozai', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '（屯服薬適用分）', dbKey: 'tonpuku', source: 'kasan', section: 'chozai', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '（外用薬適用分）', dbKey: 'gaiyou', source: 'kasan', section: 'chozai', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '（注射薬適用分）', dbKey: 'chusya', source: 'kasan', section: 'chozai', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '（内服用滴剤適用分）', dbKey: 'naiteki', source: 'kasan', section: 'chozai', fields: ['cnt', 'total_pts', 'amt'] },
  // 統計表マトリクス（剤種ごとの剤数・薬剤料/材料料）
  { pdfName: '内服', dbKey: 'naifuku', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '浸煎', dbKey: 'sinsenn', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '湯薬', dbKey: 'yuyaku', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '屯服', dbKey: 'tonpuku', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '外用', dbKey: 'gaiyou', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '注射', dbKey: 'chusya', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '内滴', dbKey: 'naiteki', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai', 'chozai_amt'] },
  { pdfName: '材料', dbKey: 'zairyo', source: 'tokei', section: 'matrix', fields: ['zai', 'yakuzai'] },
]

// D. 薬剤調製料加算（加算表【薬剤調製料加算】+ 統計表マトリクス加算列）
export const PREPARATION_KAZAN_SCHEMA = [
  // 加算表の個別加算（剤種×加算種別ごとに件数・点数・金額）
  { pdfName: '覚せい剤原料加算', dbKey: 'kaz_kakusei', source: 'kasan', section: 'kazan' },
  { pdfName: '向精神薬加算', dbKey: 'kaz_mukyoko', source: 'kasan', section: 'kazan' },
  { pdfName: '計量混合加算', dbKey: 'kaz_keiryo', source: 'kasan', section: 'kazan' },
  { pdfName: '自家製剤加算', dbKey: 'kaz_jika', source: 'kasan', section: 'kazan' },
  // 時間外加算（調製料）
  { pdfName: '時間外加算', dbKey: 'kaz_jikou', source: 'kasan', section: 'kazan_jikangai' },
  // 統計表マトリクスの加算列（剤種ごとの合計）
  // 麻薬・毒薬・覚醒剤・向精神・計量・計量予・自家・自家予・無菌・時間外・加算合計
  // → 統計表の合計行から取得
]

// E. 薬学管理料（加算表【薬学管理料】+ 統計表右側）
export const MANAGEMENT_FEE_SCHEMA = [
  // 統計表から件数・金額を取得
  { pdfName: '調剤管理料(内服)', dbKey: 'kanri_total', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '調剤管理料(内服以外)', dbKey: 'kanri_gaiyou', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '調剤管理加算', dbKey: 'chmgr_kazan', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '重複防止加算(残薬以外)', dbKey: 'jufuku_other', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '重複防止加算(残薬)', dbKey: 'jufuku_zan', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '医療情報取得加算', dbKey: 'iryo_joho', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '時間外加算(調剤管理料)', dbKey: 'jikangai_kanri', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(薬A)手帳あり 3月以内', dbKey: 'fukuyaku_a', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(薬B)手帳なし 3月以内', dbKey: 'fukuyaku_b', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(薬C)3月以外', dbKey: 'fukuyaku_c', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(薬3)特養入居者', dbKey: 'fukuyaku_3', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(オンライン服薬指導)', dbKey: 'fukuyaku_online', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬管理(連携薬剤師)', dbKey: 'fukuyaku_toku2a', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: 'かかりつけ薬剤師指導料', dbKey: 'kakaritsuke_shido', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '麻薬管理指導加算', dbKey: 'mayaku_kanri', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '特定薬剤管理指導加算1(ｲ)', dbKey: 'tokutei_1i', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '特定薬剤管理指導加算1(ﾛ)', dbKey: 'tokutei_1ro', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '特定薬剤管理指導加算2', dbKey: 'tokutei_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '特定薬剤管理指導加算3(ｲ)', dbKey: 'tokutei_3i', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '特定薬剤管理指導加算3(ﾛ)', dbKey: 'tokutei_3ro', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '吸入薬指導加算', dbKey: 'kyunyu', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '乳幼児服薬指導加算', dbKey: 'nyuyoji', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '小児特定加算', dbKey: 'shoni', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '調剤後薬剤管理指導料', dbKey: 'chozai_go', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: 'かかりつけ薬剤師包括', dbKey: 'kakaritsuke_hokatsu', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬情報等提供料1', dbKey: 'joho_1', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬情報等提供料2', dbKey: 'joho_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服薬情報等提供料3', dbKey: 'joho_3', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '外来服薬支援料1', dbKey: 'gairai_1', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '外来服薬支援料2', dbKey: 'gairai_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '施設連携加算', dbKey: 'shisetsu_renkei', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服用薬剤調整支援料1', dbKey: 'choseihi_1', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '服用薬剤調整支援料2', dbKey: 'choseihi_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '経管投薬支援料', dbKey: 'keikan', source: 'tokei', fields: ['cnt', 'amt'] },
  // 加算表からも件数・点数・金額を取得（重複チェック用）
  { pdfName: '調剤管理料', dbKey: 'kanri_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '服薬管理指導料（薬A）', dbKey: 'fukuyaku_a', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '服薬管理指導料（薬B）', dbKey: 'fukuyaku_b', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '服薬管理指導料（薬C）', dbKey: 'fukuyaku_c', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: 'かかりつけ薬剤師指導料（薬指）', dbKey: 'kakaritsuke_shido', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
]

// F. 在宅（統計表2頁目 + 加算表【在宅等】）
export const HOMECARE_SCHEMA = [
  { pdfName: '在宅患者訪問薬剤管理指導料(単一１人)', dbKey: 'zaitaku_houmon_1', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者訪問薬剤管理指導料(１人以外)', dbKey: 'zaitaku_houmon_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者緊急訪問薬剤管理指導料1', dbKey: 'kinkyu_houmon_1', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者緊急訪問薬剤管理指導料2', dbKey: 'kinkyu_houmon_2', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者緊急時等共同服薬指導料', dbKey: 'kinkyu_kyodo', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者オンライン薬剤管理指導料', dbKey: 'zaitaku_online', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者緊急オンライン薬剤管理指導料', dbKey: 'zaitaku_kinkyu_online', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '麻薬管理加算', dbKey: 'zaitaku_mayaku', source: 'tokei', fields: ['cnt', 'amt'], section: 'homecare' },
  { pdfName: '乳幼児加算', dbKey: 'zaitaku_nyuyoji', source: 'tokei', fields: ['cnt', 'amt'], section: 'homecare' },
  { pdfName: '小児特定加算', dbKey: 'zaitaku_shoni', source: 'tokei', fields: ['cnt', 'amt'], section: 'homecare' },
  { pdfName: '在宅患者医療用麻薬持続注射療法加算', dbKey: 'zaitaku_mayaku_chu', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅中心静脈栄養法加算', dbKey: 'zaitaku_chushin', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '夜間訪問加算', dbKey: 'yakan_homon', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '休日訪問加算', dbKey: 'kyujitsu_homon', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '深夜訪問加算', dbKey: 'shinya_homon', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅患者防止管理料', dbKey: 'zaitaku_boushi', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '退院時共同指導料', dbKey: 'taiin_kyodo', source: 'tokei', fields: ['cnt', 'amt'] },
  { pdfName: '在宅移行初期管理料', dbKey: 'zaitaku_ikou', source: 'tokei', fields: ['cnt', 'amt'] },
]

// G. 介護（加算表【介護】）
export const LONGTERM_SCHEMA = [
  { pdfName: '薬剤師居宅療養Ⅱ１', dbKey: 'kaigo_kyotaku_1', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '予防薬剤師居宅療養Ⅱ１', dbKey: 'kaigo_yobo_kyotaku_1', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  // 以下は加算表に出現した場合のみ
  { pdfName: '薬剤師居宅療養Ⅱ２', dbKey: 'kaigo_kyotaku_2', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
  { pdfName: '薬剤師居宅療養Ⅱ３', dbKey: 'kaigo_kyotaku_3', source: 'kasan', fields: ['cnt', 'pts', 'total_pts', 'amt'] },
]

// H. 合計・検証用
export const SUMMARY_SCHEMA = [
  { pdfName: '薬剤調製料合計', dbKey: 'chozai_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '薬剤調製料加算合計', dbKey: 'kazan_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '薬学管理料合計', dbKey: 'yakugaku_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '在宅等合計', dbKey: 'zaitaku_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '調剤合計', dbKey: 'chozai_grand_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '介護合計', dbKey: 'kaigo_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  { pdfName: '総合計', dbKey: 'grand_total', source: 'kasan', fields: ['cnt', 'total_pts', 'amt'] },
  // 統計表の区分合計
  { pdfName: '調剤基本料', dbKey: 'kihon_section_total', source: 'tokei', type: 'summary', fields: ['amt', 'pct'] },
  { pdfName: '薬学管理料', dbKey: 'yakugaku_section_total', source: 'tokei', type: 'summary', fields: ['amt', 'pct'] },
  { pdfName: '薬剤料/材料料', dbKey: 'yakuzai_section_total', source: 'tokei', type: 'summary', fields: ['amt', 'pct'] },
]

// バリデーションルール
export const VALIDATION_RULES = [
  // 加算表の合計検証
  { rule: 'sum_equals', target: 'chozai_total_amt', sources: ['naifuku_amt', 'tonpuku_amt', 'gaiyou_amt', 'chusya_amt', 'naiteki_amt'], label: '薬剤調製料合計' },
  { rule: 'sum_equals', target: 'grand_total_amt', sources: ['chozai_grand_total_amt', 'kaigo_total_amt'], label: '総合計' },
  // 統計表と加算表の件数クロスチェック
  { rule: 'cross_check', tokeiKey: 'fukuyaku_a_cnt', kasanKey: 'fukuyaku_a_cnt', label: '服薬管理指導料(薬A)件数' },
  { rule: 'cross_check', tokeiKey: 'kanri_total_cnt', kasanKey: 'kanri_total_cnt', label: '調剤管理料件数' },
  // 点数×件数×10 = 金額の検証（固定点数項目）
  { rule: 'calc_check', key: 'kihon', pts: 45, label: '調剤基本料' },
  { rule: 'calc_check', key: 'kouhatsu', pts: 30, label: '後発医薬品調剤体制加算' },
  { rule: 'calc_check', key: 'chiiki', pts: 32, label: '地域支援体制加算' },
]

export const ALL_SCHEMA = [
  ...INDICATOR_SCHEMA,
  ...BASIC_FEE_SCHEMA,
  ...PREPARATION_FEE_SCHEMA,
  ...PREPARATION_KAZAN_SCHEMA,
  ...MANAGEMENT_FEE_SCHEMA,
  ...HOMECARE_SCHEMA,
  ...LONGTERM_SCHEMA,
  ...SUMMARY_SCHEMA,
]
