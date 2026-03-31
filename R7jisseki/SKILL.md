---
name: r7-jisseki
description: レセコンPDF（統計表・加算種別内訳表）を読み取り、data/r7_extracted.json に保存する。/R7jisseki で実行。薬局の調剤報酬統計表や加算種別内訳表のPDFをアップロードしてJSON取込する際に使用。
---

# R7実績データ取込スキル

## リファレンス

- **`references/reference_output.json`** — データスキーマ（キー名と型）。このファイルのキー名・構造に合わせてJSONを書く。

## 基本方針

**統計表と加算表のPDFに記載されている全ての項目・値をJSONに保存する。**

## フロー

```
PDF → Claudeが全項目を読み取り → data/r7_extracted.json に書き出し → ブラウザが直接読み込み表示
```

**JSONファイル名は `data/r7_extracted.json` 固定。** 毎回同じファイルを上書きする。

## 手順

### 1. PDFを読む

PDFディレクトリ（`PDF/`）にある統計表・加算表のPDFを読む。

### 2. Claudeが全項目を読み取る

PDFに記載されている**全ての行・全ての数値**を読み取る。

#### 読み取りルール

- **PDFに書いてある全ての項目を読み取る。スキーマにないものも含む**
- **スキーマにないものもがあればユーザーに報告しdata/r7_extracted.jsonに追加するか指示を仰ぐ**
- **スキーマにないものもがあればユーザーに報告し、次回のためにreference_output.jsonに追加するか指示を仰ぐ**
- **0は有効な値**。PDFに「0件」と書いてあれば0を保存する。
- **PDFに記載がない項目はJSONに入れない（nullのまま）**
- **数値のカンマは除去。円は整数、%は小数で保存**
- **絶対にPDFにない値を勝手に作るな。**
- **数値型を厳守**。文字列で保存しない。

### 3. JSONファイルに書き出し

読み取ったデータを **`data/r7_extracted.json`** に書き出す。

`references/reference_output.json` のスキーマに合わせてr6オブジェクトを構築する。reference_output.jsonの各キーに対応する値をPDFから読み取った値で埋める。

書き出し後、ブラウザで下記8項目の合計を確認し、NGがあれば修正してから完了とする。

### 4. ブラウザでバリデーション

「実績読込」ボタンを押してJSONを読み込んだ後、ブラウザ上で以下の8項目の合計をPDF記載値と照合する。
ユーザーにも示して確認してもらう

**確認方法**: ブラウザに表示された各カテゴリの合計値をPDF記載の合計値と照合する。

| # | チェック | 統計表 計算式 | 加算表 計算式 | 合計キー |
|---|---|---|---|---|
| ① | 調剤基本料合計 | （PDFに合計行があれば読み取る） | k_kihon_amt + k_kihon_doji_amt + k_chiiki_amt + k_kouhatsu_amt + k_renkei_amt + k_dx8_amt + k_dx6_amt + k_dx10_amt + k_zaitaku_taisei_amt + k_jikangai_amt + k_yakan_amt | k_kihon_grand_total |
| ② | 薬剤料/材料料合計 | t_naifuku_yakuzai + t_tonpuku_yakuzai + t_gaiyou_yakuzai + t_chusya_yakuzai + t_naiteki_yakuzai + t_zairyo_yakuzai | t_yakuzai_total（合計行） | t_yakuzai_total |
| ③ | 薬剤調製料合計 | t_naifuku_chosei + t_tonpuku_chosei + t_gaiyou_chosei + t_chusya_chosei + t_naiteki_chosei | k_naifuku_amt + k_tonpuku_amt + k_gaiyou_amt + k_chusya_amt + k_naiteki_amt | k_chozai_grand_total |
| ④ | 薬剤調製料加算合計 | 全t_kaz_*キーの合計 | k_kaz_mayaku_amt + k_kaz_doku_amt + k_kaz_kakusei_amt + k_kaz_mukyoko_amt + k_kaz_keiryo_amt + k_kaz_keiryo_yo_amt + k_kaz_jika_amt + k_kaz_jika_yo_amt + k_kaz_mukin_amt + k_kaz_jikou_amt | k_kazan_grand_total |
| ⑤ | 薬学管理料合計 | 統計表右側の薬学管理料全t_*_amt合計 | 加算表の薬学管理料全k_*_amt合計 | k_yakugaku_grand_total |
| ⑥ | 介護合計 | ー | k_kaigo_kyotaku_1_amt + k_kaigo_yobo_kyotaku_1_amt | k_kaigo_grand_total |
| ⑦ | 患者負担合計 | t_hoken_futan + t_jihi_futan + t_hokengai_futan | ー | （統計表の患者負担合計行） |
| ⑧ | 調剤報酬金額合計 | t_total_reward | k_chozai_total + t_yakuzai_total | t_total_reward |

- 赤表示（データ不足）の項目がないか確認
- 青表示（計算値）の数値が正しいか確認