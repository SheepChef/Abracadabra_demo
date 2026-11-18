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
import { ref, computed, watch, nextTick } from "vue";
import { Abracadabra } from "abracadabra-cn";
import { M3eSnackbar } from "@m3e/web/snackbar";
import { getStdDilutionCorpus, hasCachedStdDilutionCorpus } from "@/composables/useGeekMode";
import { fileToUint8Array, normalizeToUint8Array, isWeakPasswordWarningIgnored, openDialog } from "@/utils/cipherHelpers";

const waitForRender = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
};

export function useCipherRunner({ config, geek, isAndroidApp }) {
  // ── I/O State ───────────────────────────────────────────────────────
  const InputMode = ref("TEXT");
  const OutputMode = ref("TEXT");
  const InputText = ref("");
  const KeyText = ref("");
  const ShowPassword = ref(false);
  const OutputText = ref("");
  const OutputSegments = ref([]);
  const IsMultiSegment = ref(false);
  const ErrorMessage = ref("");
  const WarningMessage = ref("");
  const InfoMessage = ref("");
  const Loading = ref(false);

  // ── File Drop State ─────────────────────────────────────────────────
  const dropzoneActive = ref(false);
  const INFILE = ref(null);
  const FILENAME = ref("");
  const LastFileOutput = ref(null);
  const LastFileName = ref("");

  // ── Highlight State ─────────────────────────────────────────────────
  const LastActionMode = ref(null); // "ENC" | "DEC" | null
  const outputTextareaRef = ref(null);
  const outputMirrorRef = ref(null);
  const shouldHighlightPayload = computed(() =>
    geek.GeekMode.value &&
    geek.GeekHighlightPayload.value &&
    LastActionMode.value === "ENC" &&
    OutputMode.value === "TEXT" &&
    Boolean(OutputText.value)
  );

  let isProcessing = false;

  function syncOutputHighlightScroll() {
    const ta = outputTextareaRef.value;
    const mirror = outputMirrorRef.value;
    if (!ta || !mirror) return;
    mirror.scrollTop = ta.scrollTop;
    mirror.scrollLeft = ta.scrollLeft;
  }

  watch([OutputText, shouldHighlightPayload], async () => {
    await nextTick();
    syncOutputHighlightScroll();
  });

  // ── Password Copy/Cut Helpers ───────────────────────────────────────
  function PasswordCopy(e) {
    e.preventDefault();
    const cryptoInput = e.target;
    const selectedRealText = cryptoInput.value.substring(cryptoInput.selectionStart, cryptoInput.selectionEnd);
    if (e.clipboardData) {
      e.clipboardData.setData("text/plain", selectedRealText);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(selectedRealText);
    }
  }

  function PasswordCut(e) {
    e.preventDefault();
    const cryptoInput = e.target;
    const start = cryptoInput.selectionStart;
    const end = cryptoInput.selectionEnd;

    if (start === end) return;

    const selectedRealText = cryptoInput.value.substring(start, end);

    if (e.clipboardData) {
      e.clipboardData.setData("text/plain", selectedRealText);
    }

    cryptoInput.value = cryptoInput.value.substring(0, start) + cryptoInput.value.substring(end);
    cryptoInput.setSelectionRange(start, start);
    cryptoInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // ── File Helpers ────────────────────────────────────────────────────
  function dragEnter(e) { e.preventDefault(); dropzoneActive.value = true; }
  function dragLeave(e) { e.preventDefault(); dropzoneActive.value = false; }
  function dragOver(e) { e.preventDefault(); }
  function dropFile(e) {
    e.preventDefault();
    dropzoneActive.value = false;
    handleFiles(e.dataTransfer.files);
  }
  function selectFile(e) { handleFiles(e.target.files); }
  function triggerFilePicker() { document.querySelector("#fileIn").click(); }

  function handleFiles(files) {
    if (files && files.length > 0) {
      INFILE.value = files[0];
      FILENAME.value = files[0].name;
    } else {
      INFILE.value = null;
      FILENAME.value = "";
    }
  }

  async function downloadFile(fileName, mimeType, dataArr) {
    const u8 = normalizeToUint8Array(dataArr);

    if (isAndroidApp && window.cordova && window.cordova.file) {
      try {
        const blob = new Blob([u8], { type: mimeType || "application/octet-stream" });

        const saveToDir = (dirUrl, fName) => {
          return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(dirUrl, (dirEntry) => {
              dirEntry.getFile(fName, { create: true, exclusive: false }, (fileEntry) => {
                fileEntry.createWriter((fileWriter) => {
                  fileWriter.onwriteend = () => resolve(fileEntry.toURL());
                  fileWriter.onerror = (e) => reject(e);
                  fileWriter.write(blob);
                }, reject);
              }, reject);
            }, reject);
          });
        };

        try {
          const url = await saveToDir(window.cordova.file.externalRootDirectory + "Download/", fileName);
          console.log("File saved successfully to Download: " + url);
          InfoMessage.value = "文件已保存至下载目录(/Download)。";
        } catch (err) {
          console.warn("Failed to write to Download directory, falling back to externalDataDirectory", err);
          try {
            const url = await saveToDir(window.cordova.file.externalDataDirectory, fileName);
            console.log("File saved successfully to externalDataDirectory: " + url);
            InfoMessage.value = "无法写入公共目录，已保存至私有数据目录(Android/data)。";
          } catch (fallbackErr) {
            console.error("Failed to write file even with fallback", fallbackErr);
            const errCode = fallbackErr && fallbackErr.code ? `(错误码: ${fallbackErr.code})` : "";
            ErrorMessage.value = `保存文件失败，请检查存储权限设置。${errCode}`;
          }
        }
      } catch (e) {
        console.error("Error creating Blob for SAF", e);
        ErrorMessage.value = "处理文件二进制数据时发生错误，无法保存。";
      }
    } else {
      const blob = new Blob([u8], { type: mimeType || "application/octet-stream" });
      const a = document.createElement("a");
      const u = URL.createObjectURL(blob);
      a.href = u;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(u);
    }
  }

  function manualDownload() {
    if (LastFileOutput.value) {
      if (Array.isArray(LastFileOutput.value) && LastFileOutput.value.length > 0 && LastFileOutput.value[0] instanceof Uint8Array) {
        LastFileOutput.value.forEach((r, idx) => {
          let name = LastFileName.value;
          if (name.endsWith(".txt")) name = name.substring(0, name.length - 4);
          downloadFile(`${name}_msg${idx + 1}.bin`, "application/octet-stream", r);
        });
      } else {
        downloadFile(LastFileName.value, "application/octet-stream", LastFileOutput.value);
      }
    }
  }

  // ── Encrypt Logic ───────────────────────────────────────────────────
  async function ProcessEncNext() {
    if (Loading.value) return;
    if (isProcessing || Loading.value) return;
    ErrorMessage.value = "";
    WarningMessage.value = "";
    InfoMessage.value = "";

    if (!KeyText.value) {
      KeyText.value = "ABRACADABRA";
    }
    const key = KeyText.value;

    if (InputMode.value === "TEXT" && !InputText.value) { ErrorMessage.value = "请输入你要加密的文本内容。"; return; }
    if (InputMode.value === "UINT8" && !INFILE.value) { ErrorMessage.value = "请选择需要加密的文件。"; return; }

    Loading.value = true;
    isProcessing = true;
    config.updateInsight("ENC");
    const dataSize = InputMode.value === "UINT8" ? (INFILE.value ? INFILE.value.size : 0) : (InputText.value ? new TextEncoder().encode(InputText.value).length : 0);
    let isHeavyEnc = false;
    if (config.UseFlexible.value && config.AdvancedEnc.value && config.UsePBKDF2.value) {
      isHeavyEnc = dataSize > 5 * 1024;
    } else if (config.UseDilution.value && (!hasCachedStdDilutionCorpus() || dataSize > 3 * 1024)) {
      isHeavyEnc = true;
    } else if (config.UseDilution.value) {
      isHeavyEnc = dataSize > 5 * 1024 || (dataSize > 2 * 1024 && config.DilutionTargetRatePct.value <= 10);
    } else {
      isHeavyEnc = dataSize > 10 * 1024;
    }

    if (isHeavyEnc) {
      Loading.value = true;
      await waitForRender();
      await waitForRender();
      if (config.UseFlexible.value && config.AdvancedEnc.value && config.UsePBKDF2.value) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    OutputText.value = "";
    IsMultiSegment.value = false;
    OutputSegments.value = [];
    LastActionMode.value = null;
    LastFileOutput.value = null;
    LastFileName.value = "";
    try {
      const Abra = new Abracadabra(InputMode.value, OutputMode.value);
      const inputData = InputMode.value === "TEXT" ? InputText.value : await fileToUint8Array(INFILE.value);

      if ((dataSize > 10 * 1024) ||
        (dataSize > 3 * 1024 && config.UseFlexible.value && config.UsePBKDF2.value && config.AdvancedEnc.value) ||
        (config.UseDilution.value && (dataSize > 1 * 1024 || (dataSize > 0.05 * 1024 && config.DilutionTargetRatePct.value <= 10)))) {
        Loading.value = true;
        InfoMessage.value = "您正在执行密集计算。此过程可能需要一些时间并伴随页面卡顿或无响应，这是正常的计算过程，请耐心等待。";
        await new Promise((r) => setTimeout(r, 300));
        await waitForRender();
        await waitForRender();
      }

      if (key === "ABRACADABRA") {
        if (config.AdvancedEnc.value && !isWeakPasswordWarningIgnored()) {
          openDialog("WeakPasswordDialog");
          WarningMessage.value = "正在使用默认密钥，这严重损害了加密安全性。";
        } else {
          WarningMessage.value = "正在使用默认密钥，这严重损害了加密安全性。";
        }
      }

      const useAdvDilution = geek.GeekMode.value && geek.GeekAdvancedDilution.value;
      let dilutionConfigObj;
      if (config.UseDilution.value) {
        const targetRate = Number((config.DilutionTargetRatePct.value / 100).toFixed(2));
        const activeCorpus = (useAdvDilution && geek.CustomCorpus.value) ? geek.CustomCorpus.value : getStdDilutionCorpus();
        dilutionConfigObj = new Abracadabra.DilutionConfig(
          true,
          targetRate,
          config.DilutionFilterMode.value,
          config.DilutionPoemFilterMode.value,
          useAdvDilution ? config.DilutionSampleMode.value : "SMART",
          useAdvDilution ? config.DilutionPayloadDistribution.value : "UNIFORM",
          activeCorpus,
          config.DilutionPoemAutoLineBreak.value,
          useAdvDilution ? config.DilutionStyleRandomIndex.value : 50
        );
      }

      const configStyle = {
        PunctuationMark: !config.ForceNoMark.value,
        RandomIndex: config.UseDilution.value ? config.DilutionRandomnessVal.value : config.RandomnessVal.value,
        PianwenMode: config.UseDilution.value ? false : config.ForcePian.value,
        LogicMode: config.UseDilution.value ? false : config.ForceLogi.value,
        Traditional: config.OutputTraditional.value,
        RandomParagraphing: [Number(config.WenyanMin.value), Math.max(Number(config.WenyanMin.value), Number(config.WenyanMax.value))],
        ...(dilutionConfigObj ? { DilutionConfig: dilutionConfigObj } : {})
      };

      const configAdv = {
        Enable: config.AdvancedEnc.value,
        UseStrongIV: config.UseStrongIV.value,
        UseHMAC: config.UseHMAC.value,
        UsePBKDF2: config.UsePBKDF2.value,
        UseTOTP: config.UseTOTP.value,
        TOTPTimeStep: Number(config.UseTOTP.value ? config.TOTPTimeStepVal.value : 4),
        TOTPBaseKey: config.UseTOTP.value ? (config.TOTPBasekeyVal.value || key) : undefined,
        TOTPEpoch: config.UseTOTP.value
          ? (config.TOTPEpochVal.value === "" ? Date.now() : Number(config.TOTPEpochVal.value))
          : undefined,
        FlexibleTransfer: {
          Enable: config.UseFlexible.value,
          UseAONT: config.UseAONT.value,
          MessageID: config.MessageID.value === "" ? -1 : Number(config.MessageID.value),
          RandomParagraphing: [Number(config.FlexibleMin.value), Math.max(Number(config.FlexibleMin.value), Number(config.FlexibleMax.value))]
        }
      };

      Abra.WenyanInput(inputData, "ENCRYPT", key, configStyle, configAdv);

      const raw = Abra.Output();
      if (OutputMode.value === "TEXT") {
        if (Array.isArray(raw)) {
          IsMultiSegment.value = true;
          OutputSegments.value = raw;
          OutputText.value = raw.join("\n\n");
        } else {
          IsMultiSegment.value = false;
          OutputSegments.value = [];
          OutputText.value = raw;
        }
        LastActionMode.value = "ENC";
      } else {
        const ts = new Date().toISOString().replace(/T/, "_").replace(/[:.]/g, "-").slice(0, 19);
        const fn = FILENAME.value ? `enc_${ts}_${FILENAME.value}.txt` : `Abracadabra_Enc_${ts}.txt`;
        LastFileOutput.value = raw;
        LastFileName.value = fn;
        downloadFile(fn, "application/octet-stream", raw);
        OutputText.value = "文件加密处理已完成，正在自动下载。您也可以点击下方按钮重新下载。";
      }
    } catch (err) {
      const errStr = err.toString();
      if (errStr.indexOf("Unacceptable Payload Distribution Argument. \n    Minimal length should be higher than") != -1) {
        ErrorMessage.value = errStr.replace("Unacceptable Payload Distribution Argument. \n    Minimal length should be higher than", "分段参数无效：每段最小长度必须大于 ");
      } else if (errStr.includes("Cannot Complete Dilution Payload with Allowed Templates.")) {
        ErrorMessage.value = "稀释失败：当前允许的文体或诗体模板无法完成本次载荷分配，请尝试放宽过滤条件或调整目标载荷率。";
      } else if (errStr.includes("Empty Allowed Dilution Corpus.")) {
        ErrorMessage.value = "稀释失败：当前语料库中没有符合所选文体过滤条件的可用模板。";
      } else if (errStr.includes("Invalid Dilution Target Rate.")) {
        ErrorMessage.value = "稀释参数无效：目标载荷率必须在 1% 到 50% 之间。";
      } else {
        ErrorMessage.value = errStr;
      }
    } finally {
      isProcessing = false;
      Loading.value = false;
    }
  }

  // ── Decrypt Logic ───────────────────────────────────────────────────
  async function ProcessDecNext() {
    if (Loading.value) return;
    if (isProcessing || Loading.value) return;
    ErrorMessage.value = "";
    WarningMessage.value = "";
    InfoMessage.value = "";

    if (!KeyText.value) {
      KeyText.value = "ABRACADABRA";
    }
    const key = KeyText.value;

    if (InputMode.value === "TEXT" && !InputText.value) { ErrorMessage.value = "请输入你要解密的文本内容。"; return; }
    if (InputMode.value === "UINT8" && !INFILE.value) { ErrorMessage.value = "请选择需要解密的文件。"; return; }

    Loading.value = true;
    isProcessing = true;
    config.updateInsight("DEC");
    const dataSize = InputMode.value === "UINT8" ? (INFILE.value ? INFILE.value.size : 0) : (InputText.value ? new TextEncoder().encode(InputText.value).length : 0);
    const isHeavyDec = dataSize > 10 * 1024;

    if (isHeavyDec) {
      Loading.value = true;
      await waitForRender();
      await waitForRender();
    }

    OutputText.value = "";
    IsMultiSegment.value = false;
    OutputSegments.value = [];
    LastActionMode.value = null;
    LastFileOutput.value = null;
    LastFileName.value = "";
    try {
      const Abra = new Abracadabra(InputMode.value, OutputMode.value);

      if (InputMode.value === "TEXT" && InputText.value.startsWith("呋")) {
        try {
          Abra.BearDecode(InputText.value);
          OutputText.value = Abra.Output();
          LastActionMode.value = "DEC";
          WarningMessage.value = "识别并解密了「与熊论道」密文，此加密方法无法保护信息安全，不应继续使用。";
          return;
        } catch { /* ignore */ }
      }

      const inputData = InputMode.value === "TEXT" ? InputText.value : await fileToUint8Array(INFILE.value);

      if (dataSize > 3 * 1024) {
        Loading.value = true;
        InfoMessage.value = "您正在执行密集计算。此过程可能需要一些时间并伴随页面卡顿或无响应，这是正常的计算过程，请耐心等待。";
        await new Promise((r) => setTimeout(r, 500));
        await waitForRender();
        await waitForRender();
      }

      const configAdv = config.AdvancedEnc.value ? {
        TOTPBaseKey: config.UseTOTP.value ? (config.TOTPBasekeyVal.value || key) : undefined,
        TOTPEpoch: config.UseTOTP.value ? (config.TOTPEpochVal.value === "" ? Date.now() : Number(config.TOTPEpochVal.value)) : Date.now()
      } : undefined;

      let decryptSuccess = false;
      try {
        Abra.WenyanInput(inputData, "DECRYPT", key, null, configAdv);
        decryptSuccess = true;
      } catch (err) {
        try {
          Abra.OldInput(inputData, "DECRYPT", key);
          WarningMessage.value = "识别并解密了旧版魔曰密文。对旧版魔曰加密方法的支持已结束，请尽快迁移。";
          decryptSuccess = true;
        } catch {
          throw new Error("解密失败，密文损坏或密码错误：" + err.toString());
        }
      }

      if (decryptSuccess) {
        const raw = Abra.Output();
        if (raw.ErrorObj) {
          ErrorMessage.value = "至少一段密文的解密出现错误：" + raw.ErrorObj.toString();
        }
        if (OutputMode.value === "TEXT") {
          const isBinStr = (str) => typeof str === "string" && (str.includes("\uFFFD") || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str));
          let hasBinary = false;
          let processedRaw = raw;

          let u8 = null;
          if (raw instanceof Uint8Array || raw instanceof ArrayBuffer || (Array.isArray(raw) && (typeof raw[0] === "number" || (Array.isArray(raw[0]) && typeof raw[0][0] === "number")))) {
            u8 = normalizeToUint8Array(raw);
          }

          if (u8) {
            try {
              processedRaw = new TextDecoder("utf-8", { fatal: true }).decode(u8);
              if (isBinStr(processedRaw)) hasBinary = true;
            } catch {
              try {
                processedRaw = new TextDecoder("gbk", { fatal: true }).decode(u8);
                if (isBinStr(processedRaw)) hasBinary = true;
              } catch {
                processedRaw = new TextDecoder("utf-8").decode(u8);
                hasBinary = true;
              }
            }
          } else if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
            processedRaw = raw.map((str) => {
              if (isBinStr(str)) hasBinary = true;
              return str;
            });
          } else if (typeof raw === "string") {
            if (isBinStr(raw)) hasBinary = true;
          }

          if (hasBinary) {
            InfoMessage.value = `检测到非文本数据。您解密出的可能是一个文件，或是您的输入有误。您可以尝试切换为「文件输出」并再次解密。`;
          }

          if (Array.isArray(processedRaw) && processedRaw.length > 0 && typeof processedRaw[0] === "string") {
            IsMultiSegment.value = true;
            OutputSegments.value = processedRaw;
            OutputText.value = processedRaw.join("\n\n");
          } else {
            IsMultiSegment.value = false;
            OutputSegments.value = [];
            OutputText.value = Array.isArray(processedRaw) ? processedRaw.join("\n") : String(processedRaw);
          }
          LastActionMode.value = "DEC";
        } else {
          const ts = new Date().toISOString().replace(/T/, "_").replace(/[:.]/g, "-").slice(0, 19);
          let baseFn = FILENAME.value ? FILENAME.value : "Abracadabra_Result";
          if (baseFn.endsWith(".txt")) baseFn = baseFn.substring(0, baseFn.length - 4);
          const fn = `dec_${ts}_${baseFn}`;

          LastFileOutput.value = raw;
          if (Array.isArray(raw) && raw.length > 0 && raw[0] instanceof Uint8Array) {
            LastFileName.value = fn;
            raw.forEach((r, idx) => {
              downloadFile(`${fn}_msg${idx + 1}.bin`, "application/octet-stream", r);
            });
            OutputText.value = `文件解密处理已完成，共提取出 ${raw.length} 个独立文件，正在自动下载。您也可以点击下方按钮重新下载。`;
          } else {
            LastFileName.value = fn + ".bin";
            downloadFile(fn + ".bin", "application/octet-stream", raw);
            OutputText.value = "文件解密处理已完成，正在自动下载。您也可以点击下方按钮重新下载。";
          }
        }
      }
    } catch (err) {
      ErrorMessage.value = err.toString();
    } finally {
      isProcessing = false;
      Loading.value = false;
    }
  }

  function copyall() {
    if (!OutputText.value) return;
    navigator.clipboard.writeText(OutputText.value);
    M3eSnackbar.open("已复制全部密文到剪贴板！");
  }

  function copySegment(text, index) {
    navigator.clipboard.writeText(text);
    M3eSnackbar.open(`片段 ${index} 已复制！`);
  }

  function clearInputText() {
    const el = document.querySelector("#MainTextInput");
    if (el) el.value = "";
    InputText.value = "";
  }

  return {
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
    INFILE,
    FILENAME,
    LastFileOutput,
    LastActionMode,
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
  };
}
