<script setup>
/*
 * Copyright (C) 2025-2026 SheepChef (a.k.a. Haruka Hokuto)
 *
 * 这是一个源代码公开的软件。
 * 在遵守AIPL-1.2许可证的前提下，
 * 你可以自由复制，修改，分发，使用它。
 *
 * 查阅 Academic Innovation Protection License(AIPL) 来了解更多 .
 * 本作品应随附一份完整的 AIPL-1.2 许可证全文。
 *
 */
import { inject } from "vue";
import { HOME_CONTEXT_KEY } from "@/composables/homeContext";
import { corpusSlots } from "@/composables/useGeekMode";
import { formatCorpusSlotText, STD_CORPUS_SUMMARY } from "@/utils/cipherHelpers";

const {
  EnableTooltips,
  GeekAdvancedDilution,
  GeekHighlightPayload,
  CustomCorpus,
  CustomCorpusSummary,
  CorpusManifestFile,
  CorpusBFiles,
  CorpusSFiles,
  CorpusCFiles,
  CorpusDialogError,
  onChangeEnableTooltips,
  onChangeGeekAdvancedDilution,
  onChangeGeekHighlightPayload,
  disableGeekMode,
  closeGeekDialog,
  resetToStdCorpus,
  closeCustomCorpusDialog,
  applyCustomCorpus,
  triggerCorpusPicker,
  onSelectCorpusFiles,
  getCorpusSlotFiles
} = inject(HOME_CONTEXT_KEY);
</script>

<template>
  <m3e-dialog id="GeekDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="developer_mode" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">极客菜单</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="geek-setting-row">
        <div class="geek-setting-info">
          <span class="geek-setting-title">工具提示</span>
          <span class="geek-setting-desc">启用配置项富文本悬停提示渲染</span>
        </div>
        <m3e-switch id="swGeekTooltips" :checked="EnableTooltips ? true : undefined" @change="onChangeEnableTooltips"
          icons="both"></m3e-switch>
      </div>
      <m3e-divider></m3e-divider>
      <div class="geek-setting-row">
        <div class="geek-setting-info">
          <span class="geek-setting-title">高级稀释设置</span>
          <span class="geek-setting-desc">启用高级稀释设置，控制稀释算法的更多细节</span>
        </div>
        <m3e-switch id="swGeekAdvDilution" :checked="GeekAdvancedDilution ? true : undefined"
          @change="onChangeGeekAdvancedDilution" icons="both"></m3e-switch>
      </div>
      <m3e-divider></m3e-divider>
      <div class="geek-setting-row">
        <div class="geek-setting-info">
          <span class="geek-setting-title">载荷字高亮</span>
          <span class="geek-setting-desc">加密时在结果文本框中高亮载荷字</span>
        </div>
        <m3e-switch id="swGeekHighlightPayload" :checked="GeekHighlightPayload ? true : undefined"
          @change="onChangeGeekHighlightPayload" icons="both"></m3e-switch>
      </div>
    </div>
    <div slot="actions" end>
      <m3e-button variant="outlined" @click="disableGeekMode">关闭极客模式</m3e-button>
      <m3e-button variant="tonal" @click="closeGeekDialog">返回</m3e-button>
    </div>
  </m3e-dialog>

  <m3e-dialog id="CustomCorpusDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="library_books" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">自定义语料</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:0.85rem;color:var(--md-sys-color-on-surface-variant);line-height:1.5;">
        当前：{{ CustomCorpusSummary || STD_CORPUS_SUMMARY }}
      </div>
      <div class="corpus-slot-list">
        <div v-for="slot in corpusSlots" :key="slot.key" class="corpus-slot-row">
          <input type="file" :id="slot.inputId" accept=".json" :multiple="slot.multiple ? true : undefined"
            style="display:none" @change="onSelectCorpusFiles(slot.key, $event)" />
          <div class="corpus-slot-info">
            <span class="corpus-slot-title">{{ slot.title }}</span>
            <span class="corpus-slot-files">{{ formatCorpusSlotText(getCorpusSlotFiles(slot.key), slot.emptyText)
              }}</span>
          </div>
          <m3e-button variant="tonal" size="small" @click="triggerCorpusPicker(slot.inputId)">选择</m3e-button>
        </div>
      </div>
      <div v-if="CorpusDialogError" class="info-card error" style="padding:10px 12px;font-size:0.85rem;">
        <m3e-icon name="error"></m3e-icon>
        <div class="info-text">{{ CorpusDialogError }}</div>
      </div>
    </div>
    <div slot="actions" end>
      <m3e-button
        v-if="CustomCorpus || CorpusManifestFile || CorpusBFiles.length || CorpusSFiles.length || CorpusCFiles.length"
        variant="text" @click="resetToStdCorpus(true)">恢复内置</m3e-button>
      <m3e-button variant="text" @click="closeCustomCorpusDialog">关闭</m3e-button>
      <m3e-button variant="filled" @click="applyCustomCorpus">加载并应用</m3e-button>
    </div>
  </m3e-dialog>
</template>
