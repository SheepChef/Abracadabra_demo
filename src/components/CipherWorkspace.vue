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
import PayloadHighlightText from "@/components/PayloadHighlightText.vue";
import { getRandomnessLabel, getDilutionRandomnessLabel } from "@/utils/cipherHelpers";

const {
  themeScheme,
  isExtension,
  isAndroidApp,
  CoreVersion,
  isPWA,
  showAboutDialog,
  GeekMode,
  EnableTooltips,
  GeekAdvancedDilution,
  UseDilution,
  DilutionSampleMode,
  RandomnessVal,
  DilutionRandomnessVal,
  onRandomness,
  onDilutionRandomness,
  InputMode,
  OutputMode,
  InputText,
  KeyText,
  ShowPassword,
  OutputText,
  OutputSegments,
  IsMultiSegment,
  ErrorMessage,
  WarningMessage,
  InfoMessage,
  Loading,
  dropzoneActive,
  FILENAME,
  LastFileOutput,
  outputTextareaRef,
  outputMirrorRef,
  shouldHighlightPayload,
  syncOutputHighlightScroll,
  PasswordCopy,
  PasswordCut,
  dragEnter,
  dragLeave,
  dragOver,
  dropFile,
  selectFile,
  triggerFilePicker,
  manualDownload,
  ProcessEncNext,
  ProcessDecNext,
  copyall,
  copySegment,
  clearInputText
} = inject(HOME_CONTEXT_KEY);
</script>

<template>
  <div class="m3-col-middle">
    <!-- Main cipher card -->
    <m3e-card :variant="themeScheme === 'light' ? 'elevated' : 'filled'" class="main-card"
      style="position: relative; z-index: 2;">
      <div class="main-card-inner">
        <!-- Source Data Tabs -->
        <div class="custom-tabs" style="margin-bottom: 26px;" v-if="!isExtension">
          <button class="custom-tab" :class="{ active: InputMode === 'TEXT' }"
            @click="InputMode = 'TEXT'">文本模式</button>
          <button class="custom-tab" :class="{ active: InputMode === 'UINT8' }"
            @click="InputMode = 'UINT8'">文件模式</button>
        </div>

        <!-- Text Input -->
        <div v-if="InputMode === 'TEXT'" style="margin-bottom:28px;">
          <m3e-form-field hide-subscript="always" variant="outlined" style="width:100%;" class="multiline-input">
            <label slot="label">话语</label>
            <textarea id="MainTextInput" placeholder="你想吟唱的话语" autocomplete="off" type="text" :value="InputText"
              @input="InputText = $event.target.value" rows="4"></textarea>
          </m3e-form-field>
          <m3e-icon-button id="TextClearButton" v-if="InputText != '' && InputText != null" variant="tonal"
            @click="clearInputText" size="extra-small"
            style="position: absolute; margin-left: -40px; margin-top: 8px; ">
            <m3e-icon name="close"></m3e-icon>
          </m3e-icon-button>
        </div>

        <!-- File Input -->
        <div v-if="InputMode === 'UINT8'" style="margin-bottom:16px;">
          <input type="file" id="fileIn" style="display:none" @change="selectFile" />
          <m3e-card variant="outlined" id="FileDropCard" :class="{ 'dropzone-active': dropzoneActive }"
            @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver" @drop="dropFile"
            @click="triggerFilePicker">
            <div class="dropzone-content" style="padding: 24px; text-align: center;">
              <m3e-icon name="upload_file" style="font-size:32px;"></m3e-icon>
              <p style="line-break: anywhere;">{{ FILENAME ? FILENAME : '拖入文件，或点击选择' }}</p>
            </div>
          </m3e-card>
        </div>

        <!-- Key Input -->
        <div style="margin-bottom:16px;">
          <m3e-form-field variant="outlined" style="width:100%;" hide-subscript="always">
            <label slot="label">密钥</label>
            <input placeholder="将一切雪藏的密钥" autocomplete="off"
              :class="ShowPassword ? 'masked-key show-text' : 'masked-key'" :type="'text'" :value="KeyText"
              @input="KeyText = $event.target.value" @copy="PasswordCopy" @cut="PasswordCut" />
            <m3e-icon-button slot="suffix" @click="ShowPassword = !ShowPassword" type="button"
              style="margin-right: 4px;">
              <m3e-icon :name="!ShowPassword ? 'visibility_off' : 'visibility'"></m3e-icon>
            </m3e-icon-button>
          </m3e-form-field>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <m3e-button variant="filled" @click="ProcessEncNext" style="flex:1;">
            <m3e-icon slot="icon" name="lock"></m3e-icon>加 密
          </m3e-button>
          <m3e-button variant="tonal" @click="ProcessDecNext" style="flex:1;">
            <m3e-icon slot="icon" name="lock_open"></m3e-icon>解 密
          </m3e-button>
        </div>

        <!-- Randomness Slider (Standard Wenyan vs Dilution Context Continuity) -->
        <div v-show="!UseDilution" class="slider-row" style="margin-top:16px; margin-bottom:16px;">
          <div class="slider-label-row">
            <span id="lblWenyanRandomness" style="font-weight:600;font-size:0.9rem;">句式随机性</span>
            <span>{{ getRandomnessLabel(RandomnessVal) }} ({{ RandomnessVal }})</span>
          </div>
          <m3e-slider labelled :min="0" :max="100" style="width:100%;">
            <m3e-slider-thumb id="slRandomness" :value="RandomnessVal" @input="onRandomness"></m3e-slider-thumb>
          </m3e-slider>
          <m3e-rich-tooltip v-if="EnableTooltips" for="lblWenyanRandomness" hide-delay="200">
            <span slot="subhead" style="font-weight: bold;">句式随机性</span>
            控制普通文言文选句的长度偏好，数值越低越优先选用高载荷长句。
          </m3e-rich-tooltip>
        </div>

        <div v-show="UseDilution" class="slider-row" style="margin-top:16px; margin-bottom:16px;">
          <div class="slider-label-row">
            <span id="lblDilutionRandomness" style="font-weight:600;font-size:0.9rem;">上下文随机性</span>
            <span>{{ (GeekMode && GeekAdvancedDilution && DilutionSampleMode === 'RANDOM') ? '由随机采样接管' :
              `${getDilutionRandomnessLabel(DilutionRandomnessVal)} (${DilutionRandomnessVal})` }}</span>
          </div>
          <m3e-slider labelled :min="0" :max="100"
            :disabled="(GeekMode && GeekAdvancedDilution && DilutionSampleMode === 'RANDOM') ? true : undefined"
            style="width:100%;">
            <m3e-slider-thumb id="slDilutionRandomness" :value="DilutionRandomnessVal"
              @input="onDilutionRandomness"></m3e-slider-thumb>
          </m3e-slider>
          <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionRandomness" hide-delay="200">
            <span slot="subhead" style="font-weight: bold;">上下文随机性</span>
            在自适应稀释采样中，控制每轮选句跳出当前语料上下文重新定位的概率（0 为严格连续）。
          </m3e-rich-tooltip>
        </div>

        <!-- Messages (Error/Warning Cards) -->
        <div class="collapsible-wrapper" :class="ErrorMessage ? 'is-open' : 'is-closed'">
          <div class="collapsible-inner">
            <div class="info-card error" style="margin-bottom:16px;">
              <m3e-icon name="error"></m3e-icon>
              <div class="info-text">{{ ErrorMessage }}</div>
            </div>
          </div>
        </div>

        <div class="collapsible-wrapper" :class="WarningMessage ? 'is-open' : 'is-closed'">
          <div class="collapsible-inner">
            <div class="info-card warning" style="margin-bottom:16px;">
              <m3e-icon name="warning"></m3e-icon>
              <div class="info-text">{{ WarningMessage }}</div>
            </div>
          </div>
        </div>

        <div class="collapsible-wrapper" :class="InfoMessage ? 'is-open' : 'is-closed'">
          <div class="collapsible-inner">
            <div class="info-card insight" style="margin-bottom:16px;">
              <m3e-icon name="info"></m3e-icon>
              <div class="info-text">{{ InfoMessage }}</div>
            </div>
          </div>
        </div>

        <m3e-divider style="margin: 0px 0px 16px 0px;"></m3e-divider>

        <!-- Output Data Tabs -->
        <div class="custom-tabs" style="margin-bottom:12px;" v-if="!isExtension">
          <button class="custom-tab" :class="{ active: OutputMode === 'TEXT' }"
            @click="OutputMode = 'TEXT'">文本结果</button>
          <button class="custom-tab" :class="{ active: OutputMode === 'UINT8' }"
            @click="OutputMode = 'UINT8'">文件结果</button>
        </div>

        <!-- Output Area (Wrapped for relative Loading Overlay) -->
        <div class="output-area-relative">
          <!-- Loading overlay restricted to Output Area -->
          <transition name="fade">
            <div v-if="Loading" class="loading-overlay"
              :style="OutputMode === 'TEXT' ? ` height: 160px; margin-top: 12px;` : `height: 65px; margin-top: 0px; zoom: 85%;`">
              <m3e-loading-indicator variant="contained"
                style="--m3e-loading-indicator-container-size:3.5rem;"></m3e-loading-indicator>
            </div>
          </transition>

          <!-- Output Text / Flexible Segments -->
          <div v-if="OutputMode === 'TEXT'" style="margin-top:12px; margin-bottom:0px;">
            <template v-if="IsMultiSegment">
              <!-- Multi-Segment UI -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <m3e-chip variant="elevated">
                  <m3e-icon slot="icon" name="file_copy"></m3e-icon>分段总数: {{ OutputSegments.length }}
                </m3e-chip>
                <m3e-button variant="text" @click="copyall">
                  <m3e-icon slot="icon" name="content_copy"></m3e-icon>复制全部
                </m3e-button>
              </div>

              <div class="segment-list">
                <m3e-skeleton animation="pulse" shape="rounded" :loaded="!Loading ? true : undefined"
                  v-for="(segment, idx) in OutputSegments" :key="idx">
                  <div class="segment-card">
                    <div class="segment-header">
                      <span>分段 {{ idx + 1 }}</span>
                      <m3e-chip variant="suggestion" @click="copySegment(segment, idx + 1)"
                        style="cursor: pointer;">
                        <m3e-icon slot="icon" name="content_copy"></m3e-icon>复制本段
                      </m3e-chip>
                    </div>
                    <div v-if="!shouldHighlightPayload" class="segment-content">{{ segment }}</div>
                    <div v-else class="segment-content has-highlight">
                      <PayloadHighlightText :text="segment" />
                    </div>
                  </div>
                </m3e-skeleton>
              </div>
            </template>
            <template v-else>
              <!-- Standard Single Text Output -->
              <m3e-skeleton animation="pulse" shape="rounded" :loaded="!Loading ? true : undefined"
                style="position: relative;">
                <m3e-form-field variant="outlined" style="width:100%;" class="multiline-input">
                  <label slot="label">符文</label>
                  <div v-if="shouldHighlightPayload" ref="outputMirrorRef" class="output-highlight-mirror"
                    aria-hidden="true">
                    <PayloadHighlightText :text="OutputText" mirror-trailing-newline />
                  </div>
                  <textarea ref="outputTextareaRef" placeholder="回路末端的符文" type="text" :value="OutputText"
                    :class="{ 'payload-hl-textarea': shouldHighlightPayload }" @scroll="syncOutputHighlightScroll"
                    readonly rows="6"></textarea>
                </m3e-form-field>

                <m3e-icon-button v-if="isExtension" variant="tonal" @click="copyall"
                  style="position: absolute; bottom: 32px; right: 12px; z-index: 10; opacity: 0.85;">
                  <m3e-icon name="content_copy"></m3e-icon>
                </m3e-icon-button>
              </m3e-skeleton>
              <div v-if="!isExtension" style="display: flex; justify-content: flex-end;">
                <m3e-button variant="text" @click="copyall">
                  <m3e-icon slot="icon" name="content_copy"></m3e-icon>复制全部
                </m3e-button>
              </div>
            </template>
          </div>

          <!-- Output File -->
          <m3e-skeleton :loaded="!Loading ? true : undefined">
            <div v-if="OutputMode === 'UINT8'" class="info-card insight" style="display:flex; align-items:center;">
              <m3e-icon name="download"></m3e-icon>
              <div class="info-text" style="flex:1;">在文件模式下，生成的结果将自动触发下载。</div>
              <m3e-button v-if="LastFileOutput" variant="tonal" @click="manualDownload" style="flex-shrink:0;">
                <m3e-icon slot="icon" name="file_download"></m3e-icon>重新下载
              </m3e-button>
            </div>
          </m3e-skeleton>
        </div>
      </div>
    </m3e-card>

    <!-- Version Flap Card -->
    <div class="version-flap-card">
      <span>
        <span v-if="isExtension" @click="showAboutDialog"
          style="cursor: pointer; color:inherit!important; text-decoration: none;">
          Abracadabra
        </span>
        <span v-else-if="isPWA() || isAndroidApp" style="color:inherit!important; text-decoration: none;">
          Abracadabra
        </span>
        <a v-else href="https://github.com/SheepChef/Abracadabra" target="_blank" rel="noopener noreferrer"
          style="color:inherit!important; text-decoration: none;">
          Abracadabra
        </a>
        · V{{ CoreVersion }}
      </span>
      <span>SheepChef &copy; </span>
    </div>
  </div>
</template>

<style scoped>
/* 默认遮罩状态：匹配 type 为 text 且包含 masked-key 类的 input */
input[type="text"].masked-key {
  -webkit-text-security: disc;
}

/* 切换到明文状态：同时包含 masked-key 和 show-text 时生效 */
input[type="text"].masked-key.show-text {
  -webkit-text-security: none;
}
</style>
