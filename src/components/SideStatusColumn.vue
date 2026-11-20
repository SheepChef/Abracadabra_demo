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

const {
  themeColor,
  themeScheme,
  setThemeColor,
  setThemeScheme,
  currentInsight,
  showInsight,
  ShowPWAButton,
  isAndroidApp,
  InstallPWA,
  showAboutDialog
} = inject(HOME_CONTEXT_KEY);

const colorPaletteRow1 = [
  { hex: "#4DB6AC", label: "青" },
  { hex: "#64B5F6", label: "蓝" },
  { hex: "#9575CD", label: "紫" }
];

const colorPaletteRow2 = [
  { hex: "#E57373", label: "红" },
  { hex: "#FFB74D", label: "橙" },
  { hex: "#FFF176", label: "黄" },
  { hex: "#81C784", label: "绿" }
];

function changeColor(hex) {
  setThemeColor(hex);
}
</script>

<template>
  <div class="m3-col-right">
    <!-- Theme Tweaks -->
    <m3e-card :variant="themeScheme === 'light' ? 'elevated' : 'outlined'" class="side-card theme-card">
      <div class="side-card-inner" style="padding-top: 16px;">
        <div class="theme-header" style="margin-bottom: 12px;">
          <span style="font-weight:600;display:flex;align-items:center;gap:8px;font-size:17.6px;">
            <m3e-icon name="palette" style="font-size:20px;"></m3e-icon>主题
          </span>
        </div>

        <div class="color-picker-container"
          style="flex-direction: column; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="display: flex; gap: 12px;">
            <button v-for="color in colorPaletteRow1" :key="color.hex" class="color-swatch"
              :class="{ active: themeColor === color.hex }" :style="{ '--swatch-color': color.hex }"
              @click="changeColor(color.hex)" :title="color.label">
              <m3e-icon class="swatch-check" name="check"></m3e-icon>
            </button>
          </div>
          <div style="display: flex; gap: 12px;">
            <button v-for="color in colorPaletteRow2" :key="color.hex" class="color-swatch"
              :class="{ active: themeColor === color.hex }" :style="{ '--swatch-color': color.hex }"
              @click="changeColor(color.hex)" :title="color.label">
              <m3e-icon class="swatch-check" name="check"></m3e-icon>
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: center;">
          <m3e-segmented-button hide-selection-indicator style="width: 100%;">
            <m3e-button-segment :checked="themeScheme === 'light' ? true : undefined"
              @click="setThemeScheme('light')">
              <m3e-icon slot="icon" name="light_mode"></m3e-icon>浅色</m3e-button-segment>
            <m3e-button-segment :checked="themeScheme === 'dark' ? true : undefined"
              @click="setThemeScheme('dark')">
              <m3e-icon slot="icon" name="dark_mode"></m3e-icon>深色</m3e-button-segment>
          </m3e-segmented-button>
        </div>
      </div>
    </m3e-card>

    <!-- Insights -->
    <transition name="fade">
      <m3e-card v-if="showInsight" :variant="themeScheme === 'light' ? 'elevated' : 'elevated'"
        class="side-card insight-card">
        <div class="side-card-inner" style="padding: 16px;">
          <div class="theme-header" style="margin-bottom: 8px;">
            <span
              style="font-weight:600;display:flex;align-items:center;gap:8px;font-size:17.6px;color:var(--md-sys-color-primary);">
              <m3e-icon name="lightbulb" style="font-size:20px;"></m3e-icon>见解
            </span>
          </div>
          <div class="info-text" style="line-break: anywhere;font-size: 0.9rem; line-height: 1.5; opacity: 0.9;">{{
            currentInsight }}
          </div>
        </div>
      </m3e-card>
    </transition>

    <!-- PWA Install -->
    <m3e-card v-if="ShowPWAButton && !isAndroidApp" :variant="themeScheme === 'light' ? 'elevated' : 'filled'"
      class="side-card insight-card">
      <div style="display:flex;align-items:center;gap:12px;padding: 16px;">
        <m3e-icon name="install_mobile" style="color:var(--md-sys-color-primary);"></m3e-icon>
        <div style="flex:1;">
          <h3 style="font-family: 'sans-serif';margin:0;font-size:1rem;color:var(--md-sys-color-on-surface);">安装魔曰
          </h3>
          <p style="margin:4px 0 0;font-size:0.875rem;opacity:0.8;">安装离线的网页应用</p>
        </div>
        <m3e-button variant="tonal" @click="InstallPWA">安装</m3e-button>
      </div>
    </m3e-card>

    <!-- About Card -->
    <m3e-card actionable :variant="themeScheme === 'light' ? 'elevated' : 'elevated'" class="side-card insight-card"
      @click="showAboutDialog"
      :style="themeScheme === 'dark' ? 'cursor: pointer; --m3e-elevated-card-container-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);' : 'cursor: pointer;'">
      <div style="display:flex;align-items:center;gap:12px;padding: 16px;">
        <m3e-icon name="code_xml"
          :style="themeScheme === 'dark' ? 'color:var(--md-sys-color-on-secondary-container);' : ''"></m3e-icon>
        <div style="flex:1;">
          <h3 style=" font-family: 'sans-serif';margin:0;font-size:1rem;"
            :style="themeScheme === 'dark' ? 'color:var(--md-sys-color-on-secondary-container);' : 'color:var(--md-sys-color-primary);'">
            关于魔曰</h3>
          <p style="margin:4px 0 0;font-size:0.875rem;opacity:0.8;">版本信息与许可协议</p>
        </div>
        <m3e-icon name="chevron_right"
          :style="themeScheme === 'dark' ? 'opacity:0.7; color:var(--md-sys-color-on-secondary-container);' : 'opacity:0.7;'"></m3e-icon>
      </div>
    </m3e-card>
  </div>
</template>
