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
import { ref, onUnmounted } from "vue";
import { Abracadabra } from "abracadabra-cn";
import { M3eSnackbar } from "@m3e/web/snackbar";
import {
  readBoolStorage,
  writeBoolStorage,
  getSwVal,
  openDialog,
  closeDialog,
  formatCorpusSummary
} from "@/utils/cipherHelpers";

const GEEK_MODE_STORAGE_KEY = "abra-geek-mode";
const GEEK_TOOLTIPS_STORAGE_KEY = "abra-geek-tooltips";
const GEEK_ADV_DILUTION_STORAGE_KEY = "abra-geek-dilution";
const GEEK_HIGHLIGHT_STORAGE_KEY = "abra-geek-highlight";

let cachedStdCorpus = null;
export function hasCachedStdDilutionCorpus() {
  return Boolean(cachedStdCorpus);
}
export function getStdDilutionCorpus() {
  if (!cachedStdCorpus) {
    cachedStdCorpus = new Abracadabra.DilutionCorpus();
  }
  return cachedStdCorpus;
}

export const corpusSlots = [
  { key: "MANIFEST", inputId: "corpusManifestIn", title: "Manifest 清单", multiple: false, emptyText: "未选择（必须）" },
  { key: "B", inputId: "corpusBIn", title: "一般古文(B)", multiple: true, emptyText: "未选择" },
  { key: "S", inputId: "corpusSIn", title: "古诗(S)", multiple: true, emptyText: "未选择" },
  { key: "C", inputId: "corpusCIn", title: "宋词(C)", multiple: true, emptyText: "未选择" }
];

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(String(ev.target.result || ""));
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`));
    reader.readAsText(file, "utf-8");
  });
}

function buildCorpusPartInput(files) {
  if (!files || files.length === 0) return null;
  const parsed = files.map((f) => {
    try {
      return JSON.parse(f.text);
    } catch {
      throw new Error(`JSON 解析失败：${f.name}`);
    }
  });
  return parsed.length === 1 ? parsed[0] : parsed;
}

export function useGeekMode({
  DilutionSampleMode,
  DilutionStyleRandomIndex,
  DilutionPayloadDistribution,
  currentInsight,
  showInsight,
  updateInsight
}) {
  const GeekMode = ref(readBoolStorage(GEEK_MODE_STORAGE_KEY));
  const EnableTooltips = ref(GeekMode.value && readBoolStorage(GEEK_TOOLTIPS_STORAGE_KEY));
  const GeekAdvancedDilution = ref(GeekMode.value && readBoolStorage(GEEK_ADV_DILUTION_STORAGE_KEY));
  const GeekHighlightPayload = ref(GeekMode.value && readBoolStorage(GEEK_HIGHLIGHT_STORAGE_KEY));

  // Custom Dilution Corpus State (Geek Mode)
  const CustomCorpus = ref(null);
  const CustomCorpusSummary = ref("");
  const CorpusManifestFile = ref(null);
  const CorpusBFiles = ref([]);
  const CorpusSFiles = ref([]);
  const CorpusCFiles = ref([]);
  const CorpusDialogError = ref("");

  let geekClickCount = 0;
  let geekClickTimer = null;

  onUnmounted(() => {
    clearTimeout(geekClickTimer);
  });

  function showGeekDialog() {
    closeDialog("AboutDialog");
    openDialog("GeekDialog");
  }

  function closeGeekDialog() {
    closeDialog("GeekDialog");
    openDialog("AboutDialog");
  }

  function onVersionItemClick() {
    if (GeekMode.value) {
      M3eSnackbar.open("您已处于极客模式");
      return;
    }
    geekClickCount += 1;
    clearTimeout(geekClickTimer);
    geekClickTimer = setTimeout(() => {
      geekClickCount = 0;
    }, 2000);

    if (geekClickCount >= 3 && geekClickCount < 7) {
      M3eSnackbar.open(`再点击 ${7 - geekClickCount} 次即可进入极客模式`);
    } else if (geekClickCount >= 7) {
      geekClickCount = 0;
      clearTimeout(geekClickTimer);
      GeekMode.value = true;
      writeBoolStorage(GEEK_MODE_STORAGE_KEY, true);
      currentInsight.value = "极客模式已激活";
      showInsight.value = true;
      M3eSnackbar.open("极客模式已激活");
    }
  }

  function clearCustomCorpusFiles() {
    CorpusManifestFile.value = null;
    CorpusBFiles.value = [];
    CorpusSFiles.value = [];
    CorpusCFiles.value = [];
    CorpusDialogError.value = "";
    ["corpusManifestIn", "corpusBIn", "corpusSIn", "corpusCIn"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  function resetToStdCorpus(notify = true) {
    CustomCorpus.value = null;
    CustomCorpusSummary.value = "";
    clearCustomCorpusFiles();
    if (notify) {
      M3eSnackbar.open("已恢复内置 Std 语料库");
    }
  }

  function resetGeekAdvancedDilutionSettings() {
    DilutionSampleMode.value = "SMART";
    DilutionStyleRandomIndex.value = 50;
    DilutionPayloadDistribution.value = "UNIFORM";
    resetToStdCorpus(false);
  }

  function onChangeEnableTooltips(e) {
    EnableTooltips.value = getSwVal(e);
    writeBoolStorage(GEEK_TOOLTIPS_STORAGE_KEY, EnableTooltips.value);
  }

  function onChangeGeekAdvancedDilution(e) {
    GeekAdvancedDilution.value = getSwVal(e);
    writeBoolStorage(GEEK_ADV_DILUTION_STORAGE_KEY, GeekAdvancedDilution.value);
    if (!GeekAdvancedDilution.value) {
      resetGeekAdvancedDilutionSettings();
      closeDialog("CustomCorpusDialog");
    }
  }

  function onChangeGeekHighlightPayload(e) {
    GeekHighlightPayload.value = getSwVal(e);
    writeBoolStorage(GEEK_HIGHLIGHT_STORAGE_KEY, GeekHighlightPayload.value);
  }

  function disableGeekMode() {
    geekClickCount = 0;
    clearTimeout(geekClickTimer);
    GeekMode.value = false;
    EnableTooltips.value = false;
    GeekAdvancedDilution.value = false;
    GeekHighlightPayload.value = false;
    resetGeekAdvancedDilutionSettings();
    writeBoolStorage(GEEK_MODE_STORAGE_KEY, false);
    writeBoolStorage(GEEK_TOOLTIPS_STORAGE_KEY, false);
    writeBoolStorage(GEEK_ADV_DILUTION_STORAGE_KEY, false);
    writeBoolStorage(GEEK_HIGHLIGHT_STORAGE_KEY, false);
    closeDialog("CustomCorpusDialog");
    closeDialog("GeekDialog");
    updateInsight("ENC");
    M3eSnackbar.open("已关闭极客模式");
  }

  function showCustomCorpusDialog() {
    CorpusDialogError.value = "";
    openDialog("CustomCorpusDialog");
  }

  function closeCustomCorpusDialog() {
    CorpusDialogError.value = "";
    closeDialog("CustomCorpusDialog");
  }

  function triggerCorpusPicker(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  async function onSelectCorpusFiles(slot, e) {
    const files = Array.from(e.target.files || []);
    CorpusDialogError.value = "";
    if (files.length === 0) return;
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    try {
      const loaded = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          text: await readFileAsText(file)
        }))
      );
      if (slot === "MANIFEST") CorpusManifestFile.value = loaded[0];
      else if (slot === "B") CorpusBFiles.value = loaded;
      else if (slot === "S") CorpusSFiles.value = loaded;
      else if (slot === "C") CorpusCFiles.value = loaded;
    } catch (err) {
      CorpusDialogError.value = err.message || String(err);
    }
  }

  function getCorpusSlotFiles(key) {
    if (key === "MANIFEST") return CorpusManifestFile.value ? [CorpusManifestFile.value] : [];
    if (key === "B") return CorpusBFiles.value;
    if (key === "S") return CorpusSFiles.value;
    if (key === "C") return CorpusCFiles.value;
    return [];
  }

  function applyCustomCorpus() {
    CorpusDialogError.value = "";
    if (!CorpusManifestFile.value) {
      CorpusDialogError.value = "请先选择 Manifest 清单文件（manifest.json）。";
      return;
    }
    if (CorpusBFiles.value.length === 0 && CorpusSFiles.value.length === 0 && CorpusCFiles.value.length === 0) {
      CorpusDialogError.value = "请至少选择古文(B)、古诗(S)、宋词(C)中的一种语料文件。";
      return;
    }
    try {
      let manifestObj;
      try {
        manifestObj = JSON.parse(CorpusManifestFile.value.text);
      } catch {
        throw new Error(`Manifest JSON 解析失败：${CorpusManifestFile.value.name}`);
      }
      if (!manifestObj || typeof manifestObj.Tier !== "string" || !manifestObj.Tier.trim()) {
        throw new Error("Manifest 无效：缺少字符串类型的 Tier 字段。");
      }
      const bInput = buildCorpusPartInput(CorpusBFiles.value);
      const sInput = buildCorpusPartInput(CorpusSFiles.value);
      const cInput = buildCorpusPartInput(CorpusCFiles.value);
      const corpus = new Abracadabra.DilutionCorpus(manifestObj, bInput, sInput, cInput);
      CustomCorpus.value = corpus;
      CustomCorpusSummary.value = formatCorpusSummary(corpus);
      closeCustomCorpusDialog();
      M3eSnackbar.open(`已加载语料库：${CustomCorpusSummary.value}`);
    } catch (err) {
      CorpusDialogError.value = err?.message || String(err);
    }
  }

  return {
    GeekMode,
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
    showGeekDialog,
    closeGeekDialog,
    onVersionItemClick,
    resetToStdCorpus,
    resetGeekAdvancedDilutionSettings,
    onChangeEnableTooltips,
    onChangeGeekAdvancedDilution,
    onChangeGeekHighlightPayload,
    disableGeekMode,
    showCustomCorpusDialog,
    closeCustomCorpusDialog,
    triggerCorpusPicker,
    onSelectCorpusFiles,
    getCorpusSlotFiles,
    applyCustomCorpus
  };
}
