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
import { computed } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: ""
  },
  maxChars: {
    type: Number,
    default: 50000
  },
  mirrorTrailingNewline: {
    type: Boolean,
    default: false
  }
});

const PAYLOAD_CHARS = {
  N:
    "人镜鹏曲霞绸裳路岩叶鲤月雪冰局恋福铃琴家天韵书莺璃雨" +
    "文涧水花风棋楼鹤鸢灯雁星声树茶竹兰苗心语礼梦庭木驿火" +
    "森夏光林物云夜城春空雀鹂鸳",
  V:
    "关赴呈添停成走达行称见学听买作弹写定谈动旅返度开筑选" +
    "流指换探放看报事泊现迸彰需飞游求御航歌读振登任留奏连" +
    "知至致去画说进信取问笑视言",
  A:
    "莹畅新高静美绿佳善良瀚明早宏青遥速慧绚绮寒冷银灵绣北" +
    "临南俊捷骏益雅舒智谜彩余短秋乐怡瑞惠和纯悦迷长少近清" +
    "远极安聪秀旧浩盈快悠后轻坚",
  AD:
    "诚畅新高静恒愈谨善良频笃早湛昭遥速朗祗攸徐咸皆灵恭弥" +
    "临允公捷淳益雅舒嘉勤协永短歆乐怡已忻和谧悦稍长少近尚" +
    "远极安竟悉渐颇辄快悠后轻曾"
};

// OpenCC (cn -> hk) equivalents for characters in PAYLOAD_CHARS that differ in HK Traditional
const PAYLOAD_CHARS_TRAD_HK =
  "鏡鵬綢巖葉鯉戀鈴韻書鶯澗風樓鶴鳶燈聲樹蘭語禮夢驛雲鸝鴛" +
  "關達稱見學聽買彈寫談動開築選換報現飛遊讀連畫説進問視" +
  "瑩暢靜綠遙絢綺銀靈繡臨駿謎餘樂純長遠極聰舊後輕堅" +
  "誠恆謹頻篤鹹彌協謐漸頗輒";

const PAYLOAD_CHAR_SET = new Set([
  ...PAYLOAD_CHARS.N,
  ...PAYLOAD_CHARS.V,
  ...PAYLOAD_CHARS.A,
  ...PAYLOAD_CHARS.AD,
  ...PAYLOAD_CHARS_TRAD_HK
]);

const segments = computed(() => {
  const src = props.text || "";
  if (!src) return [];
  if (src.length > props.maxChars) {
    return [{ text: src, payload: false }];
  }

  const result = [];
  let buf = "";
  let bufIsPayload = null;

  for (const ch of src) {
    const isPayload = PAYLOAD_CHAR_SET.has(ch);
    if (bufIsPayload === null) {
      bufIsPayload = isPayload;
      buf = ch;
    } else if (isPayload === bufIsPayload) {
      buf += ch;
    } else {
      result.push({ text: buf, payload: bufIsPayload });
      bufIsPayload = isPayload;
      buf = ch;
    }
  }
  if (buf) {
    result.push({ text: buf, payload: bufIsPayload });
  }
  return result;
});
</script>

<template>
  <span class="payload-hl-root">
    <template v-for="(seg, idx) in segments" :key="idx">
      <span v-if="seg.payload" class="payload-hl-char">{{ seg.text }}</span>
      <template v-else>{{ seg.text }}</template>
    </template>
    <template v-if="mirrorTrailingNewline && text.endsWith('\n')">&#8203;</template>
  </span>
</template>

<style scoped>
.payload-hl-root {
  display: block;
  white-space: pre-wrap;
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 62%, transparent);
}

.payload-hl-char {
  color: var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 13%, transparent);
  border-radius: 3px;
}
</style>
