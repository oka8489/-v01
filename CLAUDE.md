# 報酬改定v02

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

### 2.
