# カレンダーUI実装指示書

## 概要
`feature/calendar-ui` ブランチで、事務タスクタブにカレンダー月表示＋カンバン表示を実装する。
Googleカレンダー連携は不要。アプリ単体で完結させる。

## 現状
- ブランチ: `feature/calendar-ui`（mainから作成済み）
- `data/tasks.json`: subtasks対応済み（deadline=ISO日付, subtasks=[{id,label,done}]）
- `js/components.js` L315-517: 現在のTasksTabコンポーネント（カンバンのみ）
- `css/style.css`: 既存のカンバンCSS（.kb-* クラス）

## 実装すべき内容

### 1. ビュー切替トグル（Notion/Linear風）
```
事務タスク進捗（KPIカード）
[カレンダー] [カンバン]  ← セグメントボタンで切替
```
- localStorageに表示モードを保存
- `<component :is>` または v-if で切替

### 2. カレンダー月表示（自前実装、ライブラリ不要）

#### 月ヘッダー
```
  [<]  2026年5月  [>]
  月  火  水  木  金  土  日
```
- 前月/次月ボタンで月移動
- 「今日」ボタンで当月に戻る

#### 日付セル（CSS Grid 7列）
- 当月外の日付はグレーアウト
- 今日の日付は青丸で強調
- タスクがある日はドット表示（期限ベース）
  - 未着手: グレードット
  - 進行中: オレンジドット
  - 完了: 緑ドット
  - 超過: 赤ドット
- セルクリックで下にタスクリスト展開

#### 期限の色分け
| 状態 | 色 |
|------|------|
| 超過（期限 < 今日） | 赤 `var(--neg)` |
| 今日 | オレンジ `var(--amber)` |
| 3日以内 | 黄色 |
| それ以降 | 通常 |
| 完了 | グレー＋取消線 |

#### 日付クリック時のタスクリスト
```
▼ 5月1日（2件）
┌──────────────────────────────┐
│ ■ 調剤基本料の届出更新         │
│   届出の変更・新規  期限: 5/1   │
│   ████░░░░ 1/4               │  ← サブタスク進捗バー
│   □ 受付回数の集計             │
│   ☑ 様式84記入                │
│   □ 様式85記入                │
│   □ 提出                      │
└──────────────────────────────┘
```

### 3. カンバン表示（既存を改良）
- 既存のカンバン（L469-515）をベースに以下を追加:
  - カード内にサブタスク進捗バー: `2/4 ████░░`
  - サブタスクのチェックボックス（展開時）
  - 期限の色分け（超過=赤、今日=オレンジ）
  - サブタスクのtoggle操作 → saveTasks()で保存

### 4. サブタスク操作
- チェックボックスのON/OFFでdone切替
- 全サブタスク完了時にタスクステータスを自動で「完了」にはしない（手動）
- 進捗表示: `done数/total数` ＋ 細いプログレスバー（高さ4px）

### 5. タスク追加フォーム改良
- deadline入力を `<input type="date">` に変更（ISO日付）
- subtasksの追加UI（テキスト入力＋追加ボタン、後から追加可能）

## CSS設計

### カレンダー用クラス
```css
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
.cal-header { text-align: center; font-size: 11px; color: var(--text-muted); padding: 8px 0; }
.cal-cell { min-height: 48px; padding: 4px; border: 1px solid var(--border); cursor: pointer; }
.cal-cell:hover { background: var(--surface2); }
.cal-cell.today { background: #eff6ff; }
.cal-cell.other-month { opacity: 0.3; }
.cal-cell.selected { border-color: var(--text); border-width: 2px; }
.cal-date { font-size: 12px; font-weight: 500; }
.cal-date.today { background: var(--text); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.cal-dots { display: flex; gap: 3px; margin-top: 2px; }
.cal-dot { width: 6px; height: 6px; border-radius: 50%; }
.cal-dot-todo { background: #9ca3af; }
.cal-dot-wip { background: var(--amber); }
.cal-dot-done { background: var(--pos); }
.cal-dot-overdue { background: var(--neg); }
```

### サブタスク進捗バー
```css
.subtask-bar { height: 4px; border-radius: 2px; background: #e5e7eb; margin-top: 4px; }
.subtask-bar-fill { height: 100%; border-radius: 2px; background: var(--pos); transition: width 0.3s; }
.subtask-count { font-size: 11px; color: var(--text-muted); }
```

### ビュー切替
```css
.view-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.view-toggle-btn { padding: 6px 16px; font-size: 12px; cursor: pointer; border: none; background: white; }
.view-toggle-btn.active { background: var(--text); color: white; }
```

## データフロー
```
tasks.json（API経由）
  ↓ loadTasks()
reactive store { categories, tasks }
  ↓ computed
allTasks → カンバン列振り分け
         → カレンダー日付別グループ化
  ↓ 操作
saveTasks() → PUT /api/tasks
```

## 参考にするUIパターン
- **Notion**: セグメントボタンでビュー切替、カレンダーセルにタスクピル
- **Asana**: カードにサブタスク進捗バー、期限の色分け
- **Jooto/Backlog**: シンプルなカンバン、D&D操作

## 実装順序
1. CSSを `css/style.css` に追加
2. TasksTabのsetup()にカレンダーロジック追加（currentMonth, selectedDate, tasksForDate）
3. テンプレートにビュー切替トグル追加
4. カレンダー月表示テンプレート実装
5. 既存カンバンにサブタスク進捗表示追加
6. タスク追加フォームのdeadline入力をtype="date"に変更
7. 動作確認（start.batでサーバー起動→ブラウザ確認）

## 注意
- Vue.js 3 Composition API（ref, reactive, computed）を使用
- ライブラリ追加不要（vanilla CSS Grid + Vue.js）
- D&Dは既存のHTML5 drag APIをそのまま使う
- カレンダーのD&D（日付間移動で期限変更）は後回しでOK
- モバイル対応も後回しでOK、まずデスクトップで動くものを
