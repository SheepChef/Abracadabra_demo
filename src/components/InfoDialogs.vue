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
import { openDialog, closeDialog, openRepo, openRelease, ignoreWeakPasswordWarning } from "@/utils/cipherHelpers";

const ctx = inject(HOME_CONTEXT_KEY);
const {
  CoreVersion,
  BuildDate,
  BuildHash,
  GeekMode,
  onVersionItemClick,
  showGeekDialog
} = ctx;

function closeWeakPassword() {
  closeDialog("WeakPasswordDialog");
}

function ignoreWeakPassword() {
  ignoreWeakPasswordWarning();
  closeWeakPassword();
}

function closeCompatibilityDialog() {
  closeDialog("CompatibilityDialog");
}

function closePWANotSupportedDialog() {
  closeDialog("PWANotSupportedDialog");
}

function closeAboutDialog() {
  closeDialog("AboutDialog");
}

function showLicenseDialog() {
  closeAboutDialog();
  openDialog("LicenseDialog");
}

function closeLicenseDialog() {
  closeDialog("LicenseDialog");
  openDialog("AboutDialog");
}
</script>

<template>
  <m3e-dialog id="WeakPasswordDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="gpp_maybe" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">弱密钥</span>
    </div>
    <div>
      您正尝试使用默认密钥执行高级加密，这将导致高级加密失去意义。在使用高级加密时，强烈建议您使用一个足够复杂的加密密钥。
    </div>
    <div slot="actions" end>
      <m3e-button variant="text" @click="ignoreWeakPassword">不再提示</m3e-button>
      <m3e-button variant="filled" @click="closeWeakPassword">明白</m3e-button>
    </div>
  </m3e-dialog>

  <m3e-dialog id="CompatibilityDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="privacy_tip" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">兼容性警告</span>
    </div>
    <div style="line-break: anywhere;">
      检测到兼容性问题。当前浏览器环境过旧，可能导致页面显示异常，部分功能可能无法正常加载。请您切换至基于 Chromium 120 或 Firefox 49 以上版本的现代浏览器。
    </div>
    <div slot="actions" end>
      <m3e-button variant="filled" @click="closeCompatibilityDialog">明白</m3e-button>
    </div>
  </m3e-dialog>

  <m3e-dialog id="PWANotSupportedDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="privacy_tip" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">安装失败</span>
    </div>
    <div style="line-break: anywhere;">
      检测到兼容性问题，当前浏览环境不支持安装渐进式网页应用。您可使用正规浏览器再次尝试，也可前往GitHub下载APK。
    </div>
    <div slot="actions" end>
      <m3e-button variant="outlined" @click="closePWANotSupportedDialog(); openRelease();">前往GitHub</m3e-button>
      <m3e-button variant="filled" @click="closePWANotSupportedDialog">明白</m3e-button>
    </div>
  </m3e-dialog>

  <m3e-dialog id="AboutDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="code_xml" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">关于魔曰</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <m3e-list variant="segmented"
        style="border-radius: 12px; background: var(--md-sys-color-surface-container-low); overflow: hidden;">
        <m3e-list-action @click="onVersionItemClick">
          <m3e-icon slot="leading" name="memory"></m3e-icon>
          核心版本
          <span slot="supporting-text">V{{ CoreVersion }}</span>
        </m3e-list-action>
        <m3e-list-item>
          <m3e-icon slot="leading" name="calendar_today"></m3e-icon>
          构建时间
          <span slot="supporting-text">{{ BuildDate }}</span>
        </m3e-list-item>
        <m3e-list-item>
          <m3e-icon slot="leading" name="tag"></m3e-icon>
          构建哈希
          <span slot="supporting-text">{{ BuildHash }}</span>
        </m3e-list-item>
        <m3e-list-item>
          <m3e-icon slot="leading" name="gavel"></m3e-icon>
          许可证
          <span slot="supporting-text">AIPL-1.2</span>
        </m3e-list-item>
      </m3e-list>

      <m3e-action-list v-if="GeekMode" variant="segmented"
        style="border-radius: 12px; background: var(--md-sys-color-surface-container-low); overflow: hidden;">
        <m3e-list-action @click="showGeekDialog">
          <m3e-icon slot="leading" name="developer_mode"></m3e-icon>
          极客菜单
          <span slot="supporting-text">管理实验性功能开关</span>
          <m3e-icon slot="trailing" name="chevron_right"></m3e-icon>
        </m3e-list-action>
      </m3e-action-list>

      <m3e-action-list variant="segmented"
        style="border-radius: 12px; background: var(--md-sys-color-surface-container-low); overflow: hidden;">
        <m3e-list-action @click="openRepo">
          <m3e-icon slot="leading" name="code"></m3e-icon>
          源代码仓库
          <span slot="supporting-text">访问 Github 获取最新源代码</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action @click="showLicenseDialog">
          <m3e-icon slot="leading" name="integration_instructions"></m3e-icon>
          开放源代码许可
          <span slot="supporting-text">查看开源组件的版权与许可信息</span>
          <m3e-icon slot="trailing" name="chevron_right"></m3e-icon>
        </m3e-list-action>
      </m3e-action-list>

      <div style="font-weight: 700; font-size: 1rem; color: var(--md-sys-color-primary); margin: 8px 0 -4px 8px;">关于作者
      </div>

      <m3e-card variant="outlined">
        <div style="margin: 20px; display: flex; flex-direction: column; gap: 20px;">
          <!-- Top Section: Avatar + Info -->
          <div style="display: flex; align-items: center; gap: 20px;">
            <!-- Avatar Circle Placeholder -->
            <div
              style="width: 76.5px; height: 76.5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
              <img src="@/assets/avatar.webp" style="width: 100%; height: 100%; object-fit: contain;"
                alt="SheepChef Avatar">
            </div>

            <!-- Info & Chips -->
            <div style="display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center;">
              <div style="font-weight: 700; font-size: 2rem; color: var(--md-sys-color-on-surface); line-height: 1;">
                SheepChef</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <!-- Contact Chip 1 -->
                <a href="https://shef.cc" target="_blank" rel="noopener noreferrer"
                  style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; height: 28px; border-radius: 14px; border: 1px solid var(--md-sys-color-outline); font-size: 0.75rem; font-weight: 500; color: var(--md-sys-color-on-surface-variant); text-decoration: none; box-sizing: border-box;">
                  <m3e-icon name="public" style="font-size: 16px;"></m3e-icon> Website
                </a>
                <!-- Contact Chip 2 -->
                <a href="mailto:i@halu.ca" target="_blank" rel="noopener noreferrer"
                  style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; height: 28px; border-radius: 14px; border: 1px solid var(--md-sys-color-outline); font-size: 0.75rem; font-weight: 500; color: var(--md-sys-color-on-surface-variant); text-decoration: none; box-sizing: border-box;">
                  <m3e-icon name="mail" style="font-size: 16px;"></m3e-icon> Email
                </a>
              </div>
            </div>
          </div>

          <!-- Bottom Section: Bio -->
          <div style="font-size: 0.9rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6;">
            一名追求优雅代码实现的独立开发者，专注于语言相关领域。
          </div>
        </div>
      </m3e-card>
    </div>
    <div slot="actions" end>
      <m3e-button variant="tonal" @click="closeAboutDialog">关闭</m3e-button>
    </div>
  </m3e-dialog>

  <m3e-dialog id="LicenseDialog">
    <div slot="header"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
      <m3e-icon name="integration_instructions"
        style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
      <span style="font-size: 24px;">开放源代码许可</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <m3e-action-list variant="segmented"
        style="border-radius: 12px; background: var(--md-sys-color-surface-container-low); overflow: hidden;">
        <m3e-list-action href="https://github.com/SheepChef/Abracadabra" target="_blank" rel="noopener noreferrer">
          abracadabra-cn
          <span slot="supporting-text">©SheepChef | AIPL-1.2</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/SheepChef/Abracadabra_nodedemo" target="_blank"
          rel="noopener noreferrer">
          abracadabra-demo
          <span slot="supporting-text">©SheepChef | AIPL-1.2</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/matraic/m3e" target="_blank" rel="noopener noreferrer">
          M3E
          <span slot="supporting-text">©matraic | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/siara-cc/Unishox2" target="_blank" rel="noopener noreferrer">
          Unishox2
          <span slot="supporting-text">©Siara-cc | Apache-2.0</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/paulmillr/noble-hashes" target="_blank" rel="noopener noreferrer">
          noble-hashes
          <span slot="supporting-text">©Paul Miller | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/paulmillr/noble-ciphers" target="_blank" rel="noopener noreferrer">
          noble-ciphers
          <span slot="supporting-text">©Paul Miller | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://huggingface.co/datasets/RUCAIBox/Erya-dataset" target="_blank" rel="noopener noreferrer">
          Erya-dataset
          <span slot="supporting-text">©RUCAIBox | Apache-2.0</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noopener noreferrer">
          chinese-poetry
          <span slot="supporting-text">©JackeyGao | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/nodeca/pako" target="_blank" rel="noopener noreferrer">
          pako
          <span slot="supporting-text">©Vitaly Puzrin&Andrei Tuputcyn | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/dankogai/js-base64" target="_blank" rel="noopener noreferrer">
          js-base64
          <span slot="supporting-text">©Dan Kogai | BSD-3-Clause</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/boo1ean/mersenne-twister" target="_blank" rel="noopener noreferrer">
          mersenne-twister
          <span slot="supporting-text">©Makoto Matsumoto | BSD-3-Clause</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/nk2028/opencc-js" target="_blank" rel="noopener noreferrer">
          opencc-js
          <span slot="supporting-text">©nk2028 | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/yeojz/otplib" target="_blank" rel="noopener noreferrer">
          otplib
          <span slot="supporting-text">©Gerald Yeo | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/101arrowz/fzstd" target="_blank" rel="noopener noreferrer">
          fzstd
          <span slot="supporting-text">©Arjun Barrett | MIT</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action href="https://github.com/ungap/structured-clone" target="_blank" rel="noopener noreferrer">
          structured-clone
          <span slot="supporting-text">©Andrea Giammarchi | ISC</span>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
      </m3e-action-list>
    </div>
    <div slot="actions" end>
      <m3e-button variant="tonal" @click="closeLicenseDialog">返回</m3e-button>
    </div>
  </m3e-dialog>
</template>
