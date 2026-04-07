// ====================================================================
// Overview Tab Component (separated from components.js)
// ====================================================================

const OverviewTab = {
  template: `<div>
<div class="section">
  <div class="section-title">令和8年度 調剤報酬改定の概要</div>
  <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">令和8年6月1日施行（薬価はR8年4月施行）。出典：厚生労働省「令和8年度診療報酬改定の概要【調剤】」令和8年3月5日版</p>
  <p style="font-size:13px;margin-bottom:16px;line-height:1.8">
    <a href="https://www.mhlw.go.jp/stf/newpage_67729.html" target="_blank" style="color:var(--teal);text-decoration:underline">令和8年度診療報酬改定について（厚生労働省）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/iryo_shido/r08_shinryohoshu_00001.html" target="_blank" style="color:var(--teal);text-decoration:underline">令和8年度診療報酬改定について（九州厚生局）</a><br>
    <a href="https://www.youtube.com/playlist?list=PLMG33RKISnWjFBIQEEGRuzwFbGAsk7uLD" target="_blank" style="color:var(--teal);text-decoration:underline">説明会動画（薬局：リスト番号1、18、21）</a><br>
    <a href="https://www.mhlw.go.jp/stf/newpage_71068.html" target="_blank" style="color:var(--teal);text-decoration:underline">説明会資料（薬局：資料番号0、18、19）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/000456078.pdf" target="_blank" style="color:var(--teal);text-decoration:underline">九州厚生局：令和8年度調剤報酬改定に伴う施設基準の届出等について</a><br>
    <a href="https://ika.shaho.co.jp/r06_ika_kaishaku/tokkei_todokede/" target="_blank" style="color:var(--teal);text-decoration:underline">施設基準等に係る届出書・届出様式（社会保険研究所）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/shinsei/online-shinsei.html" target="_blank" style="color:var(--teal);text-decoration:underline">電子申請について（九州厚生局）</a><br>
    <a href="https://kouseikyoku.mhlw.go.jp/kyushu/about/jimushoichiran.html" target="_blank" style="color:var(--teal);text-decoration:underline">お問合せ（九州厚生局事務所一覧）</a>
  </p>
  <div class="kpi-grid" style="margin-bottom:20px">
    <div class="kpi-card positive"><div class="kpi-label">診療報酬全体</div><div class="kpi-value" style="font-size:18px">+3.09%</div><div style="font-size:11px;color:var(--text-muted)">2年度平均</div></div>
    <div class="kpi-card negative"><div class="kpi-label">薬価改定率</div><div class="kpi-value" style="font-size:18px">▲0.86%</div><div style="font-size:11px;color:var(--text-muted)">R8年4月施行</div><div style="font-size:11px;color:var(--text-muted)">材料価格 ▲0.01% R8年6月施行</div></div>
    <div class="kpi-card"><div class="kpi-label">経過措置期限</div><div class="kpi-value" style="font-size:18px">R9.5.31</div></div>
    <div class="kpi-card"><div class="kpi-label">施設基準の届出書受付期間</div><div class="kpi-value" style="font-size:16px">R8.5.7〜6.1</div><div style="font-size:11px;color:var(--text-muted)">届出が必要なもの</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">調剤報酬の体系（令和8年改定後）</div>
  <img src="img/r8_taikei.png" alt="調剤報酬の体系（令和8年改定後）" style="width:100%;border-radius:var(--radius);border:1px solid #e0e0e0">
</div>

<div class="section">
  <div class="section-title">1. 賃上げ・物価対応</div>
  <div style="font-size:13px;line-height:1.8;margin-bottom:12px">
    <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:12px;font-size:12px;color:var(--text-muted)">
      賃上げ余力の回復・確保のための特例的な対応を含む必要な措置を講じるとともに、医療現場での生産性向上の取組と併せ、必要な措置を講じることで、ベースアップ実現を支援。
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius);border-left:3px solid var(--pos)">
        <div style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span>調剤ベースアップ評価料　<span style="font-family:'IBM Plex Mono',monospace;color:var(--pos)">4点</span></div>
        <div style="color:var(--text-muted);font-size:12px">
          <div style="margin-bottom:4px"><b>算定：</b>処方箋の受付1回につき所定点数を算定</div>
          <div style="margin-bottom:4px"><b>対象職員：</b>40歳未満の薬局勤務薬剤師・事務職員</div>
          <div style="margin-bottom:4px"><b>ベア目標：</b>R8・R9各年度 +3.2%（事務職員は+5.7%）</div>
          <div><b>R9年6月〜：</b>所定点数の100分の200（8点）に引上げ</div>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-faint)">施設基準：対象職員がいること／賃金改善の体制が整備されていること</div>
      </div>
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius);border-left:3px solid var(--amber)">
        <div style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span>調剤物価対応料　<span style="font-family:'IBM Plex Mono',monospace;color:var(--amber)">1点</span></div>
        <div style="color:var(--text-muted);font-size:12px">
          <div style="margin-bottom:4px"><b>算定：</b>処方箋受付1回につき、<b style="color:var(--neg)">3月に1回に限り</b>算定</div>
          <div style="margin-bottom:4px"><b>目的：</b>R8年度以降の物価上昇への対応分 ＋ R6年度以降の経営環境悪化への緊急対応分</div>
          <div style="margin-bottom:4px"><b>位置づけ：</b>調剤基本料に包括（調剤基本料等の算定に併せて算定）</div>
          <div><b>R9年6月〜：</b>所定点数の100分の200（2点）に引上げ</div>
        </div>
      </div>
    </div>
    <div style="padding:10px 14px;background:#fff8e1;border-radius:var(--radius);font-size:12px;color:var(--text)">
      <b>R8年度以降の対応：</b>保険薬局の経営状況等の調査を実施し、賃上げ措置の実績を詳細に把握。経済・物価動向が見通しから大きく変動し経営に支障が生じた場合は、R9年度予算で加減算を含む調整を行う。
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">2. 体制評価の見直し</div>
  <div style="font-size:13px;line-height:1.8">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--teal)"><span class="badge badge-modified">改定</span> 調剤基本料</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">面分業推進の観点から基本料1、3ハの引上げ。R6改定以降の経営環境悪化を踏まえた緊急対応として各調剤基本料（特別A・Bを除く）を引上げ。</div>
        <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
          <tr><td>基本料1</td><td style="text-align:right">45点</td><td style="text-align:right;color:var(--pos);font-weight:600">47点</td></tr>
          <tr><td>基本料2</td><td style="text-align:right">29点</td><td style="text-align:right;color:var(--pos);font-weight:600">30点</td></tr>
          <tr><td>基本料3イ</td><td style="text-align:right">24点</td><td style="text-align:right;color:var(--pos);font-weight:600">25点</td></tr>
          <tr><td>基本料3ロ</td><td style="text-align:right">19点</td><td style="text-align:right;color:var(--pos);font-weight:600">20点</td></tr>
          <tr><td>基本料3ハ</td><td style="text-align:right">35点</td><td style="text-align:right;color:var(--pos);font-weight:600">37点</td></tr>
          <tr><td>特別A</td><td style="text-align:right">32点</td><td style="text-align:right">5点</td></tr>
          <tr><td>特別B</td><td style="text-align:right">5点</td><td style="text-align:right">3点</td></tr>
        </tbody></table>
        <ul style="padding-left:16px;color:var(--text-muted);margin-top:8px;font-size:12px">
          <li>同一グループ300店舗以上の区分を撤廃（3ロ・3ハ統合）</li>
          <li>医療モール内の複数医療機関を1つとみなす集中率計算に変更</li>
          <li>特別Aの同一建物内診療所の除外規定を撤廃</li>
        </ul>
        <div style="margin-top:10px;padding:8px 10px;background:#fff3e0;border-radius:6px;font-size:11px;border:1px dashed var(--amber)">
          <div style="font-weight:700;margin-bottom:4px">〈都市部等への新規出店抑制〉</div>
          <div>R8年6月以降に新規開設する薬局に適用</div>
          <ul style="padding-left:14px;margin:4px 0 0">
            <li>都市部に立地し、小規模かつ処方箋集中率が高い場合は調剤基本料2</li>
            <li style="color:var(--neg);font-weight:600">門前薬局等立地依存減算 ▲15点</li>
            <li style="font-size:10px;color:var(--text-muted)">※都市部＝特別区・政令指定都市。ただし半径500m以内に他の保険薬局がない場合は除く</li>
          </ul>
        </div>
      </div>
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--pos)">一定の機能を有する薬局の体制の評価</div>
        <div style="margin-bottom:12px">
          <div style="padding:6px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:6px;font-size:11px;color:var(--del-text)"><b>後発医薬品調剤体制加算</b> ＋ <b>地域支援体制加算</b> → 統合して下記に再編</div>
          <div style="font-size:12px;font-weight:700;margin-bottom:4px"><span class="badge badge-merged">統合</span> 地域支援・医薬品供給対応体制加算</div>
          <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
            <tr><td colspan="3" style="font-size:11px;color:var(--text-muted);background:var(--surface1)">【基本料1の薬局】</td></tr>
            <tr><td>加算1</td><td style="text-align:right;font-size:11px;color:var(--text-faint)">-</td><td style="text-align:right;color:var(--pos);font-weight:600">27点</td></tr>
            <tr><td>加算2</td><td style="text-align:right">32点</td><td style="text-align:right;color:var(--pos);font-weight:600">59点</td></tr>
            <tr><td>加算3</td><td style="text-align:right">40点</td><td style="text-align:right;color:var(--pos);font-weight:600">67点</td></tr>
            <tr><td colspan="3" style="font-size:11px;color:var(--text-muted);background:var(--surface1)">【基本料1以外の薬局】</td></tr>
            <tr><td>加算4</td><td style="text-align:right">10点</td><td style="text-align:right;color:var(--pos);font-weight:600">37点</td></tr>
            <tr><td>加算5</td><td style="text-align:right">32点</td><td style="text-align:right;color:var(--pos);font-weight:600">59点</td></tr>
          </tbody></table>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="badge badge-new">新設</span><b>バイオ後続品調剤体制加算</b><span style="font-family:'IBM Plex Mono',monospace">50点</span></div>
          <div style="font-size:11px;color:var(--text-muted)">バイオ後続品の使用促進の観点から、バイオ後続品を調剤する体制の評価を新設</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="padding:6px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:4px;font-size:11px;color:var(--del-text)"><b>医療DX推進体制整備加算</b>（6点/8点/10点の3区分）＋ <b>医療情報取得加算</b> → 廃止して下記に一本化</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="badge badge-new">新設</span><b>電子的調剤情報連携体制整備加算</b><span style="font-family:'IBM Plex Mono',monospace">8点</span><span style="font-size:10px;color:var(--text-muted)">（月1回）</span></div>
          <div style="font-size:11px;color:var(--text-muted)">電子処方箋システムによる重複投薬等チェックを行う体制の評価</div>
        </div>
        <div>
          <div style="font-size:12px;margin-bottom:4px"><span class="badge badge-modified">改定</span> <b>在宅薬学総合体制加算</b></div>
          <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
            <tr><td>加算1</td><td style="text-align:right">15点</td><td style="text-align:right;color:var(--pos);font-weight:600">30点</td></tr>
            <tr><td>加算2 イ（個人宅）</td><td style="text-align:right">50点</td><td style="text-align:right;color:var(--pos);font-weight:600">100点</td></tr>
            <tr><td>加算2 ロ（施設）</td><td style="text-align:right">50点</td><td style="text-align:right">50点</td></tr>
          </tbody></table>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">在宅訪問を十分に行うための体制を整備する薬局を、実績に基づき評価（※在宅患者の処方箋に基づく対応の場合の加算）</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">3. 対人業務の評価見直し</div>
  <div style="font-size:13px;line-height:1.8">
    <div style="padding:14px;background:var(--surface2);border-radius:var(--radius);margin-bottom:16px">
      <div style="font-weight:700;margin-bottom:6px"><span class="badge badge-modified">改定</span> 調剤管理料</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">内服薬の調剤管理料を、長期処方（28日分以上）とそれ以外（27日分以下）との2区分に見直し。</div>
      <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">改定前</th><th style="text-align:right">改定後</th></tr></thead><tbody>
        <tr><td>7日以下</td><td style="text-align:right">4点</td><td style="text-align:right" rowspan="3">27日以下: 10点</td></tr>
        <tr><td>8〜14日</td><td style="text-align:right">28点</td></tr>
        <tr><td>15〜28日</td><td style="text-align:right">50点</td></tr>
        <tr><td>29日以上</td><td style="text-align:right">60点</td><td style="text-align:right">28日以上: 60点（据置）</td></tr>
        <tr><td>内服以外</td><td style="text-align:right">4点</td><td style="text-align:right;color:var(--pos);font-weight:600">10点</td></tr>
      </tbody></table>
      <p style="color:var(--text-muted);font-size:12px;margin-top:4px">調剤管理加算は廃止。</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--teal)">かかりつけ薬剤師の推進</div>
        <div style="padding:8px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:8px;font-size:11px;color:var(--del-text)"><b>かかりつけ薬剤師指導料</b>（76点）＋ <b>かかりつけ薬剤師包括管理料</b>（291点）→ 廃止して下記に再編</div>
        <div style="margin-bottom:8px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">電話等による服薬状況や残薬状況等の継続的な確認を評価</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>かかりつけ薬剤師フォローアップ加算</b><span style="font-family:'IBM Plex Mono',monospace">50点</span><span style="font-size:10px;color:var(--text-muted)">（3月に1回）</span></div>
        </div>
        <div style="margin-bottom:8px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">患家への訪問による服薬管理、残薬状況の確認等の実施、医療機関への情報提供を評価</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>かかりつけ薬剤師訪問加算</b><span style="font-family:'IBM Plex Mono',monospace">230点</span><span style="font-size:10px;color:var(--text-muted)">（6月に1回）</span></div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">多剤服用患者の一元的・継続的な把握を通じて、包括的な薬物治療の評価・介入を実践する取組を評価</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-modified">改定</span><b>服用薬剤調整支援料2</b><span style="font-family:'IBM Plex Mono',monospace">1,000点</span></div>
        </div>
      </div>
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--pos)">訪問薬剤管理指導の推進</div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px">在宅患者訪問薬剤管理指導料の見直し</div>
          <div style="font-size:12px;color:var(--text-muted)">算定間隔を<b>中6日以上</b>から<b style="color:var(--pos)">週1回算定</b>に見直し</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px">医師と同時訪問した際の評価</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">ポリファーマシー対策及び残薬対策を推進する観点から、医師及び薬剤師による同時訪問を評価</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>訪問薬剤管理医師同時指導料</b><span style="font-family:'IBM Plex Mono',monospace">150点</span></div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:4px">複数名で訪問した際の評価</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">行動面での運動興奮等がみられる患者に対する複数名訪問を評価</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>複数名薬剤管理指導訪問料</b><span style="font-family:'IBM Plex Mono',monospace">300点</span></div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--amber)">残薬対策・一元的管理の推進</div>
        <div style="padding:8px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:10px;font-size:11px;color:var(--del-text)"><b>重複投薬・相互作用等防止加算</b> → 廃止して下記2つに発展的再編</div>
        <div style="margin-bottom:10px">
          <div style="font-size:11px;color:var(--del-text);margin-bottom:2px">旧：重複防止加算（残薬以外）40点 →</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>薬学的有害事象等防止加算</b><span style="font-family:'IBM Plex Mono',monospace">50点<sup style="font-size:9px">※</sup>/30点</span></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">重複投薬・相互作用・副作用等の薬学的有害事象防止に係る介入を評価</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:11px;color:var(--del-text);margin-bottom:2px">旧：重複防止加算（残薬）20点 →</div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span class="badge badge-new">新設</span><b>調剤時残薬調整加算</b><span style="font-family:'IBM Plex Mono',monospace">50点<sup style="font-size:9px">※</sup>/30点</span></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">残薬状況の聞き取り・残薬調整を実施した場合を評価</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">※ 在宅患者の場合又はかかりつけ薬剤師が実施する場合</div>
      </div>
      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius)">
        <div style="font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--r6)">服薬指導の評価の充実</div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;margin-bottom:2px">吸入薬指導加算の対象疾患の拡大</div>
          <div style="font-size:12px;color:var(--text-muted)">インフルエンザ患者に対する吸入薬指導も評価</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;margin-bottom:2px">バイオ後続品の説明時の評価</div>
          <div style="font-size:12px;color:var(--text-muted)">バイオ後続品の選択に係る患者への説明を評価 → <b>特定薬剤管理指導料3ロ</b>の評価対象に追加</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">4. その他</div>
  <ul style="padding-left:16px;font-size:13px;line-height:1.8;color:var(--text-muted)">
    <li>在宅患者オンライン薬剤管理指導料・在宅患者緊急オンライン薬剤管理指導料を廃止し、服薬管理指導料4ロ・4ハに統合</li>
    <li>無菌製剤処理加算の対象を6歳未満→15歳未満に拡大、中心静脈栄養法用は137→237点に増点</li>
    <li>夜間休日における調剤の選定療養化（保険薬局でも開局時間外の特別の料金徴収が可能に）</li>
    <li>長期収載品の選定療養の患者負担を1/4→<b>1/2</b>に引上げ</li>
    <li>栄養保持を目的とした医薬品（エンシュア等）の保険給付に処方理由の記載が必要に</li>
  </ul>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius);font-size:12px;line-height:1.8">
      <div style="font-weight:700;margin-bottom:6px">薬担規則の改正（バイオ後続品関係）</div>
      <ul style="padding-left:18px;color:var(--text-muted);margin:0">
        <li>保険薬局はバイオ後続品の<b>備蓄体制の確保に努める</b>こと（努力義務）</li>
        <li>一般名処方の場合、患者にバイオ後続品の<b>説明を適切に行う</b>こと（義務）＋バイオ後続品を調剤するよう<b>努める</b>こと（努力義務）</li>
        <li>注射薬の銘柄名処方は<b>変更調剤不可</b></li>
      </ul>
    </div>
    <div style="padding:12px;background:var(--surface2);border-radius:var(--radius);font-size:12px;line-height:1.8">
      <div style="font-weight:700;margin-bottom:6px">届出・報告（概要p.52-54）</div>
      <ul style="padding-left:18px;color:var(--text-muted);margin:0">
        <li><b>新規届出要：</b>ベースアップ評価料、地域支援加算、在宅薬学総合体制2、バイオ後続品、服薬管理指導料注1</li>
        <li><b>届出不問：</b>電子的調剤情報連携体制整備（名称変更のみ）、調剤基本料（区分変更なし）、在宅薬学総合体制1（区分変更なし）</li>
        <li><b>届出期間：</b>R8.5.7〜6.1（必着）</li>
        <li><b>オンライン申請可能</b>（電子申請・届出等システム）</li>
      </ul>
    </div>
  </div>
</div>
</div>`
}
