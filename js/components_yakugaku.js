// ====================================================================
// Yakugaku Kanri (薬学管理料) Tab Content
// Used inside RequirementsTab
// ====================================================================

const YAKUGAKU_TEMPLATE = `
<div v-if="subCategory==='yakugaku'" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      <button class="btn" :style="sub==='yg_kanri'?'background:var(--teal);color:white':''" @click="sub='yg_kanri'" style="font-size:12px;padding:6px 12px">調剤管理料</button>
      <button class="btn" :style="sub==='yg_zanyaku_yugai'?'background:var(--teal);color:white':''" @click="sub='yg_zanyaku_yugai'" style="font-size:12px;padding:6px 12px">残薬調整・有害事象防止</button>
      <button class="btn" :style="sub==='yg_fukuyaku'?'background:var(--teal);color:white':''" @click="sub='yg_fukuyaku'" style="font-size:12px;padding:6px 12px">服薬管理指導料</button>
      <button class="btn" :style="sub==='yg_mayaku'?'background:var(--teal);color:white':''" @click="sub='yg_mayaku'" style="font-size:12px;padding:6px 12px">麻薬管理指導加算</button>
      <button class="btn" :style="sub==='yg_tokutei'?'background:var(--teal);color:white':''" @click="sub='yg_tokutei'" style="font-size:12px;padding:6px 12px">特定薬剤管理指導加算</button>
      <button class="btn" :style="sub==='yg_nyuji_kyunyu'?'background:var(--teal);color:white':''" @click="sub='yg_nyuji_kyunyu'" style="font-size:12px;padding:6px 12px">乳幼児・小児・吸入薬</button>
      <button class="btn" :style="sub==='yg_kakaritsuke'?'background:var(--teal);color:white':''" @click="sub='yg_kakaritsuke'" style="font-size:12px;padding:6px 12px">かかりつけ薬剤師加算</button>
      <button class="btn" :style="sub==='yg_gairai'?'background:var(--teal);color:white':''" @click="sub='yg_gairai'" style="font-size:12px;padding:6px 12px">外来服薬支援料</button>
      <button class="btn" :style="sub==='yg_chosei'?'background:var(--teal);color:white':''" @click="sub='yg_chosei'" style="font-size:12px;padding:6px 12px">服用薬剤調整支援料</button>
      <button class="btn" :style="sub==='yg_chogo'?'background:var(--teal);color:white':''" @click="sub='yg_chogo'" style="font-size:12px;padding:6px 12px">調剤後薬剤管理指導料</button>
    </div>

    <div v-if="subCategory==='zaitaku'" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      <button class="btn" :style="sub==='yg_zaitaku'?'background:var(--teal);color:white':''" @click="sub='yg_zaitaku'" style="font-size:12px;padding:6px 12px">訪問薬剤管理指導</button>
      <button class="btn" :style="sub==='zt_kinkyu'?'background:var(--teal);color:white':''" @click="sub='zt_kinkyu'" style="font-size:12px;padding:6px 12px">緊急訪問</button>
      <button class="btn" :style="sub==='zt_kyodo'?'background:var(--teal);color:white':''" @click="sub='zt_kyodo'" style="font-size:12px;padding:6px 12px">緊急時等共同指導</button>
      <button class="btn" :style="sub==='zt_mayaku'?'background:var(--teal);color:white':''" @click="sub='zt_mayaku'" style="font-size:12px;padding:6px 12px">麻薬管理指導加算</button>
      <button class="btn" :style="sub==='zt_mayaku_chusha'?'background:var(--teal);color:white':''" @click="sub='zt_mayaku_chusha'" style="font-size:12px;padding:6px 12px">麻薬持続注射療法</button>
      <button class="btn" :style="sub==='zt_nyuji'?'background:var(--teal);color:white':''" @click="sub='zt_nyuji'" style="font-size:12px;padding:6px 12px">乳幼児加算</button>
      <button class="btn" :style="sub==='zt_shoni'?'background:var(--teal);color:white':''" @click="sub='zt_shoni'" style="font-size:12px;padding:6px 12px">小児特定加算</button>
      <button class="btn" :style="sub==='zt_chusin'?'background:var(--teal);color:white':''" @click="sub='zt_chusin'" style="font-size:12px;padding:6px 12px">中心静脈栄養法</button>
      <button class="btn" :style="sub==='zt_ikou'?'background:var(--teal);color:white':''" @click="sub='zt_ikou'" style="font-size:12px;padding:6px 12px">在宅移行初期</button>
      <button class="btn" :style="sub==='yg_zaitaku_new'?'background:var(--teal);color:white':''" @click="sub='yg_zaitaku_new'" style="font-size:12px;padding:6px 12px">R8新設（在宅）</button>
      <button class="btn" :style="sub==='yg_taiin'?'background:var(--teal);color:white':''" @click="sub='yg_taiin'" style="font-size:12px;padding:6px 12px">退院時共同指導料</button>
      <button class="btn" :style="sub==='yg_joho_keikan'?'background:var(--teal);color:white':''" @click="sub='yg_joho_keikan'" style="font-size:12px;padding:6px 12px">服薬情報等提供料・経管</button>
    </div>

    <div v-if="sub==='yg_kanri'">
      <div class="section">
        <div class="section-title">調剤管理料（区分10の2） <span class="badge badge-modified">改定</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">処方された薬剤について、<b style="color:var(--r6)">服薬状況等の情報収集・薬学的分析・薬剤服用歴への記録等を行った場合に算定</b>。R8で日数区分を4区分→2区分に簡素化。内服以外は4→10点に増点。調剤管理加算は廃止。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">全患者。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>内服薬1: 1剤につき算定（服用時点同一＝1剤、4剤分以上は算定不可）</li>
            <li>内服薬以外2: 処方箋受付1回につき</li>
            <li>隔日投与は実際の投与日数で判定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px">
              <div style="font-weight:700;margin-bottom:6px;font-size:11px;color:var(--text-faint)">R6（改定前）4区分</div>
              <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">点数</th></tr></thead><tbody>
                <tr><td>1 内服薬 イ 7日分以下</td><td style="text-align:right">4点</td></tr>
                <tr><td>1 内服薬 ロ 8〜14日分</td><td style="text-align:right">28点</td></tr>
                <tr><td>1 内服薬 ハ 15〜28日分</td><td style="text-align:right">50点</td></tr>
                <tr><td>1 内服薬 ニ 29日分以上</td><td style="text-align:right">60点</td></tr>
                <tr><td>2 内服以外</td><td style="text-align:right">4点</td></tr>
              </tbody></table>
            </div>
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px;border:2px solid var(--pos)">
              <div style="font-weight:700;margin-bottom:6px;font-size:11px;color:var(--pos)">R8（改定後）2区分</div>
              <table class="fee-table" style="font-size:12px"><thead><tr><th>区分</th><th style="text-align:right">点数</th></tr></thead><tbody>
                <tr><td style="color:var(--pos);font-weight:600">1 内服薬 イ 27日分以下</td><td style="text-align:right;color:var(--pos);font-weight:600">10点</td></tr>
                <tr><td>1 内服薬 ロ 28日分以上（長期処方）</td><td style="text-align:right">60点</td></tr>
                <tr><td style="color:var(--pos);font-weight:600">2 内服以外</td><td style="text-align:right;color:var(--pos);font-weight:600">10点</td></tr>
              </tbody></table>
            </div>
          </div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">4区分→2区分に簡素化し事務負担軽減。長期処方・リフィル処方推進に対応。調剤管理加算（3点）は廃止。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.17-20。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_zanyaku_yugai'">
      <div style="padding:8px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:12px;font-size:11px;color:var(--del-text)"><b>重複投薬・相互作用等防止加算</b>（残薬20点/残薬以外40点）→ 廃止して下記2つに発展的再編</div>
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> 調剤時残薬調整加算（注3）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">残薬が確認された患者において、処方医への照会の結果、残薬調整のための調剤日数変更が行われた場合に算定。旧「重複防止加算（残薬）20点」を発展的に再編。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">残薬が確認された患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>残薬確認後、処方医の指示又は処方医に対する照会の結果に基づき<b>7日分以上の調剤日数変更</b>が行われた場合</li>
            <li>6日分以下でも薬剤師が必要と判断し処方医照会の結果に基づく場合は理由をレセプト記載で算定可</li>
            <li>機械的な調整は不可。患者の意図的残薬かどうか確認必要</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>区分</th><th style="text-align:right">点数</th><th>対象</th></tr></thead><tbody>
            <tr><td>イ</td><td style="text-align:right">50点</td><td>在宅患者＋処方前に処方医に相談し提案が反映</td></tr>
            <tr><td>ロ</td><td style="text-align:right">50点</td><td>在宅患者（イ以外）</td></tr>
            <tr><td>ハ</td><td style="text-align:right">50点</td><td>かかりつけ薬剤師（イ・ロ以外）</td></tr>
            <tr><td>ニ</td><td style="text-align:right">30点</td><td>上記以外</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">残薬対策の強化。在宅・かかりつけ薬剤師の場合を50点に増点し、積極的な残薬調整を促進。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.17-20。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出</div>
          <div style="color:var(--text-muted)">届出不要。特別調剤基本料Bの薬局は算定不可。</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> 薬学的有害事象等防止加算（注4）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">重複投薬・相互作用等が確認された患者において、処方医への照会の結果、処方変更が行われた場合に算定（残薬調整を除く）。旧「重複防止加算（残薬以外）40点」を発展的に再編。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">重複投薬（薬理作用類似含む）、併用薬・飲食物との相互作用、その他薬学的に必要な事項が確認された患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>残薬調整を除く処方変更が対象</li>
            <li>電子処方箋の仕組みを用いた重複投薬確認も対象</li>
            <li>処方医に対する照会の結果、処方に変更が行われた場合</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>区分</th><th style="text-align:right">点数</th><th>対象</th></tr></thead><tbody>
            <tr><td>イ</td><td style="text-align:right">50点</td><td>在宅患者＋処方前に処方医に相談し提案が反映</td></tr>
            <tr><td>ロ</td><td style="text-align:right">50点</td><td>在宅患者（イ以外）</td></tr>
            <tr><td>ハ</td><td style="text-align:right">50点</td><td>かかりつけ薬剤師（イ・ロ以外）</td></tr>
            <tr><td>ニ</td><td style="text-align:right">30点</td><td>上記以外</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">薬学的有害事象（重複投薬・相互作用・副作用等）の防止に向けた薬剤師の積極的介入を促進。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.17-20。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出</div>
          <div style="color:var(--text-muted)">届出不要。特別調剤基本料Bの薬局は算定不可。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_fukuyaku'">
      <div class="section">
        <div class="section-title">服薬管理指導料（区分10の3） <span class="badge badge-modified">改定</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">かかりつけ薬剤師指導料・包括管理料を廃止し統合。かかりつけ薬剤師による指導を高く評価。在宅オンライン薬剤管理指導料も4ロ・4ハに統合。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">全患者。在宅訪問薬剤管理指導料算定患者は、別疾病の臨時処方のみ。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>かかりつけ薬剤師（1イ・2イ）: 患者が選択した特定の薬剤師が継続的・一元的に服薬管理。1患者1薬局1薬剤師。</li>
            <li>手帳を提示しない場合は2により算定</li>
            <li>注17特例: 手帳活用実績50%以下の薬局は<b>13点</b>（注6〜14の加算は算定不可）</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--text-faint)">R6（改定前）</div>
              <table class="fee-table" style="font-size:12px"><tbody>
                <tr><td>かかりつけ薬剤師指導料</td><td style="text-align:right"><b>76点</b></td></tr>
                <tr><td>かかりつけ薬剤師包括管理料</td><td style="text-align:right"><b>291点</b></td></tr>
                <tr style="border-top:2px solid var(--border)"><td>1 3月以内＋手帳持参</td><td style="text-align:right">45点</td></tr>
                <tr><td>2 1以外（手帳なし・3月超）</td><td style="text-align:right">59点</td></tr>
                <tr><td>3 介護施設入所者を訪問</td><td style="text-align:right">45点</td></tr>
                <tr><td>4 情報通信機器を用いた場合</td><td style="text-align:right">45点</td></tr>
                <tr style="border-top:2px solid var(--border)"><td>在宅患者オンライン薬剤管理指導料</td><td style="text-align:right"><b>59点</b></td></tr>
                <tr><td>在宅患者緊急オンライン薬剤管理指導料</td><td style="text-align:right"><b>59点</b></td></tr>
                <tr style="border-top:2px solid var(--border)"><td>注14特例（かかりつけ不在時・連携薬剤師）</td><td style="text-align:right"><b>59点</b></td></tr>
                <tr style="border-top:2px solid var(--border)"><td>特例（手帳活用率50%以下の薬局）</td><td style="text-align:right">13点</td></tr>
              </tbody></table>
              <div style="font-size:10px;color:var(--text-faint);margin-top:4px">※1の患者が手帳を持参しない場合は2で算定<br>※レセコンでは薬A（1・手帳あり）/薬B（1・手帳なし→59点）/薬C（2）と表記</div>
            </div>
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px;border:2px solid var(--pos)">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--pos)">R8（改定後）</div>
              <table class="fee-table" style="font-size:12px"><tbody>
                <tr><td style="color:var(--del-text);text-decoration:line-through">かかりつけ薬剤師指導料</td><td style="text-align:right;color:var(--del-text)">廃止</td></tr>
                <tr><td style="color:var(--del-text);text-decoration:line-through">かかりつけ薬剤師包括管理料</td><td style="text-align:right;color:var(--del-text)">廃止</td></tr>
                <tr style="border-top:2px solid var(--border)"><td>1イ 3月以内＋手帳・<b style="color:var(--pos)">かかりつけ</b></td><td style="text-align:right">45点</td></tr>
                <tr><td>1ロ 3月以内＋手帳・その他</td><td style="text-align:right">45点</td></tr>
                <tr><td>2イ 1以外・<b style="color:var(--pos)">かかりつけ</b></td><td style="text-align:right">59点</td></tr>
                <tr><td>2ロ 1以外・その他</td><td style="text-align:right">59点</td></tr>
                <tr><td>3 介護施設訪問</td><td style="text-align:right">45点</td></tr>
                <tr><td>4イ 情報通信機器・3月以内</td><td style="text-align:right">45点</td></tr>
                <tr><td style="color:var(--pos);font-weight:600">4ロ 情報通信機器・在宅</td><td style="text-align:right;color:var(--pos)">59点</td></tr>
                <tr><td style="color:var(--pos);font-weight:600">4ハ 情報通信機器・在宅急変</td><td style="text-align:right;color:var(--pos)">59点</td></tr>
                <tr><td>4ニ 情報通信機器・その他</td><td style="text-align:right">59点</td></tr>
                <tr style="border-top:2px solid var(--border)"><td style="color:var(--del-text);text-decoration:line-through">在宅患者オンライン薬剤管理指導料</td><td style="text-align:right;color:var(--del-text)">→4ロに統合</td></tr>
                <tr><td style="color:var(--del-text);text-decoration:line-through">在宅患者緊急オンライン薬剤管理指導料</td><td style="text-align:right;color:var(--del-text)">→4ハに統合</td></tr>
                <tr style="border-top:2px solid var(--border)"><td style="color:var(--del-text);text-decoration:line-through">注14特例（連携薬剤師）</td><td style="text-align:right;color:var(--del-text)">廃止→1ロ・2ロで算定</td></tr>
                <tr style="border-top:2px solid var(--border)"><td>特例（手帳50%以下）</td><td style="text-align:right">13点</td></tr>
              </tbody></table>
            </div>
          </div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">かかりつけ薬剤師の包括的評価から実績重視の評価へ転換。在宅オンラインを4ロ・4ハに統合し簡素化。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.20-35。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">1イ・2イ（かかりつけ薬剤師）は届出が必要（服薬管理指導料の注1）。特別調剤基本料Bの薬局は算定不可。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_mayaku'">
      <div class="section">
        <div class="section-title">麻薬管理指導加算 <span style="font-size:12px;font-weight:400;color:var(--pos)">22点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">麻薬を調剤した場合に、服用・保管の状況、副作用の有無等を確認し必要な指導等を行ったときに算定。R8改定での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">麻薬が処方された患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>服用及び保管の状況、副作用の有無等を確認</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。<b style="color:var(--neg)">麻薬小売業者免許</b>が必要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注6</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_tokutei'">
      <div class="section">
        <div class="section-title">特定薬剤管理指導加算1（注7） <span style="font-size:12px;font-weight:400;color:var(--pos)">1イ 10点 / 1ロ 5点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">特に安全管理が必要な医薬品（ハイリスク薬）が処方された患者に、当該薬剤の服用状況・副作用等の確認及び指導を行った場合に算定。処方箋受付1回につき。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b>1イ:</b> ハイリスク薬が新たに処方された患者（薬効分類が新規）。<br><b>1ロ:</b> ハイリスク薬の用量変更等があった患者で、薬剤師が必要と認めた場合。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>薬剤服用歴に基づき服用状況・副作用の有無等を確認し、必要な指導を実施</li>
            <li>ハイリスク薬: 抗悪性腫瘍剤、免疫抑制剤、不整脈用剤、抗てんかん剤、血液凝固阻止剤（内服薬）、ジギタリス製剤、テオフィリン製剤、カリウム製剤（注射薬）、精神神経用剤、糖尿病用剤、膵臓ホルモン剤、抗HIV薬（「薬局におけるハイリスク薬の薬学的管理指導に関する業務ガイドライン」参照）</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.30-31 区分10の3 注7。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注7</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">特定薬剤管理指導加算2（注8） <span style="font-size:12px;font-weight:400;color:var(--pos)">100点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">抗悪性腫瘍剤を注射されている患者に対し、副作用の確認・必要な指導を文書により行い、処方医に必要な情報を文書で提供した場合に算定。月1回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">医療機関において抗悪性腫瘍剤を注射されている患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>連携充実加算を届け出ている医療機関で抗悪性腫瘍剤を注射された患者が対象</li>
            <li>ア: レジメン（治療内容）等を確認し、必要な薬学的管理及び指導を行う</li>
            <li>イ: 電話等により服用状況・副作用（疑われる症状）の有無等を患者又は家族等に確認</li>
            <li>ウ: 確認結果を踏まえ、医療機関に必要な情報を文書で提供</li>
            <li>月1回に限り算定（処方箋受付がない月でも算定可）</li>
            <li>特別調剤基本料Aで特別な関係の医療機関への情報提供は算定不可</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">地域支援・医薬品供給対応体制加算</b>の届出が必要。薬剤師はあらかじめ医療機関HPでレジメン等を閲覧し情報把握すること。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。がん患者の外来化学療法推進に伴い薬局での副作用管理を評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.30-31 区分10の3 注8。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">地域支援・医薬品供給対応体制加算の届出が前提。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注8</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">特定薬剤管理指導加算3（注9） <span class="badge badge-modified">改定</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">3イ 5点 / 3ロ 10点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">RMP対象医薬品（3イ）又はバイオ後続品等の医薬品選択に関する説明（3ロ）を行った場合に算定。初回1回に限り。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b>3イ:</b> RMP（医薬品リスク管理計画）に基づく患者向け資材が作成されている医薬品が処方された患者。<br><b>3ロ:</b> 医薬品の選択に係る情報提供が必要な患者（バイオ後続品等）。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li><b>3イ:</b> RMP策定が義務づけられている医薬品を新たに処方された場合、患者向け資材を用いて指導。初回1回。</li>
            <li><b>3ロ:</b> 以下のいずれかの場合に算定（初回1回）:<br>
              ・選定療養対象の先発医薬品を選択しようとする患者への説明<br>
              ・供給不安定により銘柄変更が必要な患者への説明<br>
              ・<b style="color:var(--r8)">バイオ医薬品の一般名処方又はバイオ後続品が処方された患者への品質・有効性・安全性の説明</b></li>
            <li>対象医薬品が複数処方されている場合、それぞれ1回ずつ算定可。ただしイ・ロの重複算定不可</li>
            <li>特定薬剤管理指導加算1又は2との併算定可</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">3ロにバイオ後続品の選択に係る説明を追加</b>。薬担規則改正と連動し、薬剤師によるバイオ後続品の使用促進を評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.31-32 区分10の3 注9。改定の概要 p.35。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注9</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_nyuji_kyunyu'">
      <div class="section">
        <div class="section-title">乳幼児服薬指導加算（注10） <span style="font-size:12px;font-weight:400;color:var(--pos)">12点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">6歳未満の乳幼児に係る処方箋受付時に、体重・適切な剤形等の必要な情報を確認し、必要な服薬指導を行った場合に算定。処方箋受付1回につき。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">6歳未満の乳幼児。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>体重、適切な剤形その他必要な事項等の確認</li>
            <li>患者の家族等に対して適切な服薬指導を実施</li>
            <li>手帳にその内容を記載</li>
            <li>小児特定加算と併算定不可</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 区分10の3 注10。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注10</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">小児特定加算（注11） <span style="font-size:12px;font-weight:400;color:var(--pos)">350点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">児童福祉法に規定する障害児に係る処方箋受付時に、必要な薬学的管理及び指導を行った場合に算定。処方箋受付1回につき。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">児童福祉法第4条第2項に規定する障害児。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者又は家族に障害の特性に配慮した薬学的管理・指導を実施</li>
            <li>乳幼児服薬指導加算と併算定不可</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 区分10の3 注11。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注11</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">吸入薬指導加算（注12） <span class="badge badge-modified">改定</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">30点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">吸入薬が処方された患者に対し、文書及び練習用吸入器等を用いて吸入手技の指導を行い、処方医に文書で情報提供した場合に算定。<b style="color:var(--r8)">6月に1回</b>（R7: 3月に1回）。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">吸入薬が処方された患者。R7は喘息又はCOPDの患者に限定されていたが、<b style="color:var(--r8)">R8で疾患制限を撤廃（インフルエンザ吸入薬等も対象）</b>。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者・家族等又は医療機関の求めに応じ、患者の同意を得て実施</li>
            <li>文書及び練習用吸入器等を用いて必要な薬学的管理及び指導を実施</li>
            <li>処方医に対し必要な情報を文書で提供</li>
            <li>6月に1回に限り算定（R7: 3月に1回）</li>
            <li>服薬管理指導料の4ロ・4ハを算定する場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">R8で対象にインフルエンザの吸入薬を追加</b>。算定間隔を3月→6月に1回に変更。対象拡大に伴い頻度を調整。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 区分10の3 注12。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注12</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_kakaritsuke'">
      <div class="section">
        <div class="section-title" style="border-left:4px solid var(--teal);padding-left:8px">かかりつけ薬剤師の推進</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="padding:8px 10px;background:var(--del-bg);border-radius:6px;margin-bottom:10px;color:var(--del-text)"><b>かかりつけ薬剤師指導料</b>（76点）＋ <b>かかりつけ薬剤師包括管理料</b>（291点）→ 廃止して下記に再編</div>
          <div style="font-weight:700;margin-bottom:4px">包括評価から実績評価へ</div>
          <div style="color:var(--text-muted);margin-bottom:10px">R6では「かかりつけ薬剤師が指導すれば76点」という包括的な評価だったが、R8では服薬管理指導料に統合（点数は45点/59点で同額）した上で、<b>実際に行った行為に対して加算</b>する仕組みに転換。</div>
          <div style="display:flex;gap:12px;margin-bottom:10px">
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--text-faint)">R6（改定前）</div>
              <table class="fee-table" style="font-size:12px"><tbody>
                <tr><td>かかりつけ薬剤師指導料</td><td style="text-align:right">76点</td></tr>
                <tr><td>服薬管理指導料1（それ以外）</td><td style="text-align:right">45点</td></tr>
                <tr><td>服薬管理指導料2（それ以外）</td><td style="text-align:right">59点</td></tr>
              </tbody></table>
            </div>
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px;border:2px solid var(--pos)">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--pos)">R8（改定後）</div>
              <table class="fee-table" style="font-size:12px"><tbody>
                <tr><td>服薬管理指導料1イ（かかりつけ）</td><td style="text-align:right">45点</td></tr>
                <tr><td>服薬管理指導料1ロ（それ以外）</td><td style="text-align:right">45点</td></tr>
                <tr><td>服薬管理指導料2イ（かかりつけ）</td><td style="text-align:right">59点</td></tr>
                <tr><td>服薬管理指導料2ロ（それ以外）</td><td style="text-align:right">59点</td></tr>
              </tbody></table>
              <div style="font-size:11px;color:var(--text-faint);margin-top:4px">※ 基本点数は同額。差は下記の加算で評価</div>
            </div>
          </div>
          <div style="font-weight:700;margin-bottom:4px">かかりつけ薬剤師としての実績に応じた加算</div>
          <div style="color:var(--text-muted);margin-bottom:4px">電話等による服薬状況や残薬状況等の継続的な確認を評価</div>
          <div style="margin-bottom:6px;padding-left:12px"><span class="badge badge-new">新設</span> <b>かかりつけ薬剤師フォローアップ加算</b> 50点（3月に1回）</div>
          <div style="color:var(--text-muted);margin-bottom:4px">患家への訪問による服薬管理、残薬状況の確認等の実施、医療機関への情報提供を評価</div>
          <div style="margin-bottom:6px;padding-left:12px"><span class="badge badge-new">新設</span> <b>かかりつけ薬剤師訪問加算</b> 230点（6月に1回）</div>
          <div style="color:var(--text-muted);margin-bottom:4px">多剤服用患者の一元的・継続的な把握を通じて、包括的な薬物治療の評価・介入を実践する取組を評価</div>
          <div style="margin-bottom:4px;padding-left:12px"><span class="badge badge-modified">改定</span> <b>服用薬剤調整支援料2</b> 1,000点</div>
          <div style="font-size:11px;color:var(--neg);margin-bottom:6px;padding-left:12px">※R8年度中（R8.6〜R9.5）は算定不可。R9年6月1日から適用。R8年度中はR6の基準（イ110点/ロ90点）で算定。</div>
          <div style="margin-top:12px"><img src="img/r8_kakarituke.png" alt="かかりつけ薬剤師フォローアップ加算・訪問加算の概要" style="width:100%;border-radius:var(--radius);border:1px solid var(--border)"></div>
          <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap"><iframe width="48%" height="200" src="https://www.youtube.com/embed/sane1HyzZKs" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius)"></iframe><iframe width="48%" height="200" src="https://www.youtube.com/embed/1xepYKArb3M" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius)"></iframe></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> フォローアップ加算（注13） <span style="font-size:12px;font-weight:400;color:var(--pos)">50点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">かかりつけ薬剤師が、調剤後の次回処方箋持参までの間に服薬状況・残薬状況等を電話等で継続的に確認した場合に算定。3月に1回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">服薬管理指導料1イ又は2イを算定している患者であって、直近6ヶ月に以下のいずれかを算定したもの:<br>外来服薬支援料1 / 服用薬剤調整支援料1・2 / 調剤時残薬調整加算 / 薬学的有害事象等防止加算</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>かかりつけ薬剤師が電話等により服薬状況・残薬状況等を継続的に確認及び必要な指導等を実施</li>
            <li>前回調剤後、当該患者が再度処方箋を持参するまでの間に実施</li>
            <li>一方的な情報発信のみでは不可（<b>双方向性が必要</b>）</li>
            <li>患者又はその家族等の求めに応じて実施</li>
            <li>3月に1回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">かかりつけ薬剤師の施設基準</b>の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">R8新設。</b>かかりつけ薬剤師の包括的評価から、服薬後のフォローアップ実績を個別に評価する方向へ転換。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 区分10の3 注13。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">かかりつけ薬剤師の施設基準の届出が前提。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注13</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> 訪問加算（注14） <span style="font-size:12px;font-weight:400;color:var(--pos)">230点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">かかりつけ薬剤師が患家を訪問し、残薬整理・服用薬管理指導を実施し、処方医に情報提供した場合に算定。6月に1回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">服薬管理指導料1イ又は2イを算定している患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者又はその家族等の求めに応じて患家を訪問</li>
            <li>かかりつけ薬剤師が服用薬の服薬管理、残薬状況の確認等を実施</li>
            <li>その結果を保険医療機関に情報提供</li>
            <li>交通費は患家負担</li>
            <li>6月に1回に限り算定</li>
            <li>外来服薬支援料1・在宅訪問薬剤管理指導料・服薬情報等提供料を算定している患者は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">かかりつけ薬剤師の施設基準</b>の届出が前提。かかりつけ薬剤師の要件: 保険薬剤師3年以上の経験、週31時間以上勤務、当該薬局に6ヶ月以上在籍、研修認定取得、地域活動参画。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">R8新設。</b>かかりつけ薬剤師の包括的評価（旧指導料76点）から実績重視へ転換。残薬調整のための患家訪問を個別に評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 区分10の3 注14。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">かかりつけ薬剤師の施設基準の届出が前提。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分10の3 注14</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title" style="border-left:4px solid var(--amber);padding-left:8px">かかりつけ薬剤師の施設基準</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. かかりつけ薬剤師の要件（全て満たすこと）</div>
          <div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:10px">
            <div style="font-weight:600;margin-bottom:4px">(1) 勤務経験等</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:6px">
              <li>保険薬剤師として<b>3年以上</b>の保険薬局勤務経験（病院薬剤師1年まで算入可）</li>
              <li>当該薬局に<b>週31時間以上</b>勤務（育休等は週24時間以上かつ週4日以上）</li>
              <li>当該薬局に継続して<b>6か月以上</b>在籍（産休・育休前の在籍期間は合算可）</li>
            </ul>
            <div style="font-weight:600;margin-bottom:4px">(2) 研修認定</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:6px">
              <li>薬剤師認定制度認証機構が認証している<b>研修認定制度等の研修認定</b>を取得</li>
            </ul>
            <div style="font-weight:600;margin-bottom:4px">(3) 地域活動</div>
            <ul style="padding-left:18px;color:var(--text-muted)">
              <li>医療に係る<b>地域活動の取組</b>に参画していること</li>
            </ul>
          </div>
          <div style="font-weight:700;margin-bottom:6px">2. 薬局の要件（届出時点で全て満たすこと）</div>
          <div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:10px">
            <div style="font-weight:600;margin-bottom:4px">(1) 以下のいずれかを満たすこと</div>
            <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:6px">
              <li>ア: 常勤の保険薬剤師の当該薬局の在籍期間が<b>平均1年以上</b></li>
              <li>イ: 管理薬剤師が当該薬局に継続して<b>3年以上</b>在籍</li>
            </ul>
            <div style="font-weight:600;margin-bottom:4px">(2) プライバシー配慮</div>
            <ul style="padding-left:18px;color:var(--text-muted)">
              <li>患者との会話が他の患者に聞こえないようパーテーション等で区切られた<b>独立したカウンター</b>を有すること</li>
            </ul>
          </div>
          <div style="font-weight:700;margin-bottom:6px">3. 経過措置</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--amber-l);border-radius:6px"><b style="color:var(--amber)">R8年5月31日まで</b>にかかりつけ薬剤師指導料に係る施設基準の届出を行っている場合は、同年<b style="color:var(--amber)">11月30日まで</b>の間は薬局の要件2(1)を満たすものとみなす。</div>
          <div style="font-weight:700;margin-bottom:6px">4. 届出</div>
          <div style="color:var(--text-muted)">かかりつけ薬剤師が服薬管理指導を行う旨の届出が必要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：改定の概要 p.30。告示第71号 施設基準。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_gairai'">
      <div class="section">
        <div class="section-title">外来服薬支援料（区分14の2）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">自己による服薬管理が困難な患者の服薬管理を支援、又は一包化を行った場合に算定。R8改定での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>支援料1: 自己による服薬管理が困難な外来患者。在宅訪問管理指導料算定患者は不可。</li>
            <li>支援料2: 多種類の薬剤が投与されている患者、又は心身の特性により錠剤等の服用が困難な患者。</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>支援料1: 処方医に治療上の必要性と服薬管理支援の必要性の了解を得て実施。月1回。</li>
            <li>支援料2: 2剤以上の内服薬又は1剤3種類以上の一包化+必要な指導。</li>
            <li>施設連携加算: 介護施設を訪問し施設職員と協働した服薬管理支援。月1回。</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>区分</th><th style="text-align:right">点数</th><th>備考</th></tr></thead><tbody>
            <tr><td>支援料1</td><td style="text-align:right">185点</td><td>月1回</td></tr>
            <tr><td>支援料2（42日以下）</td><td style="text-align:right">34点×</td><td>7日ごとに加算</td></tr>
            <tr><td>支援料2（43日以上）</td><td style="text-align:right">240点</td><td></td></tr>
            <tr><td>施設連携加算</td><td style="text-align:right">50点</td><td>月1回</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">5. 通知</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.36-38。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 届出</div>
          <div style="color:var(--text-muted)">届出不要。特別調剤基本料Bの薬局は算定不可。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_chosei'">
      <div class="section">
        <div class="section-title">服用薬剤調整支援料1（区分14の3） <span style="font-size:12px;font-weight:400;color:var(--pos)">125点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">6種類以上の内服薬が処方されている患者について、処方医に文書で減薬を提案し、実際に2種類以上の減少が4週間以上継続した場合に算定。月1回。R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">内服を開始して4週間以上経過した内服薬6種類以上を、当該保険薬局で調剤している患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>処方医に対して文書を用いて減薬の提案を実施</li>
            <li>提案により、当該患者の内服薬が<b>2種類以上減少</b>し、その状態が<b>4週間以上</b>継続</li>
            <li>月1回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。ポリファーマシー対策として減薬の実績を評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.38-40。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分14の3</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">服用薬剤調整支援料2（区分14の3） <span class="badge badge-modified">改定</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">R8: イ110点/ロ90点 → R9.6〜: 1,000点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">複数の医療機関から6種類以上の内服薬が処方されている患者について、<b style="color:var(--r8)">かかりつけ薬剤師</b>（研修修了者に限る）が薬物療法の最適化サイクルを実践し、処方医に文書で提案した場合に算定。R6の110点→R8で<b style="color:var(--r8)">1,000点</b>に大幅増点。<b style="color:var(--neg)">R9年6月1日から適用。</b></div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">複数の保険医療機関から6種類以上の内服薬（特に規定するものを除く）が処方されている患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者又は家族等の求めに応じて実施</li>
            <li><b style="color:var(--r8)">かかりつけ薬剤師</b>（服薬状況等に係る総合的な管理及び評価を行うために必要な研修を受けた者に限る）が実施</li>
            <li>服用中の薬剤を<b>継続的及び一元的に把握</b>し、薬剤調整を必要と認める場合に<b>必要な評価等を実施</b>した上で、処方医に文書で提案</li>
            <li>6月に1回に限り算定。かかりつけ薬剤師1人につき<b>月4回まで</b></li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 具体的に必要な実施事項（留意事項通知）</div>
          <div style="padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:8px">
            <ul style="padding-left:18px;color:var(--text-muted);margin:0">
              <li>ア: 薬物治療に関する患者又は家族等からの<b>主観的情報</b>の聴取</li>
              <li>イ: 検査値等の薬物治療に必要な<b>客観的情報</b>の収集</li>
              <li>ウ: 服薬支援に必要な患者の<b>生活状況及び意向</b>に関する情報の聴取</li>
              <li>エ: 各服用薬剤がもたらす<b>治療効果及び有害事象</b>の評価</li>
              <li>オ: 解決すべき<b>薬剤関連問題（MRP/DRP）の特定</b>及び整理</li>
              <li>カ: 服用薬剤調整後の<b>観察計画及び対応案</b>の立案</li>
            </ul>
          </div>
          <div style="font-weight:700;margin-bottom:6px">5. 点数比較</div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--text-faint)">R6（改定前）</div>
              <div style="color:var(--text-muted)">イ かかりつけ薬剤師の届出をしている薬局: <b>110点</b><br>ロ イ以外: <b>90点</b><br>頻度: 3月に1回<br>実施者: 保険薬剤師（誰でも可）<br>内容: 重複投薬等の確認→解消提案</div>
            </div>
            <div style="flex:1;padding:10px;background:var(--surface2);border-radius:6px;border:2px solid var(--pos)">
              <div style="font-weight:700;margin-bottom:4px;font-size:11px;color:var(--pos)">R8（改定後）</div>
              <div style="color:var(--text-muted)"><b style="color:var(--pos)">1,000点</b>（一本化）<br>頻度: 6月に1回<br>実施者: <b>かかりつけ薬剤師（研修修了者）</b><br>内容: 薬物療法の最適化サイクル全体を実践→提案<br><b style="color:var(--neg)">R9年6月1日から適用</b></div>
            </div>
          </div>
          <div style="font-weight:700;margin-bottom:6px">6. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">「重複薬を見つけて報告」（受動的）→「薬物療法の最適化サイクルの包括的実践」（能動的）に転換。</b>MRP/DRP特定→推奨案提示→アウトカムモニターの循環を通じて、かかりつけ薬剤師によるポリファーマシー患者への包括的介入を高く評価。R8年度中は算定不可（R9年6月1日から適用）。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.38-40。改定の概要 p.32。</div>
          <div style="font-weight:700;margin-bottom:6px">8. 届出・免許・報告</div>
          <div style="color:var(--text-muted)"><b style="color:var(--neg)">老年薬学服薬総合評価研修修了</b>又は<b style="color:var(--neg)">老年薬学認定薬剤師</b>が必要。かかりつけ薬剤師の施設基準の届出が前提。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分14の3。改定の概要 p.32。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_chogo'">
      <div class="section">
        <div class="section-title">調剤後薬剤管理指導料（区分14の4）</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">糖尿病患者又は慢性心不全患者に対し、調剤後に電話等で服用状況・副作用を確認し、処方医に情報提供した場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>1: 新規処方又は用量変更のインスリン製剤・SU剤を使用する糖尿病患者</li>
            <li>2: 心疾患入院歴あり＋複数の循環器治療薬を処方されている慢性心不全患者 <span class="badge badge-new">新設</span></li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>調剤後に電話等で服用状況・副作用を確認（調剤同日は不可）</li>
            <li>処方医へ文書で情報提供</li>
            <li>月1回。地域支援・医薬品供給対応体制加算2〜5の届出が必要。</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 点数</div>
          <div style="color:var(--text-muted);margin-bottom:8px">1（糖尿病）60点、2（慢性心不全）60点。いずれも月1回。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容</div>
          <div style="color:var(--text-muted);margin-bottom:8px">2（慢性心不全）がR8新設。再入院抑制の観点から薬局の継続的フォローを評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知</div>
          <div style="color:var(--text-muted)">保医発0305第6号 別添3 p.40-42。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_zaitaku'">
      <div class="section">
        <div class="section-title">訪問薬剤管理指導料（区分15） <span class="badge badge-modified">改定</span> <span style="font-size:12px;font-weight:400;color:var(--pos)">1: 650点 / 2: 320点 / 3: 290点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">在宅療養中の通院困難な患者に対し、医師の指示に基づき薬学的管理指導計画を策定し訪問薬剤管理指導を行った場合に算定。R8で算定間隔を<b style="color:var(--r8)">中6日以上→週1回</b>に見直し。</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>区分</th><th style="text-align:right">点数</th><th>対象</th><th>イメージ</th><th>算定回数</th></tr></thead><tbody>
            <tr><td><b>1</b></td><td style="text-align:right">650点</td><td>単一建物診療患者が<b>1人</b></td><td>個人宅への訪問</td><td>月4回（週1回限度）</td></tr>
            <tr><td><b>2</b></td><td style="text-align:right">320点</td><td>同<b>2〜9人</b></td><td>小規模施設</td><td>月4回（週1回限度）</td></tr>
            <tr><td><b>3</b></td><td style="text-align:right">290点</td><td>同<b>10人以上</b></td><td>大規模施設</td><td>月4回（週1回限度）</td></tr>
          </tbody></table>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:8px">※「単一建物診療患者」＝同一建物に居住する患者のうち、同一月に訪問薬剤管理指導を行った人数で判定。末期の悪性腫瘍等の患者は週2回かつ月8回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">在宅で療養を行っている通院が困難な患者。独歩で来局できる者は対象外。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>医師の指示に基づく薬学的管理指導計画の策定（少なくとも月1回見直し）</li>
            <li>月4回まで（末期の悪性腫瘍・注射による麻薬・中心静脈栄養法の患者: 週2回かつ月8回）</li>
            <li><b style="color:var(--r8)">月2回以上算定の場合は週1回を限度</b>（R7: 中6日以上）</li>
            <li>薬剤師1人につき週40回上限</li>
            <li>16km超は特殊事情がない限り算定不可</li>
            <li><b style="color:var(--r8)">休日・夜間を含む開局時間外の調剤及び訪問対応体制の整備が必要</b>（初回訪問時に連絡先等を文書交付）</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">在宅訪問薬剤管理指導を行う旨の届出</b>が必要。在宅協力薬局との連携による夜間・休日対応体制の整備。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">算定間隔を中6日以上→週1回に見直し。夜間休日の連絡体制整備を要件に追加。</b>在宅医療の推進に伴い、柔軟な訪問スケジュールを可能にする。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.43-50。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が必要。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_kinkyu'">
      <div class="section">
        <div class="section-title">在宅患者緊急訪問薬剤管理指導料（区分15の2） <span style="font-size:12px;font-weight:400;color:var(--pos)">1: 500点 / 2: 200点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">訪問薬剤管理指導を実施している患者の状態急変等に伴い、医師の求めにより緊急に患家を訪問して必要な薬学的管理指導を行った場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b>1:</b> 計画的な訪問薬剤管理指導に係る疾患の急変に伴うもの。<br><b>2:</b> 1以外（処方変更等）。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>医師の求めにより緊急に患家を訪問</li>
            <li>1: 月4回まで（末期の患者等: 月8回）</li>
            <li>訪問薬剤管理指導料と同日は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.50-52。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が前提。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の2</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_kyodo'">
      <div class="section">
        <div class="section-title">在宅患者緊急時等共同指導料（区分15の3） <span style="font-size:12px;font-weight:400;color:var(--pos)">700点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">訪問薬剤管理指導を実施している患者の状態急変等に伴い、医師の求めにより他の医療関係職種等と共同でカンファレンスに参加した場合に算定。月2回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">訪問薬剤管理指導を実施している患者で、状態急変等が生じたもの。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>医師の求めにより、医師・看護師等の他の医療関係職種と共同でカンファレンスに参加</li>
            <li>カンファレンスの結果を踏まえ、共同で療養上必要な指導を実施</li>
            <li>月2回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.52-53。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が前提。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の3</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_mayaku'">
      <div class="section">
        <div class="section-title">麻薬管理指導加算（在宅） <span style="font-size:12px;font-weight:400;color:var(--pos)">100点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">麻薬の投薬が行われている在宅患者に対し、定期的に服用状況・残薬の状況・保管状況を確認し、副作用の有無等の確認及び必要な指導を行い、処方医に情報提供した場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">麻薬の投薬が行われている在宅患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>麻薬の服用状況、残薬の状況及び保管状況の確認</li>
            <li>残薬の適切な取扱方法を含めた保管取扱い上の注意等の指導</li>
            <li>麻薬による鎮痛等の効果や副作用（疑われる症状）の有無の確認</li>
            <li>処方医に対して必要な情報提供</li>
            <li>訪問薬剤管理指導料・緊急訪問・緊急時等共同指導料が算定されていない場合は算定不可</li>
            <li>医療用麻薬持続注射療法加算との併算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">麻薬小売業者の免許</b>が必要。在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.45-46（訪問薬剤管理指導料の加算2）、p.49（緊急訪問の加算9）、p.51（緊急時等共同指導の加算9）。がん疼痛の薬物療法に関するガイドライン等を参照して実施。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">麻薬小売業者の免許が必要。患者等から返納された麻薬の廃棄届の写しを薬剤服用歴等に添付。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_mayaku_chusha'">
      <div class="section">
        <div class="section-title">医療用麻薬持続注射療法加算 <span style="font-size:12px;font-weight:400;color:var(--pos)">250点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">在宅において医療用麻薬持続注射療法を行っている患者又は家族等に対し、患家を訪問し、麻薬の投与状況・残液の状況・保管状況を確認し、必要な指導及び処方医への情報提供を行った場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">在宅で医療用麻薬持続注射療法を行っている患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>麻薬の投与状況・残液の状況・保管状況の確認</li>
            <li>残液の適切な取扱方法を含めた保管取扱い上の注意等の指導</li>
            <li>麻薬による鎮痛等の効果や副作用の有無の確認</li>
            <li>高度管理医療機器の保健衛生上の危害防止に必要な措置</li>
            <li>処方医及び必要に応じて他の医療関係職種に情報提供</li>
            <li>訪問薬剤管理指導料・緊急訪問・緊急時等共同指導料が算定されていない場合は算定不可</li>
            <li>麻薬管理指導加算との併算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">麻薬小売業者の免許</b>が必要。在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.45-46（訪問薬剤管理指導料の加算3）、p.49-50（緊急訪問の加算10）、p.51-52（緊急時等共同指導の加算10）。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">麻薬小売業者の免許が必要。麻薬廃棄届の写しを薬剤服用歴等に添付。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_nyuji'">
      <div class="section">
        <div class="section-title">乳幼児加算（在宅） <span style="font-size:12px;font-weight:400;color:var(--pos)">100点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">6歳未満の乳幼児に係る在宅訪問薬剤管理指導の際に、体重・適切な剤形等の確認を行い、家族等に対して適切な服薬方法・誤飲防止等の指導を行った場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">6歳未満の乳幼児。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>体重、適切な剤形その他必要な事項等の確認</li>
            <li>患者の家族等に対して適切な服薬方法、誤飲防止等の服薬指導</li>
            <li>小児特定加算と併算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.46（訪問薬剤管理指導料の加算4）、p.50（緊急訪問の加算11）。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_shoni'">
      <div class="section">
        <div class="section-title">小児特定加算（在宅） <span style="font-size:12px;font-weight:400;color:var(--pos)">450点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">児童福祉法第56条の6第2項に規定する障害児（18歳未満）に係る在宅訪問薬剤管理指導の際に、服薬状況等を確認し、患者又は家族等に当該患者の状態に合わせた薬学的管理及び指導を行った場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">児童福祉法に規定する障害児（18歳未満）。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>服薬状況等を確認し、患家を訪問</li>
            <li>患者又は家族等に当該患者の状態に合わせた薬学的管理及び指導</li>
            <li>乳幼児加算と併算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.46（訪問薬剤管理指導料の加算5）、p.50（緊急訪問の加算12）。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_chusin'">
      <div class="section">
        <div class="section-title">在宅中心静脈栄養法加算 <span style="font-size:12px;font-weight:400;color:var(--pos)">150点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">在宅中心静脈栄養法を行っている患者に対し、患者の状態・投与環境等を確認し、保管方法・配合変化防止に係る対応方法等の指導を行い、処方医に情報提供した場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">在宅中心静脈栄養法を行っている患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者の状態、投与環境その他必要な事項等の確認</li>
            <li>保管方法、配合変化防止に係る対応方法等の薬学的管理指導</li>
            <li>処方医に対して必要な情報提供</li>
            <li>2種以上の注射薬が同時投与される場合は、配合変化に関する留意点・輸液バッグの遮光等について他の医療関係職種にも情報提供</li>
            <li>訪問薬剤管理指導料・緊急訪問・緊急時等共同指導料が算定されていない場合は算定不可</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。在宅訪問薬剤管理指導の届出が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.46-47（訪問薬剤管理指導料の加算6）、p.50-51（緊急訪問の加算13）、p.52（緊急時等共同指導の加算11）。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='zt_ikou'">
      <div class="section">
        <div class="section-title">在宅移行初期管理料（区分15の8） <span style="font-size:12px;font-weight:400;color:var(--pos)">230点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">在宅療養へ移行が予定されている通院困難な患者に対し、退院前から医療機関と連携して必要な薬学的管理指導を行った場合に算定。訪問薬剤管理指導料の初回算定月に1回。R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">以下のア及びイを満たす患者:<br>ア: 認知症・精神障害・18歳未満の障害児・6歳未満の乳幼児・末期がん・注射麻薬が必要な患者<br>イ: 訪問薬剤管理指導料（単一建物1人）・居宅/介護予防居宅療養管理指導費に係る医師の指示がある患者</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>計画的な訪問薬剤管理指導の実施前に患家を訪問</li>
            <li>多職種と連携し、退院時処方内容を踏まえた薬剤調整・残薬整理・服薬方法提案等を実施</li>
            <li>退院直後の場合は入院医療機関と連携し処方内容に関する情報共有</li>
            <li>訪問薬剤管理指導料の初回算定月に1回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">在宅訪問薬剤管理指導の届出</b>が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.59-61 区分15の8。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が前提。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の8</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_zaitaku_new'">
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> 訪問薬剤管理医師同時指導料（区分15の9） <span style="font-size:12px;font-weight:400;color:var(--pos)">150点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">訪問薬剤管理指導料1を算定する患者に対し、訪問診療を行う医師と同時に患家を訪問し薬学的管理指導を行った場合に算定。6月に1回。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">以下のいずれかを算定している患者（単一建物診療/居住者が1人の場合に限る）:<br>在宅患者訪問薬剤管理指導料 / 在宅患者緊急訪問薬剤管理指導料 / 居宅療養管理指導費 / 介護予防居宅療養管理指導費</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者の同意を得て、訪問診療を実施している保険医（在宅時医学総合管理料を算定する主治医）と同時に訪問</li>
            <li>薬学的管理及び指導を実施</li>
            <li>6月に1回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">在宅訪問薬剤管理指導の届出</b>が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">R8新設。</b>ポリファーマシー対策・残薬対策の観点から、医師と薬剤師の同時訪問による協働を評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.61-63 区分15の9。改定の概要 p.38。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が前提。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の9</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span class="badge badge-new">新設</span> 複数名薬剤管理指導訪問料（区分15の10） <span style="font-size:12px;font-weight:400;color:var(--pos)">300点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">訪問薬剤管理指導料1を算定する患者に対し、薬局又は在宅協力薬局の職員と複数名で患家を訪問し薬学的管理指導を行った場合に算定。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">通院が困難な患者のうち、医師が複数名訪問の必要性があると認めるもの。<br>以下のいずれかを算定（単一建物診療/居住者が1人の場合に限る）: 在宅患者訪問薬剤管理指導料 / 在宅患者緊急訪問薬剤管理指導料 / 居宅療養管理指導費 / 介護予防居宅療養管理指導費</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者又は家族等の同意を得て、当該薬局又は在宅協力薬局に勤務する職員（薬剤師以外も可）とともに複数名で訪問</li>
            <li>「複数名訪問の必要性」は薬剤師の利便性ではなく、患者が興奮・攻撃性を示す等、単独では指導の実施が担保できないおそれがある場合に判断</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--neg)">在宅訪問薬剤管理指導の届出</b>が前提。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px"><b style="color:var(--r8)">R8新設。</b>認知症等で行動面に課題がある患者への安全な訪問体制を確保するため、複数名での訪問を評価。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.63-65 区分15の10。改定の概要 p.39。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">在宅訪問薬剤管理指導の届出が前提。交通費は患家負担。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の10</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_taiin'">
      <div class="section">
        <div class="section-title">退院時共同指導料（区分15の4） <span style="font-size:12px;font-weight:400;color:var(--pos)">600点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">入院中の患者について、退院後の訪問薬剤管理指導を担う薬局の薬剤師が、入院中の医療機関の医師等と共同して退院後の在宅療養に必要な薬剤に関する指導等を行い文書で情報提供した場合に算定。R8改定での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">入院中の患者（退院後の訪問薬剤管理指導を担う薬局として患者が指定した薬局の薬剤師が対象）。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>患者又はその家族等の同意を得て実施</li>
            <li>入院中の医師・看護師・薬剤師・管理栄養士等と共同して指導</li>
            <li>文書により情報提供</li>
            <li>入院中1回に限り算定（特定疾病等の患者は2回）</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 届出</div>
          <div style="color:var(--text-muted)">届出不要。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の4</div>
        </div>
      </div>
    </div>

    <div v-if="sub==='yg_joho_keikan'">
      <div class="section">
        <div class="section-title">服薬情報等提供料（区分15の5） <span style="font-size:12px;font-weight:400;color:var(--pos)">1: 30点 / 2: 20点 / 3: 50点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">調剤後も患者の服用薬情報を把握し、医療機関やケアマネジャーに文書で情報提供した場合に算定。R8改定での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">全患者。ただし在宅訪問薬剤管理指導料を算定している患者は算定不可。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <table class="fee-table" style="font-size:12px;margin-bottom:8px"><thead><tr><th>区分</th><th style="text-align:right">点数</th><th>内容</th><th>頻度</th></tr></thead><tbody>
            <tr><td>1</td><td style="text-align:right">30点</td><td>医療機関の求めに応じて情報提供</td><td>月1回</td></tr>
            <tr><td>2イ</td><td style="text-align:right">20点</td><td>薬剤師の判断で医療機関に情報提供</td><td>月1回</td></tr>
            <tr><td>2ロ</td><td style="text-align:right">20点</td><td>リフィル処方箋に係る情報提供</td><td>月1回</td></tr>
            <tr><td>2ハ</td><td style="text-align:right">20点</td><td>ケアマネジャーに情報提供</td><td>月1回</td></tr>
            <tr><td>3</td><td style="text-align:right">50点</td><td>入院予定の患者に係る情報提供</td><td>3月に1回</td></tr>
          </tbody></table>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.56-58。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の5</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">経管投薬支援料（区分15の7） <span style="font-size:12px;font-weight:400;color:var(--pos)">100点</span></div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700;margin-bottom:6px">1. 概要</div>
          <div style="color:var(--text-muted);margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:6px">胃瘻・腸瘻・経鼻経管投薬の患者に対し、簡易懸濁法による服用支援を行った場合に算定。初回に限り。R8改定での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">2. 対象患者</div>
          <div style="color:var(--text-muted);margin-bottom:8px">胃瘻・腸瘻又は経鼻経管による投薬を受けている患者。</div>
          <div style="font-weight:700;margin-bottom:6px">3. 算定要件</div>
          <ul style="padding-left:18px;color:var(--text-muted);margin-bottom:8px">
            <li>簡易懸濁法による薬剤の服用に関する支援を実施</li>
            <li>初回に限り算定</li>
          </ul>
          <div style="font-weight:700;margin-bottom:6px">4. 施設基準</div>
          <div style="color:var(--text-muted);margin-bottom:8px">届出不要。特別調剤基本料Bの薬局は算定不可。</div>
          <div style="font-weight:700;margin-bottom:6px">5. 改定内容・狙い</div>
          <div style="color:var(--text-muted);margin-bottom:8px">R8での変更なし。</div>
          <div style="font-weight:700;margin-bottom:6px">6. 通知・疑義解釈</div>
          <div style="color:var(--text-muted);margin-bottom:8px">保医発0305第6号 別添3 p.58-59。</div>
          <div style="font-weight:700;margin-bottom:6px">7. 届出・免許・報告</div>
          <div style="color:var(--text-muted)">届出不要。</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:8px">出典：告示 区分15の7</div>
        </div>
      </div>
    </div>

`;
