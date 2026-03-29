import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ============================================================
// テキスト抽出: 全テキストを1つの文字列として取得
// ============================================================

async function extractFullText(arrayBuffer) {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    // PDF.jsのテキストアイテムを結合（改行で区切り）
    const pageText = content.items.map(item => item.str).join('\n')
    pages.push(pageText)
  }

  return pages.join('\n')
}

// 全角→半角変換
function normalize(text) {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/　/g, ' ')
    .replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3')
}

// ============================================================
// パターン定義: テキストのラベルで意味マッチし、
// 同一行 or 近傍の「N件」「N円」を取得
// ============================================================

const PATTERNS = [
  // --- 基本指標 ---
  { match: t => t.includes('処方箋受付回数'), field: 'rx_count', type: 'value', unit: '回' },
  { match: t => t.includes('処方箋受付枚数'), field: 'rx_sheets', type: 'value', unit: '枚' },
  { match: t => t.includes('後発調剤率') || t.includes('後発率'), field: 'ge_rate', type: 'value', unit: '%' },
  { match: t => t.includes('平均剤数'), field: 'avg_zai', type: 'value', unit: '剤' },
  { match: t => t.includes('調剤報酬金額'), field: 'total_reward', type: 'value', unit: '円' },
  { match: t => t.includes('処方箋単価'), field: 'rx_price', type: 'value', unit: '円' },
  { match: t => t.includes('手帳活用実績') || t.includes('手帳持参率'), field: 'techo_rate', type: 'value', unit: '%' },

  // --- 調剤基本料セクション ---
  { match: t => t.includes('調剤基本料') && !t.includes('同時') && !t.includes('分割') && !t.includes('合計') && !t.includes('再掲'), field: 'kihon', type: 'cnt_amt' },
  { match: t => t.includes('地域支援体制加算') || t.includes('地域支援'), field: 'chiiki_shien', type: 'cnt_amt' },
  { match: t => t.includes('後発医薬品調剤体制加算') || t.includes('後発品体制'), field: 'kouhatsu_taisei', type: 'cnt_amt' },
  { match: t => t.includes('連携強化加算'), field: 'renkei_kyoka', type: 'cnt_amt' },
  { match: t => t.includes('医療DX推進') || t.includes('医療ＤＸ推進'), field: 'dx', type: 'cnt_amt' },
  { match: t => t.includes('在宅薬学総合体制加算'), field: 'zaitaku_taisei', type: 'cnt_amt' },
  { match: t => t.includes('夜間・休日等加算') || t.includes('夜間休日等加算'), field: 'yakan', type: 'cnt_amt' },
  { match: t => t.includes('時間外加算') && !t.includes('調剤管理'), field: 'jikangai', type: 'cnt_amt' },
  { match: t => t.includes('深夜加算'), field: 'shinya', type: 'cnt_amt' },

  // --- 薬学管理料 ---
  { match: t => t.includes('調剤管理料') && t.includes('内服') && !t.includes('以外'), field: 'chmgr_nai', type: 'cnt_amt' },
  { match: t => t.includes('調剤管理料') && t.includes('内服以外'), field: 'chmgr_other', type: 'cnt_amt' },
  { match: t => t.includes('調剤管理加算'), field: 'chmgr_kazan', type: 'cnt_amt' },
  { match: t => (t.includes('重複防止') || t.includes('重複投薬')) && (t.includes('残薬以外') || t.includes('以外') || t.includes('防A')), field: 'jukufuku_other', type: 'cnt_amt' },
  { match: t => (t.includes('重複防止') || t.includes('重複投薬')) && t.includes('残薬') && !t.includes('残薬以外') && !t.includes('以外'), field: 'jukufuku_zan', type: 'cnt_amt' },
  { match: t => t.includes('医療情報取得加算'), field: 'iryo_joho', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && (t.includes('薬A') || t.includes('手帳あり')), field: 'fuyaku_a', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && (t.includes('薬B') || t.includes('手帳なし')), field: 'fuyaku_b', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && (t.includes('薬C') || t.includes('3月以外')), field: 'fuyaku_c', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && (t.includes('薬3') || t.includes('特養入居者') || t.includes('特養')), field: 'fuyaku_3', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && t.includes('オンライン'), field: 'fuyaku_online', type: 'cnt_amt' },
  { match: t => t.includes('服薬管理') && t.includes('連携薬剤師'), field: 'fuyaku_renkei', type: 'cnt_amt' },
  { match: t => t.includes('かかりつけ薬剤師指導料') && !t.includes('包括'), field: 'kakari', type: 'cnt_amt' },
  { match: t => t.includes('かかりつけ薬剤師包括'), field: 'kakari_hokatsu', type: 'cnt_amt' },
  { match: t => t.includes('麻薬管理指導加算') || (t.includes('麻薬管理') && t.includes('加算')), field: 'mayaku_shido', type: 'cnt_amt' },
  { match: t => t.includes('特定薬剤管理指導加算1') && (t.includes('ｲ') || t.includes('イ') || t.includes('(イ)') || t.includes('(ｲ)')), field: 'tokutei_1i', type: 'cnt_amt' },
  { match: t => t.includes('特定薬剤管理指導加算1') && (t.includes('ﾛ') || t.includes('ロ') || t.includes('(ロ)') || t.includes('(ﾛ)')), field: 'tokutei_1ro', type: 'cnt_amt' },
  { match: t => t.includes('特定薬剤管理指導加算2'), field: 'tokutei_2', type: 'cnt_amt' },
  { match: t => t.includes('特定薬剤管理指導加算3') && (t.includes('ｲ') || t.includes('イ') || t.includes('(イ)') || t.includes('(ｲ)')), field: 'tokutei_3i', type: 'cnt_amt' },
  { match: t => t.includes('特定薬剤管理指導加算3') && (t.includes('ﾛ') || t.includes('ロ') || t.includes('(ロ)') || t.includes('(ﾛ)')), field: 'tokutei_3ro', type: 'cnt_amt' },
  { match: t => t.includes('吸入薬指導加算'), field: 'kyunyu', type: 'cnt_amt' },
  { match: t => t.includes('乳幼児服薬指導加算') || t.includes('乳幼児加算'), field: 'nyuyoji', type: 'cnt_amt' },
  { match: t => t.includes('小児特定加算'), field: 'shoni', type: 'cnt_amt' },
  { match: t => t.includes('調剤後薬剤管理指導料'), field: 'chozaigo', type: 'cnt_amt' },
  { match: t => t.includes('服薬情報等提供料1'), field: 'fuyaku_joho1', type: 'cnt_amt' },
  { match: t => (t.includes('服薬情報等提供料2')) && !t.includes('医療機関'), field: 'fuyaku_joho2', type: 'cnt_amt' },
  { match: t => t.includes('服薬情報等提供料3'), field: 'fuyaku_joho3', type: 'cnt_amt' },
  { match: t => t.includes('外来服薬支援料1'), field: 'gaifuku1', type: 'cnt_amt' },
  { match: t => t.includes('外来服薬支援料2'), field: 'gaifuku2', type: 'cnt_amt' },
  { match: t => t.includes('施設連携加算'), field: 'setsurenkei', type: 'cnt_amt' },
  { match: t => t.includes('服用薬剤調整支援料1'), field: 'fukuyou1', type: 'cnt_amt' },
  { match: t => t.includes('服用薬剤調整支援料2'), field: 'fukuyou2', type: 'cnt_amt' },
  { match: t => t.includes('経管投薬支援料'), field: 'keikan', type: 'cnt_amt' },

  // --- 在宅 ---
  { match: t => t.includes('訪問薬剤管理指導料') && (t.includes('単一') || t.includes('1人)') || t.includes('1人)') || t.includes('訪A')), field: 'zaitaku_1nin', type: 'cnt_amt' },
  { match: t => t.includes('訪問薬剤管理指導料') && (t.includes('以外') || t.includes('訪B')), field: 'zaitaku_other', type: 'cnt_amt' },
  { match: t => t.includes('緊急訪問薬剤管理指導料1'), field: 'zaitaku_kinkyu1', type: 'cnt_amt' },
  { match: t => t.includes('緊急訪問薬剤管理指導料2'), field: 'zaitaku_kinkyu2', type: 'cnt_amt' },
  { match: t => t.includes('緊急時等共同服薬指導料'), field: 'zaitaku_kyodo', type: 'cnt_amt' },
  { match: t => t.includes('オンライン薬剤管理指導料') && !t.includes('緊急'), field: 'zaitaku_online', type: 'cnt_amt' },
  { match: t => t.includes('退院時共同指導料'), field: 'taiin_kyodo', type: 'cnt_amt' },
  { match: t => t.includes('在宅移行初期管理料'), field: 'zaitaku_iko', type: 'cnt_amt' },
  { match: t => t.includes('在宅患者防止管理料') || t.includes('在宅患者重複投薬'), field: 'zaitaku_boushi', type: 'cnt_amt' },
  { match: t => t.includes('麻薬管理加算') && t.includes('在宅'), field: 'zaitaku_mayaku', type: 'cnt_amt' },
  { match: t => t.includes('麻薬持続注射') || t.includes('医療用麻薬持続'), field: 'zaitaku_mayaku_chu', type: 'cnt_amt' },
  { match: t => t.includes('中心静脈栄養法') && !t.includes('介護'), field: 'zaitaku_chushin', type: 'cnt_amt' },
  { match: t => t.includes('乳幼児加算') && t.includes('在宅'), field: 'zaitaku_nyuyoji', type: 'cnt_amt' },
  { match: t => t.includes('小児特定加算') && t.includes('在宅'), field: 'zaitaku_shoni', type: 'cnt_amt' },
  { match: t => t.includes('休日訪問加算'), field: 'kyujitsu_homon', type: 'cnt_amt' },
  { match: t => t.includes('深夜訪問加算'), field: 'shinya_homon', type: 'cnt_amt' },
  { match: t => t.includes('夜間訪問加算'), field: 'yakan_homon', type: 'cnt_amt' },
  // 薬学管理料追加
  { match: t => t.includes('服用薬剤調整支援料2'), field: 'fukuyou2', type: 'cnt_amt' },
  { match: t => t.includes('経管投薬支援料'), field: 'keikan', type: 'cnt_amt' },
]

// 薬剤調製料テーブルのラベル
const ZAI_MAP = { '内服': 'naifuku', '浸煎': 'sinsenn', '湯薬': 'yuyaku', '屯服': 'tonpuku',
  '外用': 'gaiyou', '注射': 'chusya', '内滴': 'naiteki', '材料': 'zairyo' }

// ============================================================
// メインパーサー: テキストの意味だけで判定（座標不使用）
// ============================================================

async function parsePdfContent(arrayBuffer) {
  const fullText = await extractFullText(arrayBuffer)
  const normalizedText = normalize(fullText)

  // 改行で分割して行リストに
  const rawLines = normalizedText.split('\n').map(l => l.trim()).filter(l => l)

  const result = {}
  const matched = new Set()

  // --- 期間を取得 ---
  for (const line of rawLines) {
    const m = line.match(/令和(\d+)年(\d+)月(\d+)日/)
    if (m && !result.period_start) {
      const y = 2018 + parseInt(m[1])
      result.period_start = `${y}-${String(parseInt(m[2])).padStart(2, '0')}-${String(parseInt(m[3])).padStart(2, '0')}`
      result.year_month = `${y}-${String(parseInt(m[2])).padStart(2, '0')}`
      break
    }
  }

  // --- 複数行を結合した「意味行」を生成 ---
  // PDF.jsは表セルの中身を1行1テキストアイテムで出力するが、
  // PyMuPDFのfind_tables()のようにセル内テキストが結合された形で取れる場合もある。
  // 両方に対応するため、連続する行を結合して「ラベル + N件 + N円」の形を探す。
  const meaningLines = []

  // まず、rawLinesの中で「ラベル N件 N円 N%」が1行に入っているものを探す
  for (const line of rawLines) {
    meaningLines.push(line)
  }

  // さらに、連続する2-5行を結合した候補も作る（バラけている場合に対応）
  for (let i = 0; i < rawLines.length; i++) {
    for (let window = 2; window <= 5 && i + window <= rawLines.length; window++) {
      const combined = rawLines.slice(i, i + window).join(' ')
      meaningLines.push(combined)
    }
  }

  // --- パターンマッチング ---
  for (const text of meaningLines) {
    for (const pattern of PATTERNS) {
      if (matched.has(pattern.field)) continue
      if (!pattern.match(text)) continue

      if (pattern.type === 'cnt_amt') {
        // ラベルがマッチした時点で「取得済み」。件数が見つからなくても0として記録
        matched.add(pattern.field)
        // 「N件」を探す
        const mCnt = text.match(/([\d,]+)\s*件/)
        const cnt = mCnt ? parseInt(mCnt[1].replace(/,/g, '')) : 0
        result[`${pattern.field}_cnt`] = cnt
        // 「N円」を探す
        const mAmt = text.match(/([\d,]+)\s*円/)
        if (mAmt) {
          result[`${pattern.field}_amt`] = parseInt(mAmt[1].replace(/,/g, ''))
        }
      } else if (pattern.type === 'value') {
        // 「N回」「N枚」「N円」「N%」「N剤」等を探す
        const unitChar = pattern.unit === '%' ? '[%％]' : pattern.unit
        const re = new RegExp('([\\d,]+\\.?\\d*)\\s*' + unitChar)
        const m = text.match(re)
        if (m) {
          const s = m[1].replace(/,/g, '')
          const v = s.includes('.') ? parseFloat(s) : parseInt(s)
          if (!isNaN(v)) {
            result[pattern.field] = v
            matched.add(pattern.field)
          }
        }
      }
    }
  }

  // --- 薬剤調製料テーブル ---
  // テーブル行: 「内服 18,353 15,242,030 3,949,440 ...」
  // PDF.jsだと「内服」「18,353」「15,242,030」が別行になるので、
  // ラベル行の後に続く数値行をまとめて拾う
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim()
    if (!(line in ZAI_MAP)) continue
    const prefix = ZAI_MAP[line]

    // 次の数行から数値を収集
    const nums = []
    for (let j = i + 1; j < Math.min(i + 8, rawLines.length); j++) {
      const cleaned = rawLines[j].replace(/,/g, '').trim()
      if (/^-?\d+$/.test(cleaned)) {
        nums.push(parseInt(cleaned))
      } else {
        // 別のラベルに到達したら止める
        if (cleaned in ZAI_MAP || cleaned === '合計') break
        // カンマ付き数値
        const n = parseInt(rawLines[j].replace(/,/g, ''))
        if (!isNaN(n)) nums.push(n)
        else break
      }
    }

    if (nums.length >= 1) result[`${prefix}_zai`] = nums[0]
    if (nums.length >= 2) result[`${prefix}_yakuzai`] = nums[1]
    if (nums.length >= 3) result[`${prefix}_chozai`] = nums[2]
  }

  return result
}

// ============================================================
// raw → 報酬改定データ変換
// ============================================================

function convertToHoushuFormat(raw) {
  const r6 = {}

  // ヘルパー: rawにキーがあれば設定、なければ設定しない（不足扱い）
  function set(ourKey, ...rawKeys) {
    for (const rk of rawKeys) {
      if (rk in raw) { r6[ourKey] = raw[rk] || 0; return }
    }
    // rawKeysのいずれも存在しない → r6にキーを設定しない（不足）
  }

  // 基本料
  set('kihon_cnt', 'kihon_cnt')
  set('chiiki_cnt', 'chiiki_shien_cnt', 'chiiki_cnt')
  set('kouhatsu_cnt', 'kouhatsu_taisei_cnt', 'kouhatsu_cnt')
  set('renkei_cnt', 'renkei_kyoka_cnt', 'renkei_cnt')
  set('dx8_cnt', 'dx_cnt', 'dx8_cnt')
  set('dx10_cnt', 'dx10_cnt')
  set('zaitaku_taisei_cnt', 'zaitaku_taisei_cnt')
  set('yakan_cnt', 'yakan_cnt')

  // 薬剤調製料
  set('naifuku_cnt', 'naifuku_zai')
  set('sinsenn_cnt', 'sinsenn_zai')
  set('yuyaku_cnt', 'yuyaku_zai')
  set('tonpuku_cnt', 'tonpuku_zai')
  set('gaiyou_cnt', 'gaiyou_zai')
  set('chusya_cnt', 'chusya_zai')
  set('naiteki_cnt', 'naiteki_zai')

  // 薬学管理料
  set('kanri_27_cnt', 'chmgr_nai_cnt', 'chmgr_cnt')
  set('kanri_gaiyou_cnt', 'chmgr_other_cnt')
  set('fukuyaku_1i_cnt', 'fuyaku_a_cnt')
  // fukuyaku_1ro, 2ro はPDFに区分がない → 設定しない
  set('fukuyaku_2i_cnt', 'fuyaku_b_cnt')
  set('fukuyaku_3_cnt', 'fuyaku_c_cnt', 'fuyaku_3_cnt')
  set('kakaritsuke_shido_cnt', 'kakari_cnt')
  set('kakaritsuke_hokatsu_cnt', 'kakari_hokatsu_cnt')
  // 重複防止: 両方あれば合算、片方でもあれば取得済み
  if ('jukufuku_other_cnt' in raw || 'jukufuku_zan_cnt' in raw) {
    r6.jufuku_cnt = (raw.jukufuku_other_cnt || 0) + (raw.jukufuku_zan_cnt || 0)
  }
  set('mayaku_kanri_cnt', 'mayaku_shido_cnt')
  set('tokutei_1i_cnt', 'tokutei_1i_cnt')
  set('tokutei_1ro_cnt', 'tokutei_1ro_cnt')
  set('tokutei_2_cnt', 'tokutei_2_cnt')
  set('tokutei_3i_cnt', 'tokutei_3i_cnt')
  set('tokutei_3ro_cnt', 'tokutei_3ro_cnt')
  set('kyunyu_cnt', 'kyunyu_cnt')
  set('nyuyoji_cnt', 'nyuyoji_cnt')
  set('shoni_cnt', 'shoni_cnt')
  set('chozai_go_cnt', 'chozaigo_cnt')
  set('iryo_joho_cnt', 'iryo_joho_cnt')
  set('joho_1_cnt', 'fuyaku_joho1_cnt')
  set('joho_2_cnt', 'fuyaku_joho2_cnt')
  set('joho_3_cnt', 'fuyaku_joho3_cnt')
  set('gairai_1_cnt', 'gaifuku1_cnt')
  set('gairai_2_cnt', 'gaifuku2_cnt')
  set('shisetsu_renkei_cnt', 'setsurenkei_cnt')
  set('choseihi_1_cnt', 'fukuyou1_cnt')
  set('choseihi_2_cnt', 'fukuyou2_cnt')
  set('keikan_cnt', 'keikan_cnt')

  // 在宅
  set('zaitaku_houmon_1_cnt', 'zaitaku_1nin_cnt')
  set('zaitaku_houmon_2_cnt', 'zaitaku_other_cnt')
  set('kinkyu_houmon_1_cnt', 'zaitaku_kinkyu1_cnt')
  set('kinkyu_houmon_2_cnt', 'zaitaku_kinkyu2_cnt')
  set('kinkyu_kyodo_cnt', 'zaitaku_kyodo_cnt')
  set('taiin_kyodo_cnt', 'taiin_kyodo_cnt')
  set('zaitaku_ikou_cnt', 'zaitaku_iko_cnt')
  set('zaitaku_online_cnt', 'zaitaku_online_cnt')
  set('zaitaku_kinkyu_online_cnt', 'zaitaku_kinkyu_online_cnt')
  set('zaitaku_mayaku_cnt', 'zaitaku_mayaku_cnt')
  set('zaitaku_mayaku_chu_cnt', 'zaitaku_mayaku_chu_cnt')
  set('zaitaku_chushin_cnt', 'zaitaku_chushin_cnt')
  set('zaitaku_nyuyoji_cnt', 'zaitaku_nyuyoji_cnt')
  set('zaitaku_shoni_cnt', 'zaitaku_shoni_cnt')
  set('zaitaku_boushi_cnt', 'zaitaku_boushi_cnt')
  set('kyujitsu_homon_cnt', 'kyujitsu_homon_cnt')
  set('shinya_homon_cnt', 'shinya_homon_cnt')
  set('yakan_homon_cnt', 'yakan_homon_cnt')

  // 薬剤費
  const drugCost = (raw.naifuku_yakuzai || 0) + (raw.tonpuku_yakuzai || 0) +
    (raw.gaiyou_yakuzai || 0) + (raw.chusya_yakuzai || 0) +
    (raw.naiteki_yakuzai || 0) + (raw.zairyo_yakuzai || 0)

  const annualReward = raw.total_reward || 0
  const annualDrugCost = drugCost

  return { r6, annualReward, annualDrugCost }
}

// ============================================================
// 公開API
// ============================================================

export async function parsePdfFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const raw = await parsePdfContent(arrayBuffer)

  const hasBasic = raw.rx_count || raw.total_reward || raw.naifuku_zai
  const hasKasan = Object.keys(raw).some(k => k.endsWith('_cnt') && raw[k] > 0)

  if (!hasBasic && !hasKasan) {
    return { success: false, type: 'unknown', message: `${file.name}: データが見つかりません`, raw }
  }

  const { r6, annualReward, annualDrugCost } = convertToHoushuFormat(raw)
  const r6Filled = Object.values(r6).filter(v => v > 0).length
  const pdfType = hasBasic ? '統計表' : '加算内訳'

  return {
    success: true,
    type: pdfType,
    fileName: file.name,
    r6,
    annualReward,
    annualDrugCost,
    raw,
    r6Filled,
    message: `${file.name}: ${pdfType} → ${r6Filled}項目取得`,
  }
}

export async function parseMultiplePdfs(files) {
  const results = []
  const r6Total = {}
  let annualReward = 0
  let annualDrugCost = 0
  let successCount = 0
  let skipCount = 0

  for (const file of files) {
    try {
      const result = await parsePdfFile(file)
      results.push(result)
      if (result.success) {
        successCount++
        for (const [k, v] of Object.entries(result.r6)) {
          if (v > (r6Total[k] || 0)) r6Total[k] = v
        }
        if (result.annualReward > annualReward) annualReward = result.annualReward
        if (result.annualDrugCost > annualDrugCost) annualDrugCost = result.annualDrugCost
      } else {
        skipCount++
      }
    } catch (e) {
      results.push({ success: false, type: 'error', fileName: file.name, message: `${file.name}: エラー - ${e.message}` })
      skipCount++
    }
  }

  return {
    results,
    r6: r6Total,
    annualReward,
    annualDrugCost,
    successCount,
    skipCount,
    totalFiles: files.length,
  }
}
