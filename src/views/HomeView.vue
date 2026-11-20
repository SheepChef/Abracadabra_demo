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
import { ref, onMounted, onUnmounted, inject, provide, watch, nextTick } from "vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import CipherWorkspace from "@/components/CipherWorkspace.vue";
import SideStatusColumn from "@/components/SideStatusColumn.vue";
import InfoDialogs from "@/components/InfoDialogs.vue";
import GeekDialogs from "@/components/GeekDialogs.vue";
import { HOME_CONTEXT_KEY } from "@/composables/homeContext";
import { useGeekMode } from "@/composables/useGeekMode";
import { useCipherConfig } from "@/composables/useCipherConfig";
import { useCipherRunner } from "@/composables/useCipherRunner";
import { openDialog } from "@/utils/cipherHelpers";

const CoreVersion = __CORE_VERSION__;
const BuildDate = __BUILD_DATE__;
const BuildHash = __BUILD_HASH__;
const isAndroidApp = __IS_ANDROID_APP__;
const isExtension = __IS_EXTENSION__;
const isSingleFile = __IS_SINGLEFILE__;

// ── Theme ───────────────────────────────────────────────────────────
const themeColor = inject("themeColor");
const themeScheme = inject("themeScheme");
const setThemeColor = inject("setThemeColor");
const setThemeScheme = inject("setThemeScheme");

// ── Composables ─────────────────────────────────────────────────────
let runner = null;
const config = useCipherConfig(() => runner);
const geek = useGeekMode({
  DilutionSampleMode: config.DilutionSampleMode,
  DilutionStyleRandomIndex: config.DilutionStyleRandomIndex,
  DilutionPayloadDistribution: config.DilutionPayloadDistribution,
  currentInsight: config.currentInsight,
  showInsight: config.showInsight,
  updateInsight: config.updateInsight
});
runner = useCipherRunner({ config, geek, isAndroidApp });

// ── UI & PWA State ──────────────────────────────────────────────────
const isMobile = ref(window.innerWidth <= 768);
const ConfigCollapsed = ref(isMobile.value); // Default open on desktop, closed on mobile
const ShowPWAButton = ref(false);
let deferredPWAPrompt = null;

function showPWANotSupportedDialog() { openDialog("PWANotSupportedDialog"); }
function showCompatibilityDialog() { openDialog("CompatibilityDialog"); }
function showAboutDialog() { openDialog("AboutDialog"); }

const isPWA = () => {
  if (isSingleFile) {
    return true;
  }
  const displayModes = ["fullscreen", "standalone", "minimal-ui"];
  const matchesPwa = displayModes.some(
    (displayMode) => window.matchMedia("(display-mode: " + displayMode + ")").matches
  );
  return matchesPwa || window.navigator?.standalone || document.referrer.includes("android-app://");
};

function InstallPWA() {
  const ua = navigator.userAgent;
  if (
    /MicroMessenger|WeChat|baiduboxapp|BaiduHD|baidubrowser|QQ\/|MQQBrowser|Weibo|AliApp|AlipayClient|DingTalk|ToutiaoMicroApp|NewsArticle|BytedanceWebview|aweme|Quark|UCBrowser/i.test(ua) ||
    !("serviceWorker" in navigator)
  ) {
    showPWANotSupportedDialog();
    return;
  }
  if (deferredPWAPrompt) {
    deferredPWAPrompt.prompt();
    deferredPWAPrompt.userChoice.then(() => {
      deferredPWAPrompt = null;
      ShowPWAButton.value = false;
    });
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────
function handleResize() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) ConfigCollapsed.value = false;
}

// Hack to fix m3e-slider touch-action: none blocking vertical scroll on mobile
function patchSliderTouchAction() {
  document.querySelectorAll("m3e-slider").forEach((slider) => {
    if (slider.shadowRoot && !slider.shadowRoot.querySelector("[data-pan-y-patch]")) {
      const style = document.createElement("style");
      style.setAttribute("data-pan-y-patch", "true");
      style.textContent = `
        .base, .track, .track-inactive, .track-active, .ticks, .tick, .touch, .handle {
          touch-action: pan-y !important;
        }
      `;
      slider.shadowRoot.appendChild(style);
    }
  });
}

watch([geek.GeekMode, geek.GeekAdvancedDilution], async ([gm, gad]) => {
  if (gm && gad) {
    await nextTick();
    patchSliderTouchAction();
  }
});

onMounted(() => {
  patchSliderTouchAction();

  // 部分浏览器环境不兼容
  try {
    document.querySelector(":dir(ltr)"); // 检查CSS语法兼容性
    if (CSS.supports("transition-behavior", "allow-discrete") === false) {
      showCompatibilityDialog();
    }
  } catch {
    showCompatibilityDialog();
  }

  // 如果在插件环境下，那么强行注入插件的类名，以变更页面样式。
  if (isExtension) {
    document.body.classList.add("crx-popup");
    ConfigCollapsed.value = false;
  }

  // Resize事件，用于在窄屏下将配置面板设为可折叠。在宽屏模式下自动展开。
  window.addEventListener("resize", handleResize);
  if (isPWA()) {
    ShowPWAButton.value = false;
  } else {
    ShowPWAButton.value = true;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPWAPrompt = e;
    ShowPWAButton.value = true;
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

provide(HOME_CONTEXT_KEY, {
  ...config,
  ...geek,
  ...runner,
  CoreVersion,
  BuildDate,
  BuildHash,
  isAndroidApp,
  isExtension,
  themeColor,
  themeScheme,
  setThemeColor,
  setThemeScheme,
  isMobile,
  ConfigCollapsed,
  ShowPWAButton,
  isPWA,
  InstallPWA,
  showAboutDialog
});
</script>

<template>
  <div class="page-wrapper">
    <!-- Vector Background Effect -->
    <div class="vector-bg"></div>

    <!-- ╔══════════════════════════════════════════════════
         ║  HEADER — Art Title
         ╚══════════════════════════════════════════════════ -->
    <header class="app-header" v-if="!isExtension">
      <div id="MagicBadge">
        <div class="spotlight spot-1"></div>
        <div class="spotlight spot-2"></div>
        <div class="spotlight spot-3"></div>
        <div class="spotlight spot-4"></div>
        <span class="title-text">魔曰</span>
        <span class="subtitle-text">Abracadabra</span>
      </div>
    </header>

    <div class="m3-dashboard">
      <ConfigPanel />
      <CipherWorkspace />
      <SideStatusColumn />
    </div>

    <!-- ╔══════════════════════════════════════════════════
         ║  FOOTER — Copyright & Easter Egg Trigger
         ╚══════════════════════════════════════════════════ -->
    <footer class="app-footer">
      <div>中国制造 • AIPL-1.2许可</div>
      <div>Copyright &copy; 2025-{{ new Date().getFullYear() }} <a href="https://shef.cc" target="_blank"
          rel="noopener noreferrer" style="color:var(--md-sys-color-on-surface);">SheepChef</a></div>
    </footer>

    <!-- Dialogs -->
    <InfoDialogs />
    <GeekDialogs />
  </div>
</template>
