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

export function readBoolStorage(key) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function writeBoolStorage(key, val) {
  try {
    if (val) localStorage.setItem(key, "true");
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function getSwVal(e) {
  const t = e.currentTarget || e.target;
  return t.selected === true || t.checked === true;
}

export function fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(new Uint8Array(e.target.result));
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

export function normalizeToUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === "string") return new TextEncoder().encode(data);
  if (Array.isArray(data)) {
    if (data.length === 0 || typeof data[0] === "number") {
      return new Uint8Array(data);
    }
    let totalLength = 0;
    const arrays = data.map(normalizeToUint8Array);
    for (const arr of arrays) totalLength += arr.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }
  return new Uint8Array(0);
}

export function uint8ArrayToFile(arr, fileName, mime) {
  const u8 = normalizeToUint8Array(arr);
  return new File([new Blob([u8], { type: mime })], fileName, { type: mime });
}

export function getCookie(name) {
  for (const c of document.cookie.split(";")) {
    const t = c.trim();
    if (t.startsWith(name + "=")) return t.substring(name.length + 1);
  }
  return "";
}

const WEAK_PASSWORD_IGNORE_KEY = "abra-weak-password-ignore";
let weakPasswordIgnoredSession = false;

function readSessionFlag(key) {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeSessionFlag(key) {
  try {
    sessionStorage.setItem(key, "true");
  } catch { /* ignore */ }
}

export function isWeakPasswordWarningIgnored() {
  return (
    weakPasswordIgnoredSession ||
    readSessionFlag(WEAK_PASSWORD_IGNORE_KEY) ||
    getCookie("AdvancedEncWeakPasswordIgnore") === "true"
  );
}

export function ignoreWeakPasswordWarning() {
  weakPasswordIgnoredSession = true;
  writeSessionFlag(WEAK_PASSWORD_IGNORE_KEY);
  try {
    document.cookie = "AdvancedEncWeakPasswordIgnore=true";
  } catch { /* ignore */ }
}

export function openDialog(id) {
  const d = document.getElementById(id);
  if (d) {
    if (d.show) d.show();
    else d.open = true;
  }
}

export function closeDialog(id) {
  const d = document.getElementById(id);
  if (d) {
    if (d.hide) d.hide();
    else d.open = false;
  }
}

export function formatCorpusSlotText(files, emptyText) {
  if (!files || files.length === 0) return emptyText;
  if (files.length === 1) return files[0].name;
  return `已选 ${files.length} 个分片`;
}

export function formatCompactCorpusCount(count) {
  if (count >= 1_000_000) {
    const m = Math.floor(count / 1_000_000);
    if (m > 0) return `${m}M`;
  }
  if (count >= 1_000) {
    const k = Math.floor(count / 1_000);
    if (k > 0) return `${k}K`;
  }
  return `${Math.floor(count)}`;
}

export const STD_CORPUS_SUMMARY = `Std · ${formatCompactCorpusCount(110000)}`;

export function formatCorpusSummary(corpus) {
  const total =
    (corpus?.B?.Metadata?.SentenceCount || 0) +
    (corpus?.S?.Metadata?.SentenceCount || 0) +
    (corpus?.C?.Metadata?.SentenceCount || 0);
  return `${corpus.Tier} · ${formatCompactCorpusCount(total)}`;
}

export function getRandomnessLabel(v) {
  if (v < 10) return "长句优先";
  if (v < 35) return "稍随机";
  if (v < 65) return "适中";
  if (v < 90) return "较随机";
  return "完全随机";
}

export function getDilutionRandomnessLabel(v) {
  if (v === 0) return "连贯优先";
  if (v < 35) return "较高连贯";
  if (v < 65) return "适中";
  if (v < 90) return "频繁跳转";
  return "完全随机";
}

export function getDilutionTargetRateLabel(pct) {
  if (pct < 5) return "极低";
  if (pct <= 10) return "低";
  if (pct > 35) return "极高";
  if (pct > 25) return "很高";
  return "高";
}

export function getStepLabel(v) {
  return ["3分钟", "5分钟", "10分钟", "30分钟", "2小时", "6小时", "12小时",
    "1天", "3天", "5天", "1周", "3周", "1个月", "2个月", "6个月", "1年"][v] ?? "";
}

export function openRepo() {
  window.open("https://github.com/SheepChef/Abracadabra", "_blank");
}

export function openRelease() {
  window.open("https://github.com/SheepChef/Abracadabra/releases", "_blank");
}
