#!/usr/bin/env python3
"""imported_data.json を読んでDBに保存する（API不要、SQLite直接）"""
import sys, io, json, sqlite3, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(__file__)
JSON_PATH = os.path.join(BASE, 'imported_data.json')
DB_PATH = os.path.join(BASE, 'data', 'houshu.db')

# JSONファイル読み込み
if not os.path.exists(JSON_PATH):
    print(f"エラー: {JSON_PATH} が見つかりません")
    print("先に /import-pdf スキルでJSONを生成してください")
    sys.exit(1)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"JSON読込: {JSON_PATH}")

# DB保存
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
conn = sqlite3.connect(DB_PATH)
conn.execute('''CREATE TABLE IF NOT EXISTS pharmacy_data (
    id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)''')

json_str = json.dumps(data, ensure_ascii=False)
conn.execute(
    "INSERT INTO pharmacy_data (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = ?",
    (json_str, json_str))
conn.commit()
conn.close()
print("DB保存完了")

# 充足レポート
r6 = data.get("r6", {})
sources = data.get("sources", {})

cnt_keys = [k for k in r6 if k.endswith('_cnt')]
indicators = ['rx_count','rx_sheets','ge_rate','zai_count','avg_zai',
              'total_reward','rx_price','techo_rate','rx_3month','rx_3month_techo',
              'hoken_futan','jihi_futan','hokengai_futan','sonota_kingaku','otc_kingaku','sentei_ryoyo']

filled_cnt = len(cnt_keys)
filled_ind = sum(1 for k in indicators if k in r6)
total = filled_cnt + filled_ind
print(f"\n取得済: {total} 項目 (_cnt: {filled_cnt}, 指標: {filled_ind})")

# 0以外の実績
print("\n=== 0以外の実績 ===")
for k in sorted(cnt_keys):
    v = r6[k]
    if v and v > 0:
        src = sources.get(k, '?')
        name = k.replace('_cnt', '')
        print(f"  [{src}] {name}: {v:,}")
for k in indicators:
    v = r6.get(k)
    if v:
        src = sources.get(k, '?')
        print(f"  [{src}] {k}: {v}")
