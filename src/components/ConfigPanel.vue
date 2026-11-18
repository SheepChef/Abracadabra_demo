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
import {
  dilutionFilterOptions,
  dilutionPoemFilterOptions,
  dilutionSampleOptions,
  dilutionDistributionOptions
} from "@/composables/useCipherConfig";
import {
  STD_CORPUS_SUMMARY,
  getDilutionTargetRateLabel,
  getStepLabel
} from "@/utils/cipherHelpers";

const {
  themeScheme,
  isMobile,
  ConfigCollapsed,
  GeekMode,
  EnableTooltips,
  GeekAdvancedDilution,
  CustomCorpusSummary,
  showCustomCorpusDialog,
  ForcePian,
  ForceLogi,
  ForceNoMark,
  OutputTraditional,
  UseDilution,
  DilutionTargetRatePct,
  DilutionFilterMode,
  DilutionPoemFilterMode,
  DilutionPoemAutoLineBreak,
  DilutionSampleMode,
  DilutionStyleRandomIndex,
  DilutionPayloadDistribution,
  WenyanMin,
  WenyanMax,
  AdvancedEnc,
  UseStrongIV,
  UseHMAC,
  UsePBKDF2,
  UseTOTP,
  TOTPTimeStepVal,
  TOTPEpochVal,
  TOTPBasekeyVal,
  TOTPExpiryLabel,
  UseFlexible,
  UseAONT,
  MessageID,
  FlexibleMin,
  FlexibleMax,
  onChangePian,
  onChangeLogi,
  onChangeNoMark,
  onChangeTraditional,
  onChangeDilution,
  onChangeDilutionPoemAutoBreak,
  onChangeAdv,
  onChangeStrongIV,
  onChangeHMAC,
  onChangePBKDF2,
  onChangeTOTP,
  onChangeFlex,
  onChangeAONT,
  onMessageIdInput,
  onTOTPStep,
  onDilutionTargetRate,
  onDilutionStyleRandom
} = inject(HOME_CONTEXT_KEY);
</script>

<template>
  <div class="m3-col-left">
    <m3e-card :variant="themeScheme === 'light' ? 'outlined' : 'outlined'" class="config-card">
      <div class="config-card-inner">
        <!-- Header -->
        <div class="config-header" @click="isMobile && (ConfigCollapsed = !ConfigCollapsed)"
          :style="{ cursor: isMobile ? 'pointer' : 'default' }">
          <span class="config-header-title">
            <m3e-icon name="tune"></m3e-icon>配置面板
          </span>
          <m3e-icon v-show="isMobile" name="expand_more" class="chevron-icon"
            :class="{ rotated: !ConfigCollapsed }"></m3e-icon>
        </div>

        <div class="collapsible-wrapper" :class="ConfigCollapsed ? 'is-closed' : 'is-open'">
          <div class="config-body">

            <!-- ── 文言格律 ── -->
            <p class="config-section-label">文言风格参数</p>
            <div class="collapsible-wrapper" :class="!UseDilution ? 'is-open' : 'is-closed'"
              :style="!UseDilution ? '' : 'margin-bottom: -12px;'">
              <div class="collapsible-inner">
                <div class="config-rows">
                  <div class="setting-row">
                    <span>骈文对仗</span>
                    <m3e-switch id="swForcePian" :checked="ForcePian ? true : undefined"
                      :disabled="ForceLogi ? true : undefined" @change="onChangePian" icons="both"></m3e-switch>
                  </div>
                  <div class="setting-row">
                    <span>逻辑判断</span>
                    <m3e-switch id="swForceLogi" :checked="ForceLogi ? true : undefined"
                      :disabled="ForcePian ? true : undefined" @change="onChangeLogi" icons="both"></m3e-switch>
                  </div>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <span>去除标点</span>
              <m3e-switch id="swForceNoMark" :checked="ForceNoMark ? true : undefined" @change="onChangeNoMark"
                icons="both"></m3e-switch>
            </div>
            <div class="setting-row">
              <span>繁體中文</span>
              <m3e-switch id="swOutputTraditional" :checked="OutputTraditional ? true : undefined"
                @change="onChangeTraditional" icons="both"></m3e-switch>
            </div>
            <div>
              <div class="setting-row">
                <span id="lblUseDilution">密文稀释</span>
                <m3e-switch id="swUseDilution" :checked="UseDilution ? true : undefined" @change="onChangeDilution"
                  icons="both"></m3e-switch>
                <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseDilution" hide-delay="200">
                  <span slot="subhead" style="font-weight: bold;">密文稀释</span>
                  将加密汉字分散嵌入真实古文与诗词句式中，改变统计分布特征（会显著增加密文长度）。
                </m3e-rich-tooltip>
              </div>

              <div class="collapsible-wrapper" :class="UseDilution ? 'is-open' : 'is-closed'">
                <div class="collapsible-inner">
                  <div class="dilution-panel">
                    <div class="slider-row">
                      <div class="slider-label-row">
                        <span id="lblDilutionTargetRate">目标载荷率</span>
                        <span>{{ getDilutionTargetRateLabel(DilutionTargetRatePct) }} ({{ DilutionTargetRatePct
                          }}%)</span>
                      </div>
                      <m3e-slider labelled :min="1" :max="50" :step="1" style="width:100%;">
                        <m3e-slider-thumb id="slDilutionTargetRate" :value="DilutionTargetRatePct"
                          @input="onDilutionTargetRate"></m3e-slider-thumb>
                      </m3e-slider>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionTargetRate" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">目标载荷率</span>
                        控制加密汉字在全文中的预期占比（1% - 50%），数值越低文本越长。
                      </m3e-rich-tooltip>
                    </div>

                    <div class="dilution-control-group">
                      <span id="lblDilutionFilterMode" class="dilution-control-label">文体过滤</span>
                      <m3e-segmented-button class="compact-segmented" hide-selection-indicator
                        @change="e => e.currentTarget.value && (DilutionFilterMode = e.currentTarget.value)">
                        <m3e-button-segment v-for="opt in dilutionFilterOptions" :key="opt.value" :value="opt.value"
                          :checked="DilutionFilterMode === opt.value ? true : undefined"
                          @click="DilutionFilterMode = opt.value">{{ opt.label }}</m3e-button-segment>
                      </m3e-segmented-button>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionFilterMode" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">文体过滤</span>
                        限定稀释选句时允许使用的古典文体范围。
                      </m3e-rich-tooltip>
                    </div>

                    <div class="collapsible-wrapper"
                      :class="(DilutionFilterMode === 'ALL' || DilutionFilterMode === 'POEM') ? 'is-open' : 'is-closed'"
                      :style="(DilutionFilterMode === 'ALL' || DilutionFilterMode === 'POEM') ? '' : 'margin-top: -14px;'">
                      <div class="collapsible-inner">
                        <div class="dilution-sub-stack" style="padding-top: 2px;">
                          <div class="dilution-control-group">
                            <span id="lblDilutionPoemFilter" class="dilution-control-label">古诗体裁</span>
                            <m3e-segmented-button class="compact-segmented" hide-selection-indicator
                              @change="e => e.currentTarget.value && (DilutionPoemFilterMode = e.currentTarget.value)">
                              <m3e-button-segment v-for="opt in dilutionPoemFilterOptions" :key="opt.value"
                                :value="opt.value"
                                :checked="DilutionPoemFilterMode === opt.value ? true : undefined"
                                @click="DilutionPoemFilterMode = opt.value">{{ opt.label }}</m3e-button-segment>
                            </m3e-segmented-button>
                            <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionPoemFilter" hide-delay="200">
                              <span slot="subhead" style="font-weight: bold;">古诗体裁</span>
                              仅对古诗模板生效，可筛选四言、五言或七言诗句。
                            </m3e-rich-tooltip>
                          </div>

                          <div class="setting-row sub-row">
                            <span id="lblDilutionPoemAutoBreak">古诗自动换行</span>
                            <m3e-switch id="swDilutionPoemAutoBreak"
                              :checked="DilutionPoemAutoLineBreak ? true : undefined"
                              @change="onChangeDilutionPoemAutoBreak" icons="both"></m3e-switch>
                            <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionPoemAutoBreak" hide-delay="200">
                              <span slot="subhead" style="font-weight: bold;">古诗自动换行</span>
                              为每条古诗模板末尾自动添加单换行以保留诗行排版。
                            </m3e-rich-tooltip>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="GeekMode && GeekAdvancedDilution" class="dilution-sub-stack">
                      <m3e-divider style="margin: 2px 0;"></m3e-divider>
                      <div class="dilution-control-group">
                        <span id="lblDilutionSampleMode" class="dilution-control-label">采样模式</span>
                        <m3e-segmented-button class="compact-segmented" hide-selection-indicator
                          @change="e => e.currentTarget.value && (DilutionSampleMode = e.currentTarget.value)">
                          <m3e-button-segment v-for="opt in dilutionSampleOptions" :key="opt.value"
                            :value="opt.value" :checked="DilutionSampleMode === opt.value ? true : undefined"
                            @click="DilutionSampleMode = opt.value">{{ opt.label }}</m3e-button-segment>
                        </m3e-segmented-button>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionSampleMode" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">采样模式</span>
                          自适应采样兼顾语料连贯性与预算评分；随机采样每轮重新定位。
                        </m3e-rich-tooltip>
                      </div>

                      <div class="collapsible-wrapper"
                        :class="DilutionSampleMode === 'SMART' ? 'is-open' : 'is-closed'"
                        :style="DilutionSampleMode === 'SMART' ? '' : 'margin-top: -14px;'">
                        <div class="collapsible-inner">
                          <div class="slider-row" style="padding-top: 2px;">
                            <div class="slider-label-row">
                              <span id="lblDilutionStyleRandom">起始位置随机性</span>
                              <span>{{ DilutionStyleRandomIndex }}</span>
                            </div>
                            <m3e-slider labelled :min="0" :max="100" :step="1" style="width:100%;">
                              <m3e-slider-thumb id="slDilutionStyleRandom" :value="DilutionStyleRandomIndex"
                                @input="onDilutionStyleRandom"></m3e-slider-thumb>
                            </m3e-slider>
                            <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionStyleRandom" hide-delay="200">
                              <span slot="subhead" style="font-weight: bold;">起始位置随机性</span>
                              存在多个可行起点时，按该百分比概率随机挑选起点而非选最优起点。
                            </m3e-rich-tooltip>
                          </div>
                        </div>
                      </div>

                      <div class="dilution-control-group">
                        <span id="lblDilutionDistribution" class="dilution-control-label">段内载荷分布</span>
                        <m3e-segmented-button class="compact-segmented" hide-selection-indicator
                          @change="e => e.currentTarget.value && (DilutionPayloadDistribution = e.currentTarget.value)">
                          <m3e-button-segment v-for="opt in dilutionDistributionOptions" :key="opt.value"
                            :value="opt.value"
                            :checked="DilutionPayloadDistribution === opt.value ? true : undefined"
                            @click="DilutionPayloadDistribution = opt.value">{{ opt.label }}</m3e-button-segment>
                        </m3e-segmented-button>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="lblDilutionDistribution" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">段内载荷分布</span>
                          控制有效载荷字在段内是均匀铺开还是相对集中于连续区间。
                        </m3e-rich-tooltip>
                      </div>

                      <div class="corpus-summary-row">
                        <div class="corpus-summary-text">
                          <span id="lblCustomCorpus" class="corpus-summary-title">稀释语料库</span>
                          <span class="corpus-summary-sub">{{ CustomCorpusSummary || STD_CORPUS_SUMMARY }}</span>
                        </div>
                        <m3e-button variant="tonal" size="small" @click="showCustomCorpusDialog">选择文件</m3e-button>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="lblCustomCorpus" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">稀释语料库</span>
                          默认使用内置 Std 语料库，可导入本地自定义语料库 JSON 文件。
                        </m3e-rich-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="config-section-label" style="margin-top: 12px;">文言分段参数</p>
            <div class="sub-section">
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>每段载荷数 ({{ WenyanMin }} - {{ WenyanMax }})</span>
                </div>
                <m3e-slider labelled :min="20" :max="200" :step="1" style="width:100%;">
                  <m3e-slider-thumb :value="WenyanMin"
                    @input="WenyanMin = Number($event.target.value)"></m3e-slider-thumb>
                  <m3e-slider-thumb :value="WenyanMax"
                    @input="WenyanMax = Number($event.target.value)"></m3e-slider-thumb>
                </m3e-slider>
              </div>
            </div>

            <m3e-divider style="margin: 10px 0 4px;"></m3e-divider>

            <!-- ── 高级安全加密 ── -->
            <div class="setting-row">
              <span id="lblAdvancedEnc" style="font-weight:600;">高级安全加密</span>
              <m3e-switch id="swAdvancedEnc" :checked="AdvancedEnc ? true : undefined" @change="onChangeAdv"
                icons="both"></m3e-switch>
              <m3e-rich-tooltip v-if="EnableTooltips" for="lblAdvancedEnc" hide-delay="200">
                <span slot="subhead" style="font-weight: bold;">高级安全加密</span>
                启用更多现代密码学套件，牺牲时间或空间来换取更高的密文安全性。
              </m3e-rich-tooltip>
            </div>

            <div class="collapsible-wrapper" :class="AdvancedEnc ? 'is-open' : 'is-closed'">
              <div class="collapsible-inner">
                <div style="padding-top: 4px;">
                  <p class="config-section-label">密码学套件</p>
                  <div class="sub-section">
                    <div class="setting-row sub-row">
                      <span id="lblUseStrongIV">强 IV</span>
                      <m3e-switch id="swUseStrongIV" :checked="UseStrongIV ? true : undefined"
                        @change="onChangeStrongIV" icons="both"></m3e-switch>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseStrongIV" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">强 IV</span>
                        使用完整的16字节IV来降低密钥流重用几率，密文会变长。
                      </m3e-rich-tooltip>
                    </div>
                    <div class="setting-row sub-row">
                      <span id="lblUseHMAC">HMAC 消息签名</span>
                      <m3e-switch id="swUseHMAC" :checked="UseHMAC ? true : undefined" @change="onChangeHMAC"
                        icons="both"></m3e-switch>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseHMAC" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">HMAC 消息签名</span>
                        校验密文完整性，防止被恶意篡改。
                      </m3e-rich-tooltip>
                    </div>
                    <div class="setting-row sub-row">
                      <span id="lblUsePBKDF2">PBKDF2 密钥衍生</span>
                      <m3e-switch id="swUsePBKDF2" :checked="UsePBKDF2 ? true : undefined" @change="onChangePBKDF2"
                        icons="both"></m3e-switch>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblUsePBKDF2" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">PBKDF2 密钥衍生</span>
                        将密钥哈希迭代十万次，增加密码破解难度，这可能会导致卡顿。
                      </m3e-rich-tooltip>
                    </div>
                    <div class="setting-row sub-row">
                      <span id="lblUseTOTP">TOTP 时效性加密</span>
                      <m3e-switch id="swUseTOTP" :checked="UseTOTP ? true : undefined"
                        :disabled="!UsePBKDF2 ? true : undefined" @change="onChangeTOTP" unchecked-icon="lock_open"
                        checked-icon="lock_clock"></m3e-switch>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseTOTP" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">TOTP 时效性加密</span>
                        相比单纯开启 PBKDF2 可以缩短密文长度，可使密文具有时效性
                      </m3e-rich-tooltip>
                    </div>
                  </div>

                  <!-- TOTP details -->
                  <div class="collapsible-wrapper" :class="(UsePBKDF2 && UseTOTP) ? 'is-open' : 'is-closed'">
                    <div class="collapsible-inner">
                      <div style="margin-top:10px;margin-bottom: 16px;display:flex;flex-direction:column;gap:16px;">
                        <p class="config-section-label">TOTP 参数</p>
                        <div class="slider-row" id="rowTOTPStep">
                          <div class="slider-label-row">
                            <span id="lblTOTPStep">时间窗口</span>
                            <span>{{ getStepLabel(TOTPTimeStepVal) }}</span>
                          </div>
                          <m3e-slider discrete labelled :min="0" :max="15" :step="1" style="width:100%;">
                            <m3e-slider-thumb id="slTOTPStep" :value="4" @input="onTOTPStep"></m3e-slider-thumb>
                          </m3e-slider>
                        </div>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="lblTOTPStep" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">时间窗口</span>
                          控制密文多快会过期失效。
                        </m3e-rich-tooltip>

                        <div class="totp-expiry-chip">{{ TOTPExpiryLabel }}</div>

                        <m3e-form-field hide-subscript="always" variant="outlined" style="width:100%;"
                          id="inpTOTPEpoch">
                          <label slot="label">时间戳</label>
                          <input type="number" :value="TOTPEpochVal" @input="TOTPEpochVal = $event.target.value"
                            placeholder="留空为系统当前时间" />
                        </m3e-form-field>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="inpTOTPEpoch" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">时间戳</span>
                          指定加解密时使用的基准时间，可用来解密过期密文，或加密尚未生效的密文。
                        </m3e-rich-tooltip>

                        <m3e-form-field hide-subscript="always" variant="outlined" style="width:100%;"
                          id="inpTOTPBasekey">
                          <label slot="label" id="lblTOTPBasekey">预共享密钥</label>
                          <input type="text" :value="TOTPBasekeyVal" @input="TOTPBasekeyVal = $event.target.value"
                            placeholder="留空为加密主密钥" />
                        </m3e-form-field>
                        <m3e-rich-tooltip v-if="EnableTooltips" for="inpTOTPBasekey" hide-delay="200">
                          <span slot="subhead" style="font-weight: bold;">预共享密钥</span>
                          设置TOTP计算时的附加密码，推荐填写发布密文所在的网站域名。
                        </m3e-rich-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 灵活分段传输 -->
            <m3e-divider style="margin: 0px 0px 16px"></m3e-divider>

            <div class="setting-row">
              <span id="lblUseFlexible" style="font-weight:600;">灵活分段传输</span>
              <m3e-switch id="swUseFlexible" :checked="UseFlexible ? true : undefined" @change="onChangeFlex"
                icons="both"></m3e-switch>
              <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseFlexible" hide-delay="200">
                <span slot="subhead" style="font-weight: bold;">灵活分段传输</span>
                将超长消息切分为多个短片段，便于在字数受限的平台上发送。
              </m3e-rich-tooltip>
            </div>

            <div class="collapsible-wrapper" :class="UseFlexible ? 'is-open' : 'is-closed'">
              <div class="collapsible-inner">
                <div style="padding-top:4px;">
                  <p class="config-section-label">分段参数</p>
                  <div class="sub-section">
                    <div class="setting-row sub-row">
                      <span id="lblUseAONT">分段互锁(AONT)</span>
                      <m3e-switch id="swUseAONT" :checked="UseAONT ? true : undefined" @change="onChangeAONT"
                        icons="both"></m3e-switch>
                      <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseAONT" hide-delay="200">
                        <span slot="subhead" style="font-weight: bold;">分段互锁(AONT)</span>
                        必须收集齐所有片段才能解密出内容。
                      </m3e-rich-tooltip>
                    </div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
                    <m3e-form-field variant="outlined" style="width:100%;" id="inpMessageID">
                      <label slot="label" id="lblMessageID">消息 ID</label>
                      <input type="number" :value="MessageID" @input="onMessageIdInput" placeholder="留空为随机" />
                    </m3e-form-field>
                    <m3e-rich-tooltip v-if="EnableTooltips" for="lblMessageID" hide-delay="200">
                      <span slot="subhead" style="font-weight: bold;">消息 ID</span>
                      用于给分段消息进行编号分类，防止混淆。
                    </m3e-rich-tooltip>

                    <div class="slider-row" id="rowFlexibleRange">
                      <div class="slider-label-row">
                        <span id="lblFlexibleRange">分段范围 ({{ FlexibleMin }} - {{ FlexibleMax
                        }})</span>
                      </div>
                      <m3e-slider size="extra-small" :min="10" :max="380" :step="1" style="width:100%;" labelled>
                        <m3e-slider-thumb :value="FlexibleMin"
                          @input="FlexibleMin = Number($event.target.value)"></m3e-slider-thumb>
                        <m3e-slider-thumb :value="FlexibleMax"
                          @input="FlexibleMax = Number($event.target.value)"></m3e-slider-thumb>
                      </m3e-slider>
                    </div>
                    <m3e-rich-tooltip v-if="EnableTooltips" for="lblFlexibleRange" hide-delay="200">
                      <span slot="subhead" style="font-weight: bold;">分段范围</span>
                      每个密文分段的长度上下限。
                    </m3e-rich-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m3e-card>
  </div>
</template>
