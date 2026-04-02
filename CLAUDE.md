# 報酬改定v02

## 最重要ルール: docu/の資料に基づいて行動する

**全ての応答・提案・回答は、必ず 次の優先順位で行うこと**
### 1.`docu/` ディレクトリ内の資料・文書を根拠とすること
### 2.WEB検索を行い回答
### 3.自分が持っている一般的な知識で回答する場合は「一般的には」と付け加えること。

- `docu/令和８年度診療報酬改定の概要(2026.03.05).pdf` — 厚労省の改定概要
- `docu/令和８年度調剤報酬改定に伴う(2026.03.26).pdf` — 届出関連資料
- `docu/別表第三調剤点数表.pdf` — 告示の調剤報酬点数表全文（14ページ）
- `docu/別添3調剤報酬点数表に関する事項 .pdf` — 通知の留意事項全文（69ページ、別紙様式含む）
- `docu/様式（調剤）.pdf` — 調剤関連の様式集（9ページ）

**禁止事項:** 自分の曖昧な知識で回答しない。点数・要件・期限など改定に関する情報は、必ずdocu/のPDFを読んで確認してから回答する。PDFに記載がない場合はその旨をユーザーに伝え、推測で回答しない。

## サーバー起動

start.batでローカルサーバーを起動してからブラウザで開く。

## Python

パスは `C:\Users\Patch01\AppData\Local\Python\bin\python.exe`。WindowsストアのスタブがPATHで優先されるため、start.batではフルパスを指定している。

## ファイル構成

- `index.html` — シェルのみ（CSS/JSは外部ファイル）
- `css/style.css` — スタイル
- `js/fees.js` — 点数定義
- `js/components.js` — Vueコンポーネント
- `js/app.js` — Vueアプリ本体
- `data/r7_extracted.json` — R7実績データ（t_/k_プレフィックス付き）
- `data/task-definitions.js` — タスク定義
- `data/requirement-definitions.js` — 施設基準定義


## スキル
skill/にあるスキルを利用しながら、ユーザーの薬局事務を支援する


### 1.jisseki.skill

PDFを読んで、実績を入力してなどのトリガーワードで発動
レセコンデータを読み取り、実績をブラウザに入力する支援を行う
- `skill/jisseki/SKILL.md` — 実績取込スキル
- `skill/jisseki/references/reference_output.json` — データスキーマ

### 2. タスク管理

`data/tasks.json` を直接読み書きする。スキル不要。
「タスク追加して」「〇〇を進行中にして」等の指示でJSONを更新し、ブラウザリロードで反映。
