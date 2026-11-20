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
import { ref, onMounted, onUnmounted } from "vue";
import { getStep, timeUntilTotpExpiryFormatted } from "@/misc";
import { getSwVal } from "@/utils/cipherHelpers";

export const dilutionFilterOptions = [
  { value: "ALL", label: "全部" },
  { value: "ESSAY", label: "古文" },
  { value: "POEM", label: "古诗" },
  { value: "LYRIC", label: "宋词" }
];

export const dilutionPoemFilterOptions = [
  { value: "SEVEN", label: "七言" },
  { value: "FIVE", label: "五言" },
  { value: "FOUR", label: "四言" },
  { value: "ALL", label: "不限" }
];

export const dilutionSampleOptions = [
  { value: "SMART", label: "自适应" },
  { value: "RANDOM", label: "随机" }
];

export const dilutionDistributionOptions = [
  { value: "UNIFORM", label: "均匀分布" },
  { value: "CONCENTRATE", label: "集中分布" }
];

const insights = [
  "首次使用魔曰？在「话语」中写入你要隐藏的秘密，填入你的「密码」，点击「加密」即可体验文言文加密！"
];

export function useCipherConfig(getIoContext) {
  // ── State Trackers for v-if (Uncontrolled Components) ───────────────
  const ForcePian = ref(false);
  const ForceLogi = ref(false);
  const ForceNoMark = ref(false);
  const OutputTraditional = ref(false);
  const RandomnessVal = ref(50); // Continuous 0-100 (Standard Wenyan)
  const DilutionRandomnessVal = ref(0); // Continuous 0-100 (Dilution continuity jump rate)

  // ── Dilution State ──────────────────────────────────────────────────
  const UseDilution = ref(false);
  const DilutionTargetRatePct = ref(18); // 1 - 50 (%)
  const DilutionFilterMode = ref("ALL");
  const DilutionPoemFilterMode = ref("SEVEN");
  const DilutionPoemAutoLineBreak = ref(false);
  const DilutionSampleMode = ref("SMART");
  const DilutionStyleRandomIndex = ref(50); // 0 - 100
  const DilutionPayloadDistribution = ref("UNIFORM");

  // ── Advanced Security & Flexible Transfer ───────────────────────────
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

  // ── Insights ────────────────────────────────────────────────────────
  const currentInsight = ref(insights[0]);
  const showInsight = ref(true);

  let totpTimer = null;

  onMounted(() => {
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
  });

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
  function onChangeDilution(e) { UseDilution.value = getSwVal(e); }
  function onChangeDilutionPoemAutoBreak(e) { DilutionPoemAutoLineBreak.value = getSwVal(e); }

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
  function onDilutionRandomness(e) { DilutionRandomnessVal.value = Number(e.target.value); }
  function onTOTPStep(e) { TOTPTimeStepVal.value = Number(e.target.value); }
  function onDilutionTargetRate(e) { DilutionTargetRatePct.value = Number(e.target.value); }
  function onDilutionStyleRandom(e) { DilutionStyleRandomIndex.value = Number(e.target.value); }

  function updateInsight(actionType = "ENC") {
    const io = getIoContext ? getIoContext() : null;
    const keyVal = io?.KeyText?.value ?? "";
    const inputModeVal = io?.InputMode?.value ?? "TEXT";
    const inputTextVal = io?.InputText?.value ?? "";
    const inFileVal = io?.INFILE?.value ?? null;

    let pool = [];

    if (actionType === "ENC") {
      pool.push({ weight: 1, text: "首次使用魔曰？在「话语」中写入你要隐藏的秘密，填入你的「密码」，点击「加密」即可体验文言文加密！" });
      pool.push({ weight: 3, text: "魔曰生成的文言文遵循真实古籍中的句式结构，可有效防御特征识别攻击。" });

      if (keyVal === "ABRACADABRA" || keyVal === "") {
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

      const dataSize = inputModeVal === "UINT8" ? (inFileVal ? inFileVal.size : 0) : (inputTextVal ? new TextEncoder().encode(inputTextVal).length : 0);
      if (UseDilution.value) {
        pool.push({ weight: 12, text: "已启用「密文稀释」，目标载荷率越低，生成的古典文言文本越长，选句耗时也会相应增加。" });
        pool.push({ weight: 10, text: "启用「密文稀释」后，接收方解密无需同步任何稀释参数或语料库，直接输入密钥即可还原。" });
        pool.push({
          weight: DilutionTargetRatePct.value <= 10 ? 15 : 8,
          text: "低载荷率下各类文体皆可用于稀释。若希望句式变化更丰富、行文更具多样性，建议优先选用底本更庞大的「古文」文体。"
        });
        pool.push({
          weight: DilutionTargetRatePct.value > 10 ? 16 : 8,
          text: "设定较高目标载荷率时，更推荐将文体切换为「古诗」或「宋词」，紧凑的格律句式能更好贴合高载荷占比需求。"
        });
        pool.push({
          weight: 9,
          text: "稀释语料库规模庞大，选句结果偶有衔接不够自然之处。若对成文观感不满意，再次点击加密即可重新生成，也欢迎随时向开发者反馈。"
        });
      } else {
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
      }
    } else if (actionType === "DEC") {
      pool.push({ weight: 10, text: "解密时，绝大多数时候无需手动指定参数，魔曰会自动识别并适配加密时的所有配置。" });
      pool.push({ weight: 8, text: "如果解密时发生错误或显示乱码，请检查密码是否正确，以及输入是否完整。" });
    }

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

  return {
    ForcePian,
    ForceLogi,
    ForceNoMark,
    OutputTraditional,
    RandomnessVal,
    DilutionRandomnessVal,
    UseDilution,
    DilutionTargetRatePct,
    DilutionFilterMode,
    DilutionPoemFilterMode,
    DilutionPoemAutoLineBreak,
    DilutionSampleMode,
    DilutionStyleRandomIndex,
    DilutionPayloadDistribution,
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
    WenyanMin,
    WenyanMax,
    currentInsight,
    showInsight,
    updateInsight,
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
    onRandomness,
    onDilutionRandomness,
    onTOTPStep,
    onDilutionTargetRate,
    onDilutionStyleRandom
  };
}
