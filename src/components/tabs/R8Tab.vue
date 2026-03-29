<script setup>
import { inject } from 'vue'
import BasicFeeSection from '../sections/BasicFeeSection.vue'
import PreparationFeeSection from '../sections/PreparationFeeSection.vue'
import ManagementFeeSection from '../sections/ManagementFeeSection.vue'
import HomeCareSection from '../sections/HomeCareSection.vue'
import LongTermCareSection from '../sections/LongTermCareSection.vue'

const { data } = inject('storage')
</script>

<template>
  <div>
    <div class="section">
      <div class="section-title">R8 改定後の点数・件数予測</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:0">
        令和8年6月施行後の点数と算定見込み件数を設定します。R7実績をベースに件数を調整してください。
      </p>
    </div>

    <BasicFeeSection :data="data" era="r8" />
    <PreparationFeeSection :data="data" era="r8" />
    <ManagementFeeSection :data="data" era="r8" />
    <HomeCareSection :data="data" era="r8" />
    <LongTermCareSection :data="data" era="r8" />
  </div>
</template>
