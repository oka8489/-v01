<script setup>
</script>

<template>
  <div>
    <!-- 概要情報 -->
    <div class="section">
      <div class="section-title">令和8年度 調剤報酬改定の概要</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        令和8年6月1日施行。技術料引き上げ（+0.25%）、薬価引き下げ（▲4.02%）、新設加算・廃止加算の整理を含む大幅改定です。
      </p>

      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card info">
          <div class="kpi-label">施行日</div>
          <div class="kpi-value" style="font-size:18px">2026.6.1</div>
        </div>
        <div class="kpi-card positive">
          <div class="kpi-label">技術料改定率</div>
          <div class="kpi-value" style="font-size:18px">+0.25%</div>
        </div>
        <div class="kpi-card negative">
          <div class="kpi-label">薬価改定率</div>
          <div class="kpi-value" style="font-size:18px">▲4.02%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">経過措置期限</div>
          <div class="kpi-value" style="font-size:18px">R9.5.31</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">主な変更ポイント</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        <div style="padding:12px;background:var(--new-bg);border-radius:var(--radius);border:1px solid #b3d4f7">
          <div style="font-weight:700;color:var(--new-text);margin-bottom:6px">新設（8項目）</div>
          <ul style="padding-left:16px;color:var(--new-text);line-height:1.8">
            <li>調剤物価対応料（1点/3月に1回）</li>
            <li>調剤ベースアップ評価料（4点）</li>
            <li>バイオ後続品調剤体制加算（50点）</li>
            <li>調剤時残薬調整加算（30〜50点）</li>
            <li>薬学的有害事象等防止加算（30〜50点）</li>
            <li>かかりつけ薬剤師フォローアップ加算（50点）</li>
            <li>かかりつけ薬剤師訪問加算（230点）</li>
            <li>複数名薬剤管理指導訪問料（300点）</li>
          </ul>
        </div>
        <div style="padding:12px;background:var(--del-bg);border-radius:var(--radius);border:1px solid #f5c6c6">
          <div style="font-weight:700;color:var(--del-text);margin-bottom:6px">廃止（5項目）</div>
          <ul style="padding-left:16px;color:var(--del-text);line-height:1.8">
            <li>後発医薬品調剤体制加算（経過措置あり）</li>
            <li>かかりつけ薬剤師指導料（76点）</li>
            <li>かかりつけ薬剤師包括管理料（291点）</li>
            <li>医療情報取得加算</li>
            <li>重複投薬・相互作用等防止加算</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">このシステムの使い方</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:12px">
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:4px">1. 点数設定</div>
          <div style="color:var(--text-muted)">PDFをドラッグ&ドロップして実績を取得、または手動で件数を入力します。</div>
        </div>
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:4px">2. 改定比較</div>
          <div style="color:var(--text-muted)">全項目のR6→R8の点数変更を一覧で確認できます。</div>
        </div>
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:4px">3. 経営影響</div>
          <div style="color:var(--text-muted)">実績データから年間売上への影響を試算します。</div>
        </div>
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:4px">4. 事務タスク</div>
          <div style="color:var(--text-muted)">届出変更・システム更新等の27項目をチェックリストで管理します。</div>
        </div>
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius)">
          <div style="font-weight:700;margin-bottom:4px">5. 施設基準</div>
          <div style="color:var(--text-muted)">地域支援体制9指標など施設基準の要件を確認します。</div>
        </div>
      </div>
    </div>
  </div>
</template>
