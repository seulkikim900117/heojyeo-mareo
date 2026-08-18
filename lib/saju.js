// ============================================================
// 사주팔자 계산 로직 (만세력)
// - 순수 함수만 사용 (서버/DB 필요 없음 → 프론트에서 바로 계산)
// - 절기(입춘 등)는 근사 공식 사용: 절기 당일(2/3~2/5 등) 출생은
//   드물게 1일 오차가 있을 수 있음 (엔터테인먼트 용도로 충분)
// ============================================================

export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
export const BRANCH_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

// 오행: 0목 1화 2토 3금 4수
export const ELEMENTS = ["목", "화", "토", "금", "수"];
export const ELEMENT_EMOJI = ["🌳", "🔥", "⛰️", "⚔️", "💧"];
const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 갑을목 병정화 무기토 경신금 임계수
const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 자수 축토 인목 묘목 진토 사화 오화 미토 신금 유금 술토 해수

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
// 절입일 = int(Y*0.2422 + C) - int((Y-1)/4), Y는 연도 끝 두 자리
// [월지 결정에 쓰는 12절기] 순서: 소한(1월) 입춘(2월) 경칩 청명 입하 망종 소서 입추 백로 한로 입동 대설
const TERM_C_20 = [6.11, 4.6295, 6.318, 5.59, 6.318, 6.5, 7.928, 8.35, 8.44, 9.098, 8.218, 7.9]; // 1901–2000
const TERM_C_21 = [5.4055, 3.87, 5.63, 4.81, 5.52, 5.678, 7.108, 7.5, 7.646, 8.318, 7.438, 7.18]; // 2001–2100

function solarTermDay(year, monthIndex0) {
    // monthIndex0: 0=1월(소한) ... 11=12월(대설). 해당 월의 절입 "일(day)"을 반환
  const C = year <= 2000 ? TERM_C_20[monthIndex0] : TERM_C_21[monthIndex0];
    const Y = year % 100;
    return Math.trunc(Y * 0.2422 + C) - Math.trunc((Y - 1) / 4);
}

// ---------- 사주 계산 ----------
export function calcSaju({ year, month, day, hour, minute = 0, unknownTime = false }) {
    // --- 일주: (JDN + 49) % 60  (검증: 2000-01-01 무오일, 1900-01-01 갑술일)
  // 야자시(23시~) 출생은 다음 날 일주 사용 (통용 방식)
  let dY = year, dM = month, dD = day;
    if (!unknownTime && hour === 23) {
          const t = new Date(Date.UTC(year, month - 1, day));
          t.setUTCDate(t.getUTCDate() + 1);
          dY = t.getUTCFullYear();
          dM = t.getUTCMonth() + 1;
          dD = t.getUTCDate();
    }
    const dayIdx = ((jdn(dY, dM, dD) + 49) % 60 + 60) % 60;
    const dayStem = dayIdx % 10;
    const dayBranch = dayIdx % 12;

  // --- 년주: 입춘 기준
  let sajuYear = year;
    const ipchun = solarTermDay(year, 1); // 2월 입춘일
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
    // 월간: 년간에 따라. 갑기년→병인월부터
  const monthOrder = (monthBranch - 2 + 12) % 12;
    const monthStem = ((yearStem % 5) * 2 + 2 + monthOrder) % 10;

  // --- 시주
  let hourStem = null, hourBranch = null;
    if (!unknownTime && hour !== null && hour !== undefined && hour !== "") {
          const h = Number(hour);
          hourBranch = Math.floor(((h + 1) % 24) / 2) % 12;
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
        dayMaster: dayStem, // 일간 (그 사람의 "본질")
        dayMasterElement: STEM_ELEMENT[dayStem],
        zodiac: BRANCH_ANIMALS[yearBranch],
  };
}

export function pillarText(p) {
    if (!p) return "?";
    return STEMS[p.stem] + BRANCHES[p.branch];
}

export { STEM_ELEMENT, BRANCH_ELEMENT };
