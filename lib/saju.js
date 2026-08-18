// ============================================================
// 사주팔자 계산 로직 (만세력)
// - 순수 함수만 사용 (서버/DB 필요 없음)
// - 절기(입춘 등)는 근사 공식 사용
// - 시주는 진태양시 보정(-30분) 적용: 한국 표준시(동경 135도)는
//   실제 태양시보다 약 30분 빠르므로 경계를 30분 미룸 (진시 07:30~09:29 등)
// ============================================================

export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
export const BRANCH_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

// 오행: 0목 1화 2토 3금 4수
export const ELEMENTS = ["목", "화", "토", "금", "수"];
export const ELEMENT_EMOJI = ["🌳", "🔥", "⛰️", "⚔️", "💧"];
const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

// 상생: 목→화→토→금→수→목 / 상극: 목→토→수→화→금→목
export const generates = (a, b) => (a + 1) % 5 === b;
export const controls = (a, b) => (a + 2) % 5 === b;

// ---------- 율리우스일 (그레고리력) ----------
function jdn(y, m, d) {
      const a = Math.floor((14 - m) / 12);
      const yy = y + 4800 - a;
      const mm = m + 12 * a - 3;
      return (
              d +
              Math.floor((153 * mm + 2) / 5) +
              365 * yy +
              Math.floor(yy / 4) -
              Math.floor(yy / 100) +
              Math.floor(yy / 400) -
              32045
            );
}

// ---------- 절기 근사 공식 ----------
const TERM_C_20 = [6.11, 4.6295, 6.318, 5.59, 6.318, 6.5, 7.928, 8.35, 8.44, 9.098, 8.218, 7.9]; // 1901-2000
const TERM_C_21 = [5.4055, 3.87, 5.63, 4.81, 5.52, 5.678, 7.108, 7.5, 7.646, 8.318, 7.438, 7.18]; // 2001-2100

function solarTermDay(year, monthIndex0) {
      const C = year <= 2000 ? TERM_C_20[monthIndex0] : TERM_C_21[monthIndex0];
      const Y = year % 100;
      return Math.trunc(Y * 0.2422 + C) - Math.trunc((Y - 1) / 4);
}

function shiftDay(y, m, d, delta) {
      const t = new Date(Date.UTC(y, m - 1, d));
      t.setUTCDate(t.getUTCDate() + delta);
      return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

// ---------- 사주 계산 ----------
export function calcSaju({ year, month, day, hour, minute = 0, unknownTime = false }) {
      // --- 진태양시 보정: 시계 시각에서 30분을 뺀 값으로 시주 경계 판정
  const hasTime = !unknownTime && hour !== null && hour !== undefined && hour !== "";
      let solarMin = null;
      let sY = year, sM = month, sD = day;
      if (hasTime) {
              solarMin = Number(hour) * 60 + Number(minute || 0) - 30;
              if (solarMin < 0) {
                        solarMin += 1440;
                        [sY, sM, sD] = shiftDay(year, month, day, -1);
              }
      }

  // --- 일주: (JDN + 49) % 60  (검증: 2000-01-01 무오일, 1900-01-01 갑술일)
  // 야자시: 태양시 23시 이후 출생은 다음 날 일주 사용 (통용 방식)
  let dY = sY, dM = sM, dD = sD;
      if (hasTime && solarMin >= 23 * 60) {
              [dY, dM, dD] = shiftDay(sY, sM, sD, 1);
      }
      const dayIdx = ((jdn(dY, dM, dD) + 49) % 60 + 60) % 60;
      const dayStem = dayIdx % 10;
      const dayBranch = dayIdx % 12;

  // --- 년주: 입춘 기준
  let sajuYear = year;
      const ipchun = solarTermDay(year, 1);
      if (month < 2 || (month === 2 && day < ipchun)) sajuYear = year - 1;
      const yearStem = ((sajuYear - 4) % 10 + 10) % 10;
      const yearBranch = ((sajuYear - 4) % 12 + 12) % 12;

  // --- 월주: 절기 기준 월지 결정
  let termMonth = month;
      const termDay = solarTermDay(year, month - 1);
      if (day < termDay) termMonth = month - 1;
      if (termMonth === 0) termMonth = 12;
      // 2월→인(2), 3월→묘(3) ... 11월→해(11), 12월→자(0), 1월→축(1)
  const monthBranch = termMonth === 12 ? 0 : termMonth === 1 ? 1 : termMonth;
      const monthOrder = (monthBranch - 2 + 12) % 12;
      const monthStem = ((yearStem % 5) * 2 + 2 + monthOrder) % 10;

  // --- 시주 (보정된 태양시 기준)
  let hourStem = null, hourBranch = null;
      if (hasTime) {
              hourBranch = Math.floor((solarMin / 60 + 1) / 2) % 12;
              hourStem = ((dayStem % 5) * 2 + hourBranch) % 10;
      }

  const pillars = {
          year: { stem: yearStem, branch: yearBranch },
          month: { stem: monthStem, branch: monthBranch },
          day: { stem: dayStem, branch: dayBranch },
          hour: hourStem === null ? null : { stem: hourStem, branch: hourBranch },
  };

  // --- 오행 분포 (천간+지지, 시주 없으면 6글자)
  const counts = [0, 0, 0, 0, 0];
      for (const key of ["year", "month", "day", "hour"]) {
              const p = pillars[key];
              if (!p) continue;
              counts[STEM_ELEMENT[p.stem]]++;
              counts[BRANCH_ELEMENT[p.branch]]++;
      }

  return {
          pillars,
          elements: counts,
          dayMaster: dayStem,
          dayMasterElement: STEM_ELEMENT[dayStem],
          zodiac: BRANCH_ANIMALS[yearBranch],
  };
}

export function pillarText(p) {
      if (!p) return "?";
      return STEMS[p.stem] + BRANCHES[p.branch];
}

export { STEM_ELEMENT, BRANCH_ELEMENT };
