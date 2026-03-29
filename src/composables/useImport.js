import { MONTHS_R7 } from '../utils/constants.js'

// migiude_data.json のフィールド → 報酬改定システムのフィールドへのマッピング
const FIELD_MAP_R6 = {
  // 基本料・体制加算
  // 基本料・体制加算
  kihon_cnt: 'kihon45_cnt',
  chiiki_cnt: 'chiiki_cnt',
  kouhatsu_cnt: 'kouhatsu_cnt',
  renkei_cnt: 'renkei_cnt',
  dx8_cnt: 'dx8_cnt',
  dx10_cnt: 'dx10_cnt',
  zaitaku_taisei_cnt: 'zaitaku15_cnt',
  yakan_cnt: 'yakan_cnt',
  // 薬剤調製料
  naifuku_cnt: 'naifuku_zai',
  sinsenn_cnt: 'sinsenn_zai',
  yuyaku_cnt: 'yuyaku_zai',
  tonpuku_cnt: 'tonpuku_zai',
  gaiyou_cnt: 'gaiyou_zai',
  chusya_cnt: 'chusya_zai',
  naiteki_cnt: 'naiteki_zai',
  zairyo_cnt: 'zairyo_zai',
  // 薬剤調製料加算（全調剤種別の合計）
  kaz_mayaku_cnt: null,
  kaz_doku_cnt: null,
  kaz_kakusei_cnt: null,
  kaz_mukyoko_cnt: null,
  kaz_keiryo_cnt: null,
  kaz_keiryo_yo_cnt: null,
  kaz_jika_cnt: null,
  kaz_jika_yo_cnt: null,
  kaz_mukin_cnt: null,
  kaz_jikou_cnt: null,
  // 薬学管理料
  kanri_27_cnt: 'chmgr_nai_cnt',
  kanri_gaiyou_cnt: 'chmgr_other_cnt',
  fukuyaku_1i_cnt: 'fuyaku_a_cnt',
  fukuyaku_1ro_cnt: null,
  fukuyaku_2i_cnt: 'fuyaku_b_cnt',
  fukuyaku_2ro_cnt: null,
  fukuyaku_3_cnt: 'fuyaku_c_cnt',
  kakaritsuke_shido_cnt: 'kakari_76_cnt',
  kakaritsuke_hokatsu_cnt: 'kakari_291_cnt',
  jufuku_cnt: 'jukufuku_other_cnt',
  mayaku_kanri_cnt: 'mayaku_shido_cnt',
  tokutei_1i_cnt: 'tokutei_1i_cnt',
  tokutei_1ro_cnt: 'tokutei_1ro_cnt',
  tokutei_2_cnt: 'tokutei_2_cnt',
  tokutei_3i_cnt: 'tokutei_3i_cnt',
  tokutei_3ro_cnt: 'tokutei_3ro_cnt',
  kyunyu_cnt: 'kyunyu_30_cnt',
  nyuyoji_cnt: 'nyuyoji_12_cnt',
  shoni_cnt: 'shoni_350_cnt',
  chozai_go_cnt: 'chozaigo_60_cnt',
  iryo_joho_cnt: 'iryo_joho_cnt',
  joho_1_cnt: 'fuyaku_joho1_cnt',
  joho_2_cnt: 'fuyaku_joho2_cnt',
  joho_3_cnt: 'fuyaku_joho3_cnt',
  gairai_1_cnt: 'gaifuku1_cnt',
  shisetsu_renkei_cnt: 'setsurenkei_cnt',
  choseihi_1_cnt: 'fukuyou1_cnt',
  choseihi_2_cnt: 'fukuyou2_cnt',
  keikan_cnt: 'keikan_cnt',
  // 在宅
  zaitaku_houmon_1_cnt: 'zaitaku_1nin_cnt',
  zaitaku_houmon_2_cnt: 'zaitaku_2_9_cnt',
  zaitaku_houmon_3_cnt: 'zaitaku_10_cnt',
  kinkyu_houmon_1_cnt: 'zaitaku_kinkyu1_cnt',
  kinkyu_houmon_2_cnt: 'zaitaku_kinkyu2_cnt',
  kinkyu_kyodo_cnt: 'zaitaku_kyodo_cnt',
  taiin_kyodo_cnt: 'taiin_kyodo_cnt',
  zaitaku_ikou_cnt: 'zaitaku_iko_cnt',
  zaitaku_online_cnt: null,
  zaitaku_kinkyu_online_cnt: null,
  zaitaku_mayaku_cnt: 'zaitaku_mayaku_cnt',
  zaitaku_mayaku_chu_cnt: 'zaitaku_mayaku_chu_cnt',
  zaitaku_chushin_cnt: 'zaitaku_chushin_cnt',
  zaitaku_nyuyoji_cnt: 'zaitaku_nyuyoji_cnt',
  zaitaku_shoni_cnt: 'zaitaku_shoni_cnt',
  zaitaku_boushi_cnt: 'zaitaku_jukufuku_other_cnt',
  kyujitsu_homon_cnt: 'kyujitsu_homon_cnt',
  shinya_homon_cnt: 'shinya_homon_cnt',
  yakan_homon_cnt: 'yakan_homon_cnt',
  // 介護
  kaigo_kyotaku_1_cnt: 'kaigo1_cnt',
  kaigo_kyotaku_2_cnt: 'kaigo2_cnt',
  kaigo_kyotaku_3_cnt: 'kaigo3_cnt',
  kaigo_tsushin_cnt: 'kaigo4_cnt',
  kaigo_chushin_cnt: 'kaigo_chushin_cnt',
  kaigo_mayaku_cnt: 'kaigo_mayaku_cnt',
}

// 月次実績のフィールドマッピング
const MONTHLY_MAP = {
  rxCount: 'rx_count',
  rxSheets: 'rx_sheets',
  geRate: 'ge_rate',
  zaiCount: 'zai_count',
  avgZai: 'avg_zai',
  totalReward: 'total_reward',
  rxPrice: 'rx_price',
  techoRate: 'techo_rate',
}

export function importFromMigiudeData(fileData, storageData) {
  // R6件数の合算（全月を合計）
  const availableMonths = MONTHS_R7.filter(ym => fileData[ym])
  if (availableMonths.length === 0) {
    return { success: false, message: 'R7.5〜R8.4のデータが見つかりません' }
  }

  // R6側の件数を合計
  if (!storageData.r6) storageData.r6 = {}

  for (const [ourField, theirField] of Object.entries(FIELD_MAP_R6)) {
    if (!theirField) continue
    let total = 0
    for (const ym of availableMonths) {
      const val = fileData[ym]?.[theirField]
      if (val != null && !isNaN(val)) total += val
    }
    storageData.r6[ourField] = total
  }

  // 薬剤費合計を計算
  let totalDrugCost = 0
  const drugFields = ['naifuku_yakuzai', 'sinsenn_yakuzai', 'yuyaku_yakuzai',
    'tonpuku_yakuzai', 'gaiyou_yakuzai', 'chusya_yakuzai', 'naiteki_yakuzai', 'zairyo_yakuzai']
  for (const ym of availableMonths) {
    for (const f of drugFields) {
      const val = fileData[ym]?.[f]
      if (val != null && !isNaN(val)) totalDrugCost += val
    }
  }

  // 月次実績データを読み込み
  if (!storageData.monthly) storageData.monthly = {}
  for (const ym of availableMonths) {
    const src = fileData[ym]
    if (!src) continue
    if (!storageData.monthly[ym]) storageData.monthly[ym] = {}
    const dst = storageData.monthly[ym]
    for (const [ourField, theirField] of Object.entries(MONTHLY_MAP)) {
      const val = src[theirField]
      if (val != null && !isNaN(val)) dst[ourField] = val
    }
    // 薬剤費
    let monthDrug = 0
    for (const f of drugFields) {
      const val = src[f]
      if (val != null && !isNaN(val)) monthDrug += val
    }
    dst.drugCost = monthDrug
  }

  return {
    success: true,
    message: `${availableMonths.length}ヶ月分の実績を読み込みました`,
    months: availableMonths.length,
  }
}
