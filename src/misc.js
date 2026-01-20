/**
 * 计算 TOTP 下一次过期的剩余时间并格式化输出（支持长时间到几个月/一年）
 *
 * @param {number} genEpoch - TOTP 生成时的 Unix 时间戳（毫秒）
 * @param {number} timestep - TOTP time step（单位：秒）
 * @param {number} [nowEpoch] - 可选：当前时间戳（毫秒）。不传则使用 Date.now()
 * @param {Object} [options] - 可选项：
 *    { boolean } options.compact - 若 true，输出更紧凑（如 "1y 2mo"），默认 true
 *    { number } options.maxUnits - 最多显示多少个较高阶单位（默认 3）
 *    { boolean } options.useExactMonths - 若 true，使用日历精确月/年差（更复杂），默认 false（使用近似：1mo=28d,1y=365d）
 * @returns {string|number} 格式化字符串或 0（已过期）
 */
export function timeUntilTotpExpiryFormatted(genEpoch, timestep, nowEpoch, options = {}) {
  if (typeof genEpoch !== "number" || typeof timestep !== "number" || timestep <= 0) {
    throw new TypeError("genEpoch 和 timestep 必须为数字，且 timestep > 0");
  }

  const opts = {
    compact: true,
    maxUnits: 3,
    useExactMonths: false,
    ...options
  };

  // normalize to seconds
  const genSec = genEpoch / 1000;
  const nowSec = typeof nowEpoch === "number" ? nowEpoch / 1000 : Math.floor(Date.now() / 1000);

  // 计算该 genSec 所在 counter 的下一次过期时间（单位：秒）
  const counter = Math.floor(genSec / timestep);
  const currentCounter = Math.floor(nowSec / timestep);
  const expiryAt = (counter + 1) * timestep;
  let remaining = expiryAt - nowSec;

  if (remaining <= 0) return 0;
  if (counter > currentCounter) return -1;

  // 如果用户要求基于日历的精确 month/year 计算，使用另一函数（在后面给出）
  if (opts.useExactMonths) {
    return formatUsingCalendarDifference(nowSec, expiryAt, opts);
  }

  // 近似拆分（1 year = 365d, 1 month = 30d）
  const SEC = 1;
  const MIN = 60;
  const HOUR = 3600;
  const DAY = 86400;
  const MONTH = 2419200;
  const YEAR = 31536000;

  const parts = {};

  parts.years = Math.floor(remaining / YEAR);
  remaining -= parts.years * YEAR;

  parts.months = Math.floor(remaining / MONTH);
  remaining -= parts.months * MONTH;

  parts.days = Math.floor(remaining / DAY);
  remaining -= parts.days * DAY;

  parts.hours = Math.floor(remaining / HOUR);
  remaining -= parts.hours * HOUR;

  parts.minutes = Math.floor(remaining / MIN);
  remaining -= parts.minutes * MIN;

  parts.seconds = remaining; // already integer

  // Build formatted string respecting maxUnits and compact option
  const unitsOrder = [
    ["year", "y"],
    ["months", "mo"],
    ["days", "d"],
    ["hours", "h"],
    ["minutes", "m"],
    ["seconds", "s"]
  ];

  // Decide how to display: if total < 1 day, show HH:MM:SS
  const totalSecRemaining =
    parts.years * YEAR +
    parts.months * MONTH +
    parts.days * DAY +
    parts.hours * HOUR +
    parts.minutes * MIN +
    parts.seconds;

  const pad2 = (n) => String(n).padStart(2, "0");

  if (totalSecRemaining < DAY) {
    // HH:MM:SS (hours may exceed 24 if days==0 but hours>24 shouldn't happen here)
    const HH = pad2(parts.hours);
    const MM = pad2(parts.minutes);
    const SS = pad2(parts.seconds);
    return `${HH}:${MM}:${SS}`;
  }

  // Otherwise prefer combined format, e.g. "1y 2mo 3d 04:05:06" or "5d 04:05:06"
  // Build higher-order units first
  const highParts = [];
  for (const [key, label] of unitsOrder.slice(0, 3)) {
    // years, months, days
    const v = parts[key];
    if (v && highParts.length < opts.maxUnits) {
      highParts.push(
        opts.compact
          ? `${v}${label}`
          : `${v} ${label.replace("mo", "months").replace("y", "years").replace("d", "days")}`
      );
    }
  }

  // Always include days if nothing else found and days>0
  if (highParts.length === 0 && parts.days > 0) {
    highParts.push(opts.compact ? `${parts.days}d` : `${parts.days} days`);
  }

  // append HH:MM:SS
  const hh = pad2(parts.hours);
  const mm = pad2(parts.minutes);
  const ss = pad2(parts.seconds);
  const timePart = `${hh}:${mm}:${ss}`;

  // join intelligently
  const separator = opts.compact ? " " : " ";
  const head = highParts.join(separator);
  return head ? `${head} ${timePart}` : timePart;
}

export function getStep(key) {
  let second = 0;
  /* v8 ignore next 50 */
  switch (key) {
    case 0:
      second = 180;
      break;
    case 1:
      second = 300;
      break;
    case 2:
      second = 600;
      break;
    case 3:
      second = 1800;
      break;
    case 4:
      second = 7200;
      break;
    case 5:
      second = 21600;
      break;
    case 6:
      second = 43200;
      break;
    case 7:
      second = 86400;
      break;
    case 8:
      second = 259200;
      break;
    case 9:
      second = 432000;
      break;
    case 10:
      second = 604800;
      break;
    case 11:
      second = 1814400;
      break;
    case 12:
      second = 2419200;
      break;
    case 13:
      second = 4838400;
      break;
    case 14:
      second = 14515200;
      break;
    case 15:
      second = 31557600;
      break;
  }
  return second;
}
