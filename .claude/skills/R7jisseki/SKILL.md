---
name: r7-jisseki
description: レセコンPDF（統計表・加算種別内訳表）を読み取り、data/r7_extracted.json に保存する。/R7jisseki で実行。薬局の調剤報酬統計表や加算種別内訳表のPDFをアップロードしてJSON取込する際に使用。
---

# R7実績データ取込スキル

## リファレンス

- **`references/reference_output.json`** — データスキーマ（キー名と型）。このファイルのキー名・構造に合わせてJSONを書く。

## 基本方針

**統計表と加算表のPDFに記載されている全ての項目・値をJSONに保存する。**
HTMLフィールドに必要なものだけを選んで読み取るのではない。PDFの全行・全値がJSONに入る。
HTMLはJSONの一部を参照して表示するだけ。

## フロー

```
PDF → Claudeが全項目を読み取り → data/r7_extracted.json に書き出し → ブラウザが直接読み込み表示
```

**JSONファイル名は `data/r7_extracted.json` 固定。** 毎回同じファイルを上書きする。
**Pythonスクリプトやデータベースは使わない。** JSONファイルがそのままデータストアになる。

## 手順

### 1. PDFを読む

PDFディレクトリ（`PDF/`）にある統計表・加算表のPDFを読む。

### 2. Claudeが全項目を読み取る

PDFに記載されている**全ての行・全ての数値**を読み取る。

#### 読み取りルール

- **PDFに書いてある全ての項目を読み取る。スキーマにないものも含む**
- **座標は使わない。テキストの意味で判断する**
- **0件/0円は「取得済み(0)」。PDFに「0件」と書いてあれば0を保存する**
- **PDFに記載がない項目はJSONに入れない（nullのまま）**
- **数値のカンマは除去。円は整数、%は小数で保存**
- **推測しない。PDFに書いてない値は絶対に作らない**
- **絶対にPDFにない値を勝手に作るな。赤表示を消すためにデータを捏造してはならない**

#### 統計表から読み取る項目

**全て読み取る。** 以下は主要項目のDBキー対応表（HTMLが参照するもの）:

| PDF項目名 | DBキー | 型 |
|---|---|---|
| 処方箋受付回数 | rx_count | 整数 |
| 処方箋受付枚数 | rx_sheets | 整数 |
| 後発調剤率 | ge_rate | 小数(%) |
| 剤数 | zai_count | 整数 |
| 平均剤数 | avg_zai | 小数 |
| 調剤報酬金額 | total_reward | 整数(円) |
| 処方箋単価 | rx_price | 小数(円) |
| 保険分・患者負担金額 | hoken_futan | 整数(円) |
| 自費分・患者負担金額 | jihi_futan | 整数(円) |
| 保険外・患者負担金額 | hokengai_futan | 整数(円) |
| その他金額 | sonota_kingaku | 整数(円) |
| ＯＴＣ金額 | otc_kingaku | 整数(円) |
| 選定療養金額 | sentei_ryoyo | 整数(円) |
| 手帳活用実績（持参率） | techo_rate | 小数(%) |
| ３月以内受付回数 | rx_3month | 整数 |
| うち手帳持参有り | rx_3month_techo | 整数 |
| 調剤管理料(内服) 件数 | kanri_nai_cnt | 整数 |
| 調剤管理料(内服) 金額 | kanri_nai_amt | 整数(円) |
| 調剤管理料(内服以外) 件数 | kanri_gaiyou_cnt | 整数 |
| 調剤管理料(内服以外) 金額 | kanri_gaiyou_amt | 整数(円) |

**薬学管理料（統計表右側の全行）:** `{dbKey}_cnt`, `{dbKey}_amt` で保存。
**在宅（統計表2頁目の全行）:** `{dbKey}_cnt`, `{dbKey}_amt` で保存。
**薬剤調製料マトリクス（全列）:** `{dbKey}_zai`, `{dbKey}_yakuzai`, 各加算列も全て保存。
マトリクスの加算列は `kaz_{剤種}_{加算}` キーで保存する。

- 剤種プレフィックス: `nai`(内服) / `sin`(浸煎) / `yu`(湯薬) / `ton`(屯服) / `gai`(外用) / `chu`(注射) / `col`(内滴) / `mat`(材料)
- 加算サフィックス: `mayaku`(麻薬) / `doku`(毒薬) / `kakusei`(覚醒剤) / `mukyoko`(向精神薬) / `keiryo`(計量混合) / `keiryo_yo`(計量混合予製) / `jika`(自家製剤) / `jika_yo`(自家製剤予製) / `mukin`(無菌) / `jikou`(時間外等)
- **`kaz_{剤種}_keiryo` の値は統計表マトリクスの計量列セル値**（計量混合①液剤＋②散剤＋③軟膏等の合計）。加算表の明細行合計ではない。


#### 加算表から読み取る項目

**全ての行を読み取る。** 各行は `{dbKey}_cnt`, `{dbKey}_pts`, `{dbKey}_amt` で保存。

加算表には以下のセクションがある。全セクションの全行を読み取る:
- 【調剤基本料】の全行
- 【薬剤調製料】の全行（剤種別）
- 【薬剤調製料加算】の全行（剤種×加算種別の明細も含む）
- 【薬学管理料】の全行（服薬管理指導料の親項目配下の加算明細も含む）
- 【在宅等】の全行
- 【介護】の全行
- 全ての◆合計行


### 3. JSONファイルに書き出し

読み取ったデータを **`data/r7_extracted.json`** に書き出す。

`references/reference_output.json` のスキーマに合わせてr6オブジェクトを構築する。reference_output.jsonの各キーに対応する値をPDFから読み取った値で埋める。

書き出し後、Claudeが以下を**必ず**自分でチェックし、NGがあれば修正してから完了とする:

#### バリデーションチェック式（全てPDF記載値と一致すること）

統計表・加算表の両方に記載のある項目は、両表の値が一致することを確認する。

| # | チェック | 統計表 計算式 | 加算表 計算式 | 合計キー |
|---|---|---|---|---|
| ① | 調剤基本料合計 | （PDFに合計行があれば読み取る） | kihon_amt + kihon_doji_amt + chiiki_amt + kouhatsu_amt + renkei_amt + dx8_amt + dx6_amt + dx10_amt + zaitaku_taisei_amt + jikangai_amt + yakan_amt | kaisan_kihon_total |
| ② | 薬剤料/材料料合計 | naifuku_yakuzai + tonpuku_yakuzai + gaiyou_yakuzai + chusya_yakuzai + naiteki_yakuzai + zairyo_yakuzai | yakuzai_total（合計行） | yakuzai_total |
| ③ | 薬剤調製料合計 | naifuku_chosei + tonpuku_chosei + gaiyou_chosei + chusya_chosei + naiteki_chosei | naifuku_amt + tonpuku_amt + gaiyou_amt + chusya_amt + naiteki_amt | kaisan_chozai_total |
| ④ | 薬剤調製料加算合計 | 全kaz_*キーの合計 | kaz_mayaku_amt + kaz_doku_amt + kaz_kakusei_amt + kaz_mukyoko_amt + kaz_keiryo_amt + kaz_keiryo_yo_amt + kaz_jika_amt + kaz_jika_yo_amt + kaz_mukin_amt + kaz_jikou_amt | kaisan_kazan_total |
| ⑤ | 薬学管理料合計 | 統計表右側の薬学管理料全_amt合計 | 加算表の薬学管理料全_amt合計 | kaisan_yakugaku_total |
| ⑥ | 介護合計 | ー | kaigo_kyotaku_1_amt + kaigo_yobo_kyotaku_1_amt | kaisan_kaigo_total |
| ⑦ | 患者負担合計 | hoken_futan + jihi_futan + hokengai_futan | ー | （統計表の患者負担合計行） |
| ⑧ | 調剤報酬金額合計 | total_reward | kaisan_chozai_grand + yakuzai_total | total_reward |

### 4. ブラウザでバリデーション

「実績読込」ボタンを押してJSONを読み込んだ後、ブラウザ上で以下の8項目の合計を確認する。

**確認方法**: ブラウザに表示された各カテゴリの合計値をPDF記載の合計値と照合する。

| # | 確認箇所 | PDFと照合するブラウザ表示 |
|---|---|---|
| ① | 調剤基本料合計 | A.調剤基本料・体制加算 セクション合計 |
| ② | 薬剤料/材料料合計 | B.薬剤調製料 セクション内の薬剤料合計 |
| ③ | 薬剤調製料合計 | B.薬剤調製料 セクション合計 |
| ④ | 薬剤調製料加算合計 | B.薬剤調製料加算 セクション合計 |
| ⑤ | 薬学管理料合計 | C.薬学管理料 セクション合計 |
| ⑥ | 介護合計 | E.介護 セクション合計 |
| ⑦ | 患者負担合計 | F.患者負担 セクション合計 |
| ⑧ | 調剤報酬金額合計 | 年間合計（ヘッダー部）= PDF総合計と一致 |

- 赤表示（データ不足）の項目がないか確認
- 青表示（計算値）の数値が正しいか確認

## 注意事項

- **PDFの全データをJSONに保存する**。HTMLが参照するものだけでなく全て。
- **JSONファイル名は `data/r7_extracted.json` 固定**。毎回上書きする。別名で作らない。
- **推測しない**。PDFにない値はnullにする。
- **0は有効な値**。PDFに「0件」と書いてあれば0を保存する。
- **数値型を厳守**。文字列で保存しない。
- **絶対にPDFにない値を勝手に作るな**。PDFに記載がない項目にClaudeが0を入れることは禁止。記載がない項目はJSONに入れない（nullのまま）。HTMLで赤表示にしてユーザーに手入力を促す。赤表示を消すためにデータを捏造することは絶対にしてはならない。
