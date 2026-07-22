<script setup>
import { ref, onMounted, onUnmounted, inject, watch, nextTick } from "vue";
import { getStep, timeUntilTotpExpiryFormatted } from "@/misc";
import { Abracadabra } from "abracadabra-cn";
import { M3eSnackbar } from "@m3e/web/snackbar";

const CoreVersion = __CORE_VERSION__;
const BuildDate = __BUILD_DATE__;
const BuildHash = __BUILD_HASH__;
const isAndroidApp = __IS_ANDROID_APP__;
const isExtension = __IS_EXTENSION__;
// ── Theme ───────────────────────────────────────────────────────────
const themeColor = inject("themeColor");
const themeScheme = inject("themeScheme");
const setThemeColor = inject("setThemeColor");
const setThemeScheme = inject("setThemeScheme");

// ── I/O State ───────────────────────────────────────────────────────
const InputMode = ref("TEXT");
const OutputMode = ref("TEXT");
const InputText = ref("");
const KeyText = ref("");
const ShowPassword = ref(false);
const OutputText = ref("");
const OutputSegments = ref([]);
const IsMultiSegment = ref(false);
const ConfigStyle = ref(null);
const ErrorMessage = ref("");
const WarningMessage = ref("");
const InfoMessage = ref("");
const Loading = ref(false);

// ── File Drop State ─────────────────────────────────────────────────
const dropzoneActive = ref(false);
const INFILE = ref(null);
const FILENAME = ref("");

// ── State Trackers for v-if (Uncontrolled Components) ───────────────
const ForcePian = ref(false);
const ForceLogi = ref(false);
const ForceNoMark = ref(false);
const OutputTraditional = ref(false);
const RandomnessVal = ref(50); // Continuous 0-100

const AdvancedEnc = ref(false);
const UseStrongIV = ref(true);
const UseHMAC = ref(false);
const UsePBKDF2 = ref(false);
const UseTOTP = ref(false);
const TOTPTimeStepVal = ref(4);
const TOTPEpochVal = ref("");
const TOTPBasekeyVal = ref("");
const TOTPExpiryLabel = ref("");

const UseFlexible = ref(false);
const UseAONT = ref(true);
const MessageID = ref("");
const FlexibleMin = ref(20);
const FlexibleMax = ref(80);
const WenyanMin = ref(20);
const WenyanMax = ref(80);

// ── UI State ────────────────────────────────────────────────────────
const isMobile = ref(window.innerWidth <= 768);
const ConfigCollapsed = ref(isMobile.value); // Default open on desktop, closed on mobile
const EnableTooltips = ref(false); // Global toggle for tooltips
const ShowPWAButton = ref(false);
const LastFileOutput = ref(null);
const LastFileName = ref("");
let deferredPWAPrompt = null;
let totpTimer = null;

function getSwVal(e) {
  const t = e.currentTarget || e.target;
  return t.selected === true || t.checked === true;
}

function onChangePian(e) {
  ForcePian.value = getSwVal(e);
  if (ForcePian.value) {
    ForceLogi.value = false;
  }
}
function onChangeLogi(e) {
  ForceLogi.value = getSwVal(e);
  if (ForceLogi.value) {
    ForcePian.value = false;
  }
}
function onChangeNoMark(e) { ForceNoMark.value = getSwVal(e); }
function onChangeTraditional(e) { OutputTraditional.value = getSwVal(e); }

function onChangeAdv(e) {
  AdvancedEnc.value = getSwVal(e);
  if (!AdvancedEnc.value) {
    UsePBKDF2.value = false;
    UseHMAC.value = false;
    UseTOTP.value = false;
    // Note: Do not forcefully turn off Flexible Transfer here. They are separate.
  }
}

function onChangeStrongIV(e) { UseStrongIV.value = getSwVal(e); }
function onChangeHMAC(e) { UseHMAC.value = getSwVal(e); }
function onChangePBKDF2(e) {
  UsePBKDF2.value = getSwVal(e);
  if (!UsePBKDF2.value) {
    UseTOTP.value = false;
  }
}
function onChangeTOTP(e) { UseTOTP.value = getSwVal(e); }
function onChangeFlex(e) { UseFlexible.value = getSwVal(e); }
function onChangeAONT(e) { UseAONT.value = getSwVal(e); }

function onMessageIdInput(e) {
  let raw = e.target.value.trim();
  if (raw === "" || raw === "-") {
    MessageID.value = "";
    e.target.value = "";
    return;
  }
  let val = parseInt(raw, 10);
  if (isNaN(val) || val < 0) {
    MessageID.value = "";
    e.target.value = "";
  } else {
    if (val > 4095) val = 4095;
    MessageID.value = val;
    e.target.value = val;
  }
}

function onRandomness(e) { RandomnessVal.value = Number(e.target.value); }
function onTOTPStep(e) { TOTPTimeStepVal.value = Number(e.target.value); }



// 终极等待渲染完成的辅助函数
const waitForRender = () => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      // 此时处于即将进行下一次重绘的时刻
      // 用 setTimeout 把任务放到本次重绘之后的队列中
      setTimeout(resolve, 0);
    });
  });
};


// ── Insights ────────────────────────────────────────────────────────
const insights = [
  "首次使用魔曰？在「话语」中写入你要隐藏的秘密，填入你的「密码」，点击「加密」即可体验文言文加密！"
];
const currentInsight = ref(insights[0]);
const showInsight = ref(true); // Controls visibility during Enc/Dec
function updateInsight(actionType = 'ENC') {
  let pool = [];

  if (actionType === 'ENC') {
    // 基础提示 (权重较低，作为兜底)
    pool.push({ weight: 1, text: "首次使用魔曰？在「话语」中写入你要隐藏的秘密，填入你的「密码」，点击「加密」即可体验文言文加密！" });
    pool.push({ weight: 3, text: "魔曰生成的文言文遵循真实古籍中的句式结构，可有效防御特征识别攻击。" });

    if (KeyText.value === "ABRACADABRA" || KeyText.value === "") {
      if (AdvancedEnc.value) {
        pool.push({ weight: 40, text: "您正尝试使用默认密钥执行高级加密，这将导致高级加密失去意义。在使用高级加密时，强烈建议您使用一个足够复杂的加密密钥。" });
      } else {
        pool.push({ weight: 15, text: "您正使用默认密钥「ABRACADABRA」，这会严重损害加密的机密性。在重要场合，请务必设置高强度密钥。" });
      }
    }

    if (UseFlexible.value && AdvancedEnc.value && UsePBKDF2.value) {
      pool.push({ weight: 20, text: "同时开启「灵活分段传输」与「PBKDF2」时，会多次执行密钥衍生。这是计算密集的操作，可能导致页面无响应。" });
    }
    if (UsePBKDF2.value && AdvancedEnc.value) {
      pool.push({ weight: 20, text: "PBKDF2 是计算密集的操作，可能降低加解密速度并导致页面无响应。" });
    }



    if (AdvancedEnc.value && UseTOTP.value) {
      pool.push({ weight: 5, text: "基于时间的一次性密码(TOTP)可让密文具备时效性，但其并不是密文安全性的主要保证。" });
      pool.push({ weight: 5, text: "使用 TOTP 时，推荐在 Basekey 中填写当前网站的域名，此举可提高密文的安全性。" });
    }

    if (UseFlexible.value) {
      pool.push({ weight: 10, text: "灵活分段传输可把超长信息或文件切片成多个独立段落发送，接收方乱序收集后也能正确还原。" });
      if (UseAONT.value) {
        pool.push({ weight: 10, text: "开启全有或全无（AONT）后，所有密文分段深度纠缠。即便只缺失任意一个分段，也无法解出明文的任何局部。" });
      }
    }

    const dataSize = InputMode.value === "UINT8" ? (INFILE.value ? INFILE.value.size : 0) : (InputText.value ? new TextEncoder().encode(InputText.value).length : 0);
    if (dataSize > 40) {
      if (!ForcePian.value) {
        pool.push({ weight: 15, text: "密文过长？尝试打开「骈文对仗」开关，它能利用短促句式大幅压缩长度。" });
      }
      if (RandomnessVal.value > 20) {
        pool.push({ weight: 15, text: "生成的密文太长？您可以尝试调低「句式随机性」，以增加单句的载荷字数，从而缩减密文长度。" });
      }
    }

    pool.push({ weight: 3, text: "如果需要压缩密文长度，尝试打开「骈文对仗」开关。会优先使用四字六字成对的骈体句式，以缩短密文长度。" });
    pool.push({ weight: 3, text: "想要生成具有学术说理、议论论证风格的古文？尝试打开「逻辑判断」开关，密文将富含转折和因果推论句式。" });

  } else if (actionType === 'DEC') {
    pool.push({ weight: 10, text: "解密时，绝大多数时候无需手动指定参数，魔曰会自动识别并适配加密时的所有配置。" });
    pool.push({ weight: 8, text: "如果解密时发生错误或显示乱码，请检查密码是否正确，以及输入是否完整。" });
  }

  // 根据权重进行随机抽取
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of pool) {
    if (random < item.weight) {
      currentInsight.value = item.text;
      break;
    }
    random -= item.weight;
  }

  showInsight.value = true;
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
function fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(new Uint8Array(e.target.result));
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}
function normalizeToUint8Array(data) {
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
function uint8ArrayToFile(arr, fileName, mime) {
  const u8 = normalizeToUint8Array(arr);
  return new File([new Blob([u8], { type: mime })], fileName, { type: mime });
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
function getCookie(name) {
  for (const c of document.cookie.split(";")) {
    const t = c.trim();
    if (t.startsWith(name + "=")) return t.substring(name.length + 1);
  }
  return "";
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
  updateInsight('ENC');
  const dataSize = InputMode.value === "UINT8" ? (INFILE.value ? INFILE.value.size : 0) : (InputText.value ? new TextEncoder().encode(InputText.value).length : 0);
  let isHeavyEnc = false;
  if (UseFlexible.value && AdvancedEnc.value && UsePBKDF2.value) {
    isHeavyEnc = dataSize > 5 * 1024;
  } else {
    isHeavyEnc = dataSize > 10 * 1024;
  }

  if (isHeavyEnc) {
    await waitForRender();
    if (UseFlexible.value && AdvancedEnc.value && UsePBKDF2.value) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  OutputText.value = "";
  IsMultiSegment.value = false;
  OutputSegments.value = [];
  LastFileOutput.value = null;
  LastFileName.value = "";
  try {
    const Abra = new Abracadabra(InputMode.value, OutputMode.value);
    const inputData = InputMode.value === "TEXT" ? InputText.value : await fileToUint8Array(INFILE.value);

    if (dataSize > 10 * 1024) {
      InfoMessage.value = "您正在执行密集计算。此过程可能需要一些时间并伴随页面卡顿或无响应，这是正常的计算过程，请耐心等待。";
      await new Promise(r => setTimeout(r, 300));
      await waitForRender();
      await waitForRender();
    }

    if (dataSize > 3 * 1024 && UseFlexible.value && UsePBKDF2.value && AdvancedEnc.value) {
      InfoMessage.value = "您正在执行密集计算。此过程可能需要一些时间并伴随页面卡顿或无响应，这是正常的计算过程，请耐心等待。";
      await new Promise(r => setTimeout(r, 300));
      await waitForRender();
      await waitForRender();
    }

    if (key === "ABRACADABRA") {
      if (AdvancedEnc.value && getCookie("AdvancedEncWeakPasswordIgnore") !== "true") {
        const d = document.getElementById("WeakPasswordDialog");
        if (d.show) d.show(); else d.open = true;
        WarningMessage.value = "正在使用默认密钥，这严重损害了加密安全性。";
      } else {
        WarningMessage.value = "正在使用默认密钥，这严重损害了加密安全性。";
      }
    }

    const configStyle = {
      PunctuationMark: !ForceNoMark.value,
      RandomIndex: RandomnessVal.value,
      PianwenMode: ForcePian.value,
      LogicMode: ForceLogi.value,
      Traditional: OutputTraditional.value,
      RandomParagraphing: [Number(WenyanMin.value), Math.max(Number(WenyanMin.value), Number(WenyanMax.value))]
    };

    const configAdv = {
      Enable: AdvancedEnc.value,
      UseStrongIV: UseStrongIV.value,
      UseHMAC: UseHMAC.value,
      UsePBKDF2: UsePBKDF2.value,
      UseTOTP: UseTOTP.value,
      TOTPTimeStep: Number(UseTOTP.value ? TOTPTimeStepVal.value : 4),
      TOTPBaseKey: UseTOTP.value ? (TOTPBasekeyVal.value || key) : undefined,
      TOTPEpoch: UseTOTP.value
        ? (TOTPEpochVal.value === "" ? Date.now() : Number(TOTPEpochVal.value))
        : undefined,
      FlexibleTransfer: {
        Enable: UseFlexible.value,
        UseAONT: UseAONT.value,
        MessageID: MessageID.value === "" ? -1 : Number(MessageID.value),
        RandomParagraphing: [Number(FlexibleMin.value), Math.max(Number(FlexibleMin.value), Number(FlexibleMax.value))]
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
    } else {
      const ts = new Date().toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);
      const fn = FILENAME.value ? `enc_${ts}_${FILENAME.value}.txt` : `Abracadabra_Enc_${ts}.txt`;
      LastFileOutput.value = raw;
      LastFileName.value = fn;
      downloadFile(fn, "application/octet-stream", raw);
      OutputText.value = "文件加密处理已完成，正在自动下载。您也可以点击下方按钮重新下载。";
    }
  } catch (err) {
    ErrorMessage.value = err.toString();
  } finally {
    Loading.value = false;
  }
}

// ── Decrypt Logic ───────────────────────────────────────────────────
async function ProcessDecNext() {
  if (Loading.value) return;
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
  updateInsight('DEC');
  const dataSize = InputMode.value === "UINT8" ? (INFILE.value ? INFILE.value.size : 0) : (InputText.value ? new TextEncoder().encode(InputText.value).length : 0);
  const isHeavyDec = dataSize > 10 * 1024;

  if (isHeavyDec) {
    await waitForRender();
    await waitForRender();
  }

  OutputText.value = "";
  IsMultiSegment.value = false;
  OutputSegments.value = [];
  LastFileOutput.value = null;
  LastFileName.value = "";
  try {
    const Abra = new Abracadabra(InputMode.value, OutputMode.value);

    if (InputMode.value === "TEXT" && InputText.value.startsWith("呋")) {
      try {
        Abra.BearDecode(InputText.value);
        OutputText.value = Abra.Output();
        WarningMessage.value = "识别并解密了「与熊论道」密文，此加密方法无法保护信息安全，不应继续使用。";
        return;
      } catch (err) { /* ignore */ }
    }

    const inputData = InputMode.value === "TEXT" ? InputText.value : await fileToUint8Array(INFILE.value);

    if (dataSize > 3 * 1024) {
      InfoMessage.value = "您正在执行密集计算。此过程可能需要一些时间并伴随页面卡顿或无响应，这是正常的计算过程，请耐心等待。";
      await new Promise(r => setTimeout(r, 500));
      await waitForRender();
      await waitForRender();
    }

    const configAdv = AdvancedEnc.value ? {
      TOTPBaseKey: UseTOTP.value ? (TOTPBasekeyVal.value || key) : undefined,
      TOTPEpoch: UseTOTP.value ? (TOTPEpochVal.value === "" ? Date.now() : Number(TOTPEpochVal.value)) : Date.now()
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
      } catch (oldErr) {
        throw new Error("解密失败，密文损坏或密码错误：" + err.toString());
      }
    }

    if (decryptSuccess) {
      let raw = Abra.Output();
      if (raw.ErrorObj) {
        ErrorMessage.value = "至少一段密文的解密出现错误：" + raw.ErrorObj.toString();
      }
      if (OutputMode.value === "TEXT") {
        const isBinStr = (str) => typeof str === "string" && (str.includes('\uFFFD') || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str));
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
          } catch (e) {
            try {
              processedRaw = new TextDecoder("gbk", { fatal: true }).decode(u8);
              if (isBinStr(processedRaw)) hasBinary = true;
            } catch (e2) {
              processedRaw = new TextDecoder("utf-8").decode(u8);
              hasBinary = true;
            }
          }
        } else if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
          processedRaw = raw.map(str => {
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
      } else {
        const ts = new Date().toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);
        let baseFn = FILENAME.value ? FILENAME.value : `Abracadabra_Result`;
        if (baseFn.endsWith('.txt')) baseFn = baseFn.substring(0, baseFn.length - 4);
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

function closeWeakPassword() {
  const d = document.getElementById("WeakPasswordDialog");
  if (d.hide) d.hide(); else d.open = false;
}
function ignoreWeakPassword() { document.cookie = "AdvancedEncWeakPasswordIgnore=true"; closeWeakPassword(); }

function showAboutDialog() {
  const d = document.getElementById("AboutDialog");
  if (d.show) d.show(); else d.open = true;
}
function closeAboutDialog() {
  const d = document.getElementById("AboutDialog");
  if (d.hide) d.hide(); else d.open = false;
}
function showLicenseDialog() {
  closeAboutDialog();
  const d = document.getElementById("LicenseDialog");
  if (d.show) d.show(); else d.open = true;
}
function closeLicenseDialog() {
  const d = document.getElementById("LicenseDialog");
  if (d.hide) d.hide(); else d.open = false;
  showAboutDialog();
}
function openRepo() {
  window.open("https://github.com/SheepChef/Abracadabra", "_blank");
}

// ── Color Swatches ──────────────────────────────────────────────────
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
function changeColor(hex) { setThemeColor(hex); }
function toggleScheme() { setThemeScheme(themeScheme.value === "dark" ? "light" : "dark"); }

// ── Formatting ──────────────────────────────────────────────────────
function getRandomnessLabel(v) {
  if (v < 10) return "长句优先";
  if (v < 35) return "稍随机";
  if (v < 65) return "适中";
  if (v < 90) return "较随机";
  return "完全随机";
}
function getStepLabel(v) {
  return ["3分钟", "5分钟", "10分钟", "30分钟", "2小时", "6小时", "12小时",
    "1天", "3天", "5天", "1周", "3周", "1个月", "2个月", "6个月", "1年"][v] ?? "";
}

// ── PWA ─────────────────────────────────────────────────────────────
const isPWA = () => {
  const displayModes = ["fullscreen", "standalone", "minimal-ui"];
  const matchesPwa = displayModes.some(
    (displayMode) => window.matchMedia("(display-mode: " + displayMode + ")").matches
  );
  return matchesPwa || window.navigator?.standalone || document.referrer.includes("android-app://");
};
function InstallPWA() {
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

onMounted(() => {

  // Hack to fix m3e-slider touch-action: none blocking vertical scroll on mobile
  document.querySelectorAll('m3e-slider').forEach(slider => {
    if (slider.shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
            .base, .track, .track-inactive, .track-active, .ticks, .tick, .touch, .handle {
              touch-action: pan-y !important;
            }
          `;
      slider.shadowRoot.appendChild(style);
    }
  });

  //如果在插件环境下，那么强行注入插件的类名，以变更页面样式。
  if (isExtension) {
    document.body.classList.add('crx-popup');
    ConfigCollapsed.value = false;
  }

  //Resize事件，用于在窄屏下将配置面板设为可折叠。在宽屏模式下自动展开。
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

  totpTimer = setInterval(() => {
    if (!AdvancedEnc.value || !UseTOTP.value) return;
    try {
      const epoch = TOTPEpochVal.value === "" ? Date.now() : Number(TOTPEpochVal.value);
      const step = getStep(Number(TOTPTimeStepVal.value));
      const text = timeUntilTotpExpiryFormatted(epoch, step);
      if (text == "0") TOTPExpiryLabel.value = "已过期";
      else if (text == "-1") TOTPExpiryLabel.value = "尚未生效";
      else TOTPExpiryLabel.value = `有效期 ${text}`;
    } catch { /* ignore */ }
  }, 10);
});
onUnmounted(() => {
  clearInterval(totpTimer);
  window.removeEventListener("resize", handleResize);
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
      <!-- ╔══════════════════════════════════════════════════
           ║  LEFT — Configuration Panel
           ╚══════════════════════════════════════════════════ -->
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
                          <span id="lblUseAONT">全有或全无 (AONT)</span>
                          <m3e-switch id="swUseAONT" :checked="UseAONT ? true : undefined" @change="onChangeAONT"
                            icons="both"></m3e-switch>
                          <m3e-rich-tooltip v-if="EnableTooltips" for="lblUseAONT" hide-delay="200">
                            <span slot="subhead" style="font-weight: bold;">全有或全无 (AONT)</span>
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

      <!-- ╔══════════════════════════════════════════════════
           ║  MIDDLE — Main Cipher Panel
           ╚══════════════════════════════════════════════════ -->
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
                <textarea placeholder="你想吟唱的话语" autocomplete="off" type="text" :value="InputText"
                  @input="InputText = $event.target.value" rows="4"></textarea>
              </m3e-form-field>
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
                <input placeholder="将一切雪藏的密钥" autocomplete="off" :type="ShowPassword ? 'text' : 'password'"
                  :value="KeyText" @input="KeyText = $event.target.value" />
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

            <!-- Randomness Slider (Continuous, no discrete) -->
            <div class="slider-row" style="margin-top:16px; margin-bottom:16px;">
              <div class="slider-label-row">
                <span style="font-weight:600;font-size:0.9rem;">句式随机性</span>
                <span>{{ getRandomnessLabel(RandomnessVal) }} ({{ RandomnessVal }})</span>
              </div>
              <m3e-slider labelled :min="0" :max="100" style="width:100%;">
                <m3e-slider-thumb id="slRandomness" :value="50" @input="onRandomness"></m3e-slider-thumb>
              </m3e-slider>
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
                        <div class="segment-content">{{ segment }}</div>
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
                      <textarea placeholder="回路末端的符文" type="text" :value="OutputText" readonly rows="6"></textarea>
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

      <!-- ╔══════════════════════════════════════════════════
           ║  RIGHT — Info, Theme & Insights
           ╚══════════════════════════════════════════════════ -->
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
              <p style="margin:4px 0 0;font-size:0.875rem;opacity:0.8;">将魔曰安装到本地</p>
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
    </div>

    <!-- ╔══════════════════════════════════════════════════
         ║  FOOTER — Copyright & Easter Egg Trigger
         ╚══════════════════════════════════════════════════ -->
    <footer class="app-footer">
      <div>中国制造 • AIPL-1.1许可</div>
      <div>Copyright &copy; 2025-{{ new Date().getFullYear() }} <a href="https://shef.cc" target="_blank"
          rel="noopener noreferrer" style="color:var(--md-sys-color-on-surface);">SheepChef</a></div>
    </footer>

    <!-- Dialogs -->
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

    <m3e-dialog id="AboutDialog">
      <div slot="header"
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px; margin-bottom: 8px;">
        <m3e-icon name="code_xml" style="font-size: 55px; color: var(--md-sys-color-primary);"></m3e-icon>
        <span style="font-size: 24px;">关于魔曰</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <m3e-list variant="segmented"
          style="border-radius: 12px; background: var(--md-sys-color-surface-container-low); overflow: hidden;">
          <m3e-list-item>
            <m3e-icon slot="leading" name="memory"></m3e-icon>
            核心版本
            <span slot="supporting-text">V{{ CoreVersion }}</span>
          </m3e-list-item>
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
            <span slot="supporting-text">AIPL-1.1</span>
          </m3e-list-item>
        </m3e-list>

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
              一名追求优雅代码实现的独立开发者。喜欢把偶尔的心血来潮，变成实用又趁手的小工具。
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
            <span slot="supporting-text">©SheepChef | AIPL-1.1</span>
            <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
          </m3e-list-action>
          <m3e-list-action href="https://github.com/SheepChef/Abracadabra_nodedemo" target="_blank"
            rel="noopener noreferrer">
            abracadabra-demo
            <span slot="supporting-text">©SheepChef | AIPL-1.1</span>
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
          <m3e-list-action href="https://github.com/brix/crypto-js" target="_blank" rel="noopener noreferrer">
            crypto-js
            <span slot="supporting-text">©Jeff Mott&Evan Vosberg | MIT</span>
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
          <m3e-list-action href="https://github.com/paulmillr/noble-hashes" target="_blank" rel="noopener noreferrer">
            noble-hashes
            <span slot="supporting-text">©Paul Miller | MIT</span>
            <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
          </m3e-list-action>
        </m3e-action-list>
      </div>
      <div slot="actions" end>
        <m3e-button variant="tonal" @click="closeLicenseDialog">返回</m3e-button>
      </div>
    </m3e-dialog>

  </div>
</template>
