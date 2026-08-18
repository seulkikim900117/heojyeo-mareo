// ============================================================
// 사주 엔진 v2 — 순수 함수, 외부 의존성 없음
// saju()        : 한 사람의 사주팔자 + 십성/오행/관계/공망/대운/심리
// compatibility(): 두 사람 궁합 점수 + 근거
// 절기는 태양황경(Meeus 근사)으로 계산 — 월주/년주 경계가 정확
// 시주는 진태양시(경도보정 + 균시차) 적용
// ============================================================

export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const STEMS_CN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
export const BRANCHES_CN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const BRANCH_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
export const ELEMENTS = ["목", "화", "토", "금", "수"];
export const ELEMENT_EMOJI = ["🌳", "🔥", "⛰️", "⚔️", "💧"];

export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const STEM_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const BRANCH_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

// 지장간: [천간index, 일수]  마지막 원소가 본기
const HIDDEN = [
[[8, 10], [9, 20]],
[[9, 9], [7, 3], [5, 18]],
[[4, 7], [2, 7], [0, 16]],
[[0, 10], [1, 20]],
[[1, 9], [9, 3], [4, 18]],
[[4, 7], [6, 7], [2, 16]],
[[2, 10], [5, 9], [3, 11]],
[[3, 9], [1, 3], [5, 18]],
[[4, 7], [8, 7], [6, 16]],
[[6, 10], [7, 20]],
[[7, 9], [3, 3], [4, 18]],
[[4, 7], [0, 7], [8, 16]],
];

function josa(w, withBatchim, without) {
const c = w.charCodeAt(w.length - 1);
const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : true;
return w + (has ? withBatchim : without);
}

export const generates = (a, b) => (a + 1) % 5 === b;
export const controls = (a, b) => (a + 2) % 5 === b;

const DEG = Math.PI / 180;

// ---------- 달력 ----------
function jdn(y, m, d) {
const a = Math.floor((14 - m) / 12);
const yy = y + 4800 - a;
const mm = m + 12 * a - 3;
return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function fromJDN(j) {
let a = j + 32044;
let b = Math.floor((4 * a + 3) / 146097);
let c = a - Math.floor(146097 * b / 4);
let dd = Math.floor((4 * c + 3) / 1461);
let e = c - Math.floor(1461 * dd / 4);
let mm = Math.floor((5 * e + 2) / 153);
return {
day: e - Math.floor((153 * mm + 2) / 5) + 1,
month: mm + 3 - 12 * Math.floor(mm / 10),
year: 100 * b + dd - 4800 + Math.floor(mm / 10),
};
}

// ---------- 태양 황경 (도) ----------
function solarLongitude(jd) {
const T = (jd - 2451545.0) / 36525;
const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
const om = (125.04 - 1934.136 * T) * DEG;
const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om);
return ((lam % 360) + 360) % 360;
}

// ---------- 균시차 (분) ----------
function equationOfTime(jd) {
const T = (jd - 2451545.0) / 36525;
const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
const eps = (23.439291 - 0.0130042 * T) * DEG;
const yy = Math.tan(eps / 2) * Math.tan(eps / 2);
const L0r = L0 * DEG;
const E = yy * Math.sin(2 * L0r) - 2 * e * Math.sin(M) + 4 * e * yy * Math.sin(M) * Math.cos(2 * L0r) - 0.5 * yy * yy * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * M);
return (E / DEG) * 4;
}

// 목표 황경에 도달하는 JD를 birth 근처에서 찾기
function findTermJD(seedJD, targetDeg) {
let est = seedJD;
for (let i = 0; i < 24; i++) {
const diff = ((solarLongitude(est) - targetDeg + 540) % 360) - 180;
est -= diff / 0.9856;
}
return est;
}

// ---------- 십성 ----------
const TEN_GODS = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
const TEN_GROUP = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };

export function tenGod(dayStem, target) {
const de = STEM_ELEMENT[dayStem];
const te = STEM_ELEMENT[target];
const same = STEM_YANG[dayStem] === STEM_YANG[target];
if (te === de) return same ? "비견" : "겁재";
if (generates(de, te)) return same ? "식신" : "상관";
if (controls(de, te)) return same ? "편재" : "정재";
if (controls(te, de)) return same ? "편관" : "정관";
return same ? "편인" : "정인";
}

// ---------- 지지 관계표 ----------
const SIX_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const TRIADS = [[8, 0, 4, 4], [11, 3, 7, 0], [2, 6, 10, 1], [5, 9, 1, 3]];
const PUNISH3 = [[2, 5, 8], [1, 10, 7]];
const SELF_PUNISH = [4, 6, 9, 11];

const isSixHarmony = (a, b) => SIX_HARMONY.some((p) => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
const triadOf = (a, b) => TRIADS.find((t) => t.slice(0, 3).includes(a) && t.slice(0, 3).includes(b) && a !== b);
const isClash = (a, b) => (a - b + 12) % 12 === 6;
const PO = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]];
const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
const pairHas = (arr, a, b) => arr.some((p) => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
const isPo = (a, b) => pairHas(PO, a, b);
const isWonjin = (a, b) => pairHas(WONJIN, a, b);
const isPunish = (a, b) => PUNISH3.some((t) => t.includes(a) && t.includes(b) && a !== b) || (a === 0 && b === 3) || (a === 3 && b === 0) || (a === b && SELF_PUNISH.includes(a));

// ============================================================
// 메인: saju()
// ============================================================
export function saju(opts) {
const year = +opts.year;
const month = +opts.month;
const day = +opts.day;
const gender = opts.gender === "M" ? "M" : opts.gender === "F" ? "F" : null;
const name = opts.name || null;
const longitude = opts.longitude == null ? 127.5 : +opts.longitude;
const timezone = opts.timezone == null ? 9 : +opts.timezone;
const nightZi = opts.nightZi !== false;
const hasHour = opts.hour !== undefined && opts.hour !== null && opts.hour !== "";
const hour = hasHour ? +opts.hour : 12;
const minute = opts.minute == null || opts.minute === "" ? 0 : +opts.minute;

const baseJDN = jdn(year, month, day);
const jdUT = baseJDN - 0.5 + (hour + minute / 60 - timezone) / 24;

// --- 년주 / 월주 (절기 기준) ---
const lam = solarLongitude(jdUT);
const sajuYear = lam >= 285 && lam < 315 ? year - 1 : year;
const yIdx = ((sajuYear - 4) % 60 + 60) % 60;
const yearStem = yIdx % 10;
const yearBranch = yIdx % 12;

const monthSlot = Math.floor((((lam - 315) % 360) + 360) % 360 / 30); // 0 = 인월
const monthBranch = (2 + monthSlot) % 12;
const monthStem = ((yearStem % 5) * 2 + 2 + monthSlot) % 10;

// --- 진태양시 ---
const eot = equationOfTime(jdUT);
const lonCorr = (longitude - timezone * 15) * 4;
let tm = hour * 60 + minute + lonCorr + eot;
let dayShift = 0;
while (tm < 0) { tm += 1440; dayShift -= 1; }
while (tm >= 1440) { tm -= 1440; dayShift += 1; }

// --- 일주 ---
let dJDN = baseJDN + dayShift;
if (hasHour && nightZi && tm >= 1380) dJDN += 1;
const dIdx = ((dJDN + 49) % 60 + 60) % 60;
const dayStem = dIdx % 10;
const dayBranch = dIdx % 12;

// --- 시주 ---
let hourStem = null;
let hourBranch = null;
if (hasHour) {
hourBranch = Math.floor(((Math.floor(tm / 60) + 1) % 24) / 2);
hourStem = ((dayStem % 5) * 2 + hourBranch) % 10;
}

const mk = (s, b) => (s == null || b == null ? null : {
stem: STEMS[s], branch: BRANCHES[b], stemIdx: s, branchIdx: b,
name: STEMS[s] + BRANCHES[b], nameCn: STEMS_CN[s] + BRANCHES_CN[b],
element: ELEMENTS[STEM_ELEMENT[s]], elementIdx: STEM_ELEMENT[s],
branchElement: ELEMENTS[BRANCH_ELEMENT[b]], branchElementIdx: BRANCH_ELEMENT[b],
hidden: HIDDEN[b].map((h) => STEMS[h[0]]),
hiddenIdx: HIDDEN[b].map((h) => h[0]),
tenGod: tenGod(dayStem, s),
});

const pillars = {
year: mk(yearStem, yearBranch),
month: mk(monthStem, monthBranch),
day: mk(dayStem, dayBranch),
hour: mk(hourStem, hourBranch),
};

const list = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);

// --- 십성 집계 ---
const count = {};
TEN_GODS.forEach((g) => (count[g] = 0));
const detail = [];
list.forEach((p, i) => {
const label = ["년", "월", "일", "시"][i];
if (i !== 2) { count[p.tenGod] += 1; detail.push({ pos: label + "간", stem: p.stem, god: p.tenGod }); }
p.hiddenIdx.forEach((hs, k) => {
const g = tenGod(dayStem, hs);
const w = k === p.hiddenIdx.length - 1 ? 1 : 0.4;
count[g] += w;
if (k === p.hiddenIdx.length - 1) detail.push({ pos: label + "지", stem: STEMS[hs], god: g });
});
});
const group = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
Object.keys(count).forEach((g) => (group[TEN_GROUP[g]] += count[g]));
const sortedGods = Object.keys(count).filter((g) => count[g] > 0).sort((a, b) => count[b] - count[a]);
const dominant = sortedGods[0] || null;
const absent = TEN_GODS.filter((g) => count[g] === 0);

// --- 오행 ---
const raw = [0, 0, 0, 0, 0];
list.forEach((p) => {
raw[STEM_ELEMENT[p.stemIdx]] += 1;
p.hiddenIdx.forEach((hs, k) => { raw[STEM_ELEMENT[hs]] += k === p.hiddenIdx.length - 1 ? 1 : 0.35; });
});
const count5 = [0, 0, 0, 0, 0];
list.forEach((p) => { count5[STEM_ELEMENT[p.stemIdx]] += 1; count5[BRANCH_ELEMENT[p.branchIdx]] += 1; });
const total = raw.reduce((a, b) => a + b, 0) || 1;
const percent = {};
ELEMENTS.forEach((e, i) => (percent[e] = Math.round((raw[i] / total) * 1000) / 10));
const strongestIdx = raw.indexOf(Math.max.apply(null, raw));
const missing = ELEMENTS.filter((e, i) => raw[i] < total * 0.06);
// 신강/신약: 득령(월지) > 득지(일지) > 득세(나머지) 가중
const supportsMe = (st) => { const g = tenGod(dayStem, st); return g === "비견" || g === "겁재" || g === "편인" || g === "정인" ? 1 : 0; };
const branchSupport = (bi) => {
const h = HIDDEN[bi];
const tot = h.reduce((s2, x) => s2 + x[1], 0);
return h.reduce((s2, x) => s2 + x[1] * supportsMe(x[0]), 0) / tot;
};
const otherStems = [yearStem, monthStem].concat(hourStem == null ? [] : [hourStem]);
const stemSupport = otherStems.reduce((s2, st) => s2 + supportsMe(st), 0) / otherStems.length;
const otherBranches = [yearBranch].concat(hourBranch == null ? [] : [hourBranch]);
const otherBranchSupport = otherBranches.reduce((s2, bi) => s2 + branchSupport(bi), 0) / otherBranches.length;
const supportRatio = Math.round((branchSupport(monthBranch) * 0.4 + branchSupport(dayBranch) * 0.18 + otherBranchSupport * 0.17 + stemSupport * 0.25) * 100) / 100;
const strength = supportRatio >= 0.46 ? "신강" : supportRatio >= 0.28 ? "중화" : "신약";

// --- 관계 ---
const branches = list.map((p) => p.branchIdx);
const stems = list.map((p) => p.stemIdx);
const posName = ["년", "월", "일", "시"];
const rel = { 천간합: [], 육합: [], 삼합: [], 충: [], 형: [] };
for (let i = 0; i < stems.length; i++) {
for (let j = i + 1; j < stems.length; j++) {
if ((stems[i] - stems[j] + 10) % 10 === 5) rel.천간합.push(posName[i] + posName[j] + " " + STEMS[stems[i]] + STEMS[stems[j]] + "합");
}
}
for (let i = 0; i < branches.length; i++) {
for (let j = i + 1; j < branches.length; j++) {
const a = branches[i], b = branches[j];
const tag = posName[i] + posName[j] + " " + BRANCHES[a] + BRANCHES[b];
if (isSixHarmony(a, b)) rel.육합.push(tag + "합");
const t = triadOf(a, b);
if (t) rel.삼합.push(tag + " " + ELEMENTS[t[3]] + "국");
if (isClash(a, b)) rel.충.push(tag + "충");
if (isPunish(a, b)) rel.형.push(tag + "형");
}
}

// --- 공망 ---
const xunHead = dIdx - (dIdx % 10);
const gongmang = [BRANCHES[(xunHead % 12 + 10) % 12], BRANCHES[(xunHead % 12 + 11) % 12]];

// --- 대운 ---
const forward = (STEM_YANG[yearStem] === 1) === (gender === "M");
const curTermDeg = (315 + 30 * monthSlot) % 360;
const nextTermDeg = (315 + 30 * (monthSlot + 1)) % 360;
const targetDeg = forward ? nextTermDeg : curTermDeg;
const termJD = findTermJD(jdUT + (forward ? 15 : -15), targetDeg);
const daysDiff = Math.abs(termJD - jdUT);
const startAge = Math.max(0.3, Math.round((daysDiff / 3) * 10) / 10);
const daeunList = [];
for (let i = 1; i <= 9; i++) {
const s = ((monthStem + (forward ? i : -i)) % 10 + 10) % 10;
const b = ((monthBranch + (forward ? i : -i)) % 12 + 12) % 12;
daeunList.push({
age: Math.floor(startAge + (i - 1) * 10),
name: STEMS[s] + BRANCHES[b],
stem: STEMS[s], branch: BRANCHES[b],
tenGod: tenGod(dayStem, s),
element: ELEMENTS[STEM_ELEMENT[s]],
});
}
const daeun = { direction: forward ? "순행" : "역행", startAge: startAge, list: daeunList };

// --- 심리 ---
const psychology = buildPsychology(dayStem, dayBranch, strength, dominant, group, missing, ELEMENTS[strongestIdx]);

const result = {
name: name,
input: { year: year, month: month, day: day, hour: hasHour ? hour : null, minute: minute, gender: gender, longitude: longitude, timezone: timezone },
hasHour: hasHour,
solarTime: { trueSolarMinutes: Math.round(tm), lonCorrection: Math.round(lonCorr * 10) / 10, equationOfTime: Math.round(eot * 10) / 10 },
sajuYear: sajuYear,
zodiac: BRANCH_ANIMALS[yearBranch],
pillars: pillars,
dayMaster: { stem: STEMS[dayStem], element: ELEMENTS[STEM_ELEMENT[dayStem]], yang: STEM_YANG[dayStem] === 1 },
tenGods: { count: count, detail: detail, group: group, dominant: dominant, absent: absent },
elements: { raw: raw, count: count5, percent: percent, strongest: ELEMENTS[strongestIdx], strongestIdx: strongestIdx, missing: missing, strength: strength, supportRatio: supportRatio },
relations: rel,
gongmang: { branches: gongmang },
daeun: daeun,
psychology: psychology,
};
result.text = renderText(result);
return result;
}

// ============================================================
function buildPsychology(dayStem, dayBranch, strength, dominant, group, missing, strongest) {
const el = ELEMENTS[STEM_ELEMENT[dayStem]];
const yang = STEM_YANG[dayStem] === 1;
const core = {
목: yang ? "곧게 뻗는 나무처럼 방향이 분명하고 한번 정하면 밀고 나가는 성향" : "덩굴처럼 유연하게 감고 올라가 어떤 환경에도 적응하는 성향",
화: yang ? "태양처럼 드러내고 비추는, 숨기지 못하는 직진형" : "촛불처럼 은근히 오래 타는, 가까운 사람에게만 뜨거운 성향",
토: yang ? "산처럼 묵직해 잘 흔들리지 않고 남이 기대게 되는 성향" : "밭처럼 품이 넓어 사람과 일을 두루 받아주는 성향",
금: yang ? "칼처럼 기준이 뚜렷하고 옳고 그름을 분명히 가르는 성향" : "보석처럼 섬세하고 완성도에 민감한 성향",
수: yang ? "큰 강처럼 생각이 넓게 흐르고 상황을 통째로 읽는 성향" : "이슬처럼 예민하게 감지하고 속으로 깊이 새기는 성향",
}[el];

const byStrength = {
신강: "자기 축이 단단해 남의 말에 잘 휘둘리지 않습니다. 다만 힘이 남아서 고집으로 비칠 때가 있어요.",
중화: "밀 때와 물러설 때의 균형이 좋은 편입니다. 극단으로 가지 않는 것이 가장 큰 자산이에요.",
신약: "주변 분위기를 잘 읽고 맞춰주는 대신, 혼자 결정할 때 에너지가 빨리 소모됩니다. 사람과 환경을 잘 고르는 게 관건이에요.",
}[strength];

const byDominant = {
비견: "독립심이 강해 내 몫은 내가 해내야 직성이 풀립니다.",
겁재: "승부욕과 추진력이 큽니다. 경쟁 상황에서 오히려 살아나요.",
식신: "표현하고 만들어내는 힘이 좋습니다. 먹고 즐기는 것에도 복이 있어요.",
상관: "재능과 말솜씨가 뛰어나지만 틀에 갇히는 걸 못 견딥니다.",
편재: "판을 크게 보고 기회를 잡는 감각이 있습니다. 돈이 크게 들고 크게 나가요.",
정재: "성실하게 쌓아 올리는 타입입니다. 관리와 계산이 정확해요.",
편관: "위기에서 강해지는 돌파형입니다. 압박을 견디는 힘이 큽니다.",
정관: "책임감과 원칙이 뚜렷합니다. 조직과 규칙 안에서 빛나요.",
편인: "남다른 시각과 직관이 있습니다. 관심사가 깊고 좁아요.",
정인: "배우고 정리하는 힘이 큽니다. 어른스럽고 안정적이에요.",
}[dominant] || "특정 기운에 치우치지 않아 상황에 따라 다른 얼굴이 나옵니다.";

const cautions = [];
if (group.관성 === 0) cautions.push("관성이 없어 스스로 규율을 세우지 않으면 흐트러지기 쉬워요.");
if (group.재성 === 0) cautions.push("재성이 약해 현실적인 계산을 놓칠 때가 있어요.");
if (group.인성 === 0) cautions.push("인성이 없어 쉬어가는 법을 배워야 오래갑니다.");
if (group.식상 === 0) cautions.push("식상이 없어 속마음을 표현하는 연습이 필요해요.");
if (missing.length) cautions.push("사주에 " + missing.join("·") + " 기운이 비어 있어, 그 부분은 사람이나 환경에서 채우는 게 좋아요.");

return {
core: core,
strength: byStrength,
dominant: byDominant,
keywords: [el + "일간", strength, dominant || "무편중", strongest + "가 강함"],
cautions: cautions,
summary: core + ". " + byDominant + " " + byStrength,
};
}

// ============================================================
function renderText(r) {
const L = [];
const p = r.pillars;
L.push("■ 사주팔자 (" + r.sajuYear + "년 " + r.zodiac + "띠)");
L.push("  년주 " + p.year.name + "(" + p.year.nameCn + ")   월주 " + p.month.name + "(" + p.month.nameCn + ")");
L.push("  일주 " + p.day.name + "(" + p.day.nameCn + ")" + (p.hour ? "   시주 " + p.hour.name + "(" + p.hour.nameCn + ")" : "   시주 —(출생시각 미상)"));
L.push("");
L.push("■ 일간 " + r.dayMaster.stem + "(" + r.dayMaster.element + ") · " + r.elements.strength + " (지지율 " + r.elements.supportRatio + ")");
L.push("");
L.push("■ 오행 분포");
L.push("  " + ELEMENTS.map((e) => e + " " + r.elements.percent[e] + "%").join("  |  "));
if (r.elements.missing.length) L.push("  없는 오행: " + r.elements.missing.join(", "));
L.push("");
L.push("■ 십성");
L.push("  " + Object.keys(r.tenGods.group).map((g) => g + " " + Math.round(r.tenGods.group[g] * 10) / 10).join("  |  "));
if (r.tenGods.dominant) L.push("  가장 강한 십성: " + r.tenGods.dominant);
if (r.tenGods.absent.length) L.push("  없는 십성: " + r.tenGods.absent.join(", "));
L.push("");
const rel = r.relations;
const relLines = [];
Object.keys(rel).forEach((k) => { if (rel[k].length) relLines.push("  " + k + ": " + rel[k].join(", ")); });
L.push("■ 형충회합");
L.push(relLines.length ? relLines.join("\n") : "  두드러진 합·충이 없습니다.");
L.push("");
L.push("■ 공망: " + r.gongmang.branches.join(", "));
L.push("");
L.push("■ 대운 (" + r.daeun.direction + ", " + r.daeun.startAge + "세 시작)");
L.push("  " + r.daeun.list.map((d) => d.age + "세 " + d.name).join("  →  "));
L.push("");
L.push("■ 심리");
L.push("  " + r.psychology.summary);
r.psychology.cautions.forEach((c) => L.push("  · " + c));
return L.join("\n");
}

// ============================================================
// compatibility() — 궁합 중심 해설 (6개 섹션)
// ============================================================
const nameOf = (r) => r.name || r.dayMaster.stem + "일간";
const jEun = (w) => josa(w, "은", "는");
const jI = (w) => josa(w, "이", "가");
const jEul = (w) => josa(w, "을", "를");
const jIe = (w) => josa(w, "이에요", "예요");
const jGwa = (w) => josa(w, "과", "와");

const STEM_CHAR = {
갑: "곧게 뻗는 나무", 을: "휘어져 자라는 덩굴", 병: "숨김없는 태양", 정: "은근한 촛불",
무: "묵직한 산", 기: "품 넓은 밭", 경: "날 선 쇠", 신: "정교한 보석",
임: "넓게 흐르는 강", 계: "스며드는 이슬",
};

const ELEM_ROLE = {
목: "뻗어나가는", 화: "드러내는", 토: "품어주는", 금: "정리하는", 수: "흘려보내는",
};

export function compatibility(personA, personB, opts) {
const o = opts || {};
const a = personA && personA.pillars ? personA : saju(personA);
const b = personB && personB.pillars ? personB : saju(personB);
const A = nameOf(a), B = nameOf(b);
const notes = [];
const sections = [];
let score = 50;

const ad = a.pillars.day, bd = b.pillars.day;
const as = ad.stemIdx, bs = bd.stemIdx;
const ae = STEM_ELEMENT[as], be = STEM_ELEMENT[bs];

// ---------- 1. 성격 케미 (일간) ----------
let t1 = jEun(A) + " " + ad.stem + "(" + ELEMENTS[ae] + "), " + jEun(B) + " " + bd.stem + "(" + ELEMENTS[be] + ") 일간이에요. ";
t1 += jEun(A) + " " + STEM_CHAR[ad.stem] + " 같은 사람이고, " + jEun(B) + " " + STEM_CHAR[bd.stem] + " 같은 사람입니다. ";
if ((as - bs + 10) % 10 === 5) {
score += 14;
t1 += "두 일간이 " + ad.stem + bd.stem + " 천간합을 이뤄요. 사주에서 가장 좋게 보는 배합 중 하나로, 굳이 노력하지 않아도 서로에게 끌리고 옆에 있으면 편안해집니다. 다투더라도 결국 다시 붙는 힘이 있어요.";
notes.push("일간 " + ad.stem + "·" + bd.stem + " 천간합 — 서로에게 자연스럽게 끌리는 배합이에요.");
} else if (ae === be) {
const same = STEM_YANG[as] === STEM_YANG[bs];
score += same ? 5 : 3;
t1 += "두 분 다 " + ELEMENTS[ae] + " 기운의 일간이라 세상을 보는 방식이 닮았어요. 말하지 않아도 통하는 순간이 많은 대신, 닮은 만큼 약점도 똑같습니다. 둘 다 물러서지 않을 때 답이 안 나오는 게 이 조합의 숙제예요. " + (same ? "특히 음양까지 같아서 부딪히면 정면충돌이 되기 쉬워요." : "음양이 달라 그나마 서로 숨 쉴 틈은 있는 편입니다.");
notes.push("두 분 다 " + ELEMENTS[ae] + " 일간 — 성향이 닮아 편한 대신, 닮은 만큼 고집도 부딪혀요.");
} else if (generates(ae, be) || generates(be, ae)) {
score += 10;
const giverIsA = generates(ae, be);
const g = giverIsA ? A : B, t = giverIsA ? B : A;
const ge = giverIsA ? ae : be;
t1 += g + "의 " + ELEMENTS[ge] + " 기운이 " + jEul(t) + " 살려주는 상생 관계예요. " + jI(g) + " " + ELEM_ROLE[ELEMENTS[ge]] + " 힘으로 밀어주면 " + jI(t) + " 그걸 받아 자기 것으로 만듭니다. 다만 오래되면 주는 쪽이 지칠 수 있어서, 받는 쪽이 표현해 주는 게 이 관계를 오래 가게 하는 열쇠예요.";
notes.push(g + " 쪽의 " + ELEMENTS[ge] + " 기운이 상대를 북돋는 상생 관계예요.");
} else {
score -= 6;
const atkA = controls(ae, be);
t1 += "두 일간이 서로 극하는 관계입니다. " + (atkA ? jI(A) + " " + jEul(B) : jI(B) + " " + jEul(A)) + " 누르는 구조라, 한쪽이 답답함을 자주 느낄 수 있어요. 나쁘기만 한 건 아니고 긴장감이 매력으로 작동하기도 하는데, 서로를 고치려 드는 순간부터 급격히 힘들어집니다.";
notes.push("일간이 서로 극하는 관계 — 기질 차이가 또렷해 조율이 필요해요.");
}
t1 += " 참고로 " + jEun(A) + " " + a.elements.strength + ", " + jEun(B) + " " + b.elements.strength + " 사주예요.";
sections.push({ title: "🧠 성격 케미 (일간 궁합)", text: t1 });

// ---------- 2. 살 맞대는 궁합 (일지) ----------
const ab = ad.branchIdx, bb = bd.branchIdx;
let t2 = "일지는 사주에서 배우자가 앉는 자리예요. " + jEun(A) + " " + ad.branch + ", " + jEun(B) + " " + bd.branch + " 자리를 갖고 있습니다. ";
if (isSixHarmony(ab, bb)) {
score += 16;
t2 += jGwa(ad.branch) + " " + jEun(bd.branch) + " 육합입니다. 배우자 자리끼리 딱 맞물리는, 궁합에서 최고로 치는 형태 중 하나예요. 생활 리듬이 자연스럽게 맞춰지고, 같이 사는 상상이 무리 없이 되는 조합입니다. 사소한 취향 차이는 있어도 큰 틀에서 어긋나지 않아요.";
notes.push("일지 " + ad.branch + "·" + bd.branch + " 육합 — 배우자 자리가 딱 맞물리는 최고 조합 중 하나예요.");
} else if (triadOf(ab, bb)) {
score += 13;
const tr = triadOf(ab, bb);
t2 += "두 일지가 " + ELEMENTS[tr[3]] + "국 삼합을 이뤄요. 같이 있을 때 일이 잘 풀리고, 둘이 뭔가를 함께 도모하면 성과가 나는 사이입니다. 연애보다 동업이나 결혼처럼 오래 같이 가는 관계에서 더 빛나는 조합이에요.";
notes.push("일지 삼합 — 같이 있으면 일이 잘 풀리는 사이예요.");
} else if (isClash(ab, bb)) {
score -= 12;
t2 += jGwa(ad.branch) + " " + jEun(bd.branch) + " 충 관계입니다. 배우자 자리가 정면으로 부딪히는 형태라, 처음엔 강하게 끌리지만 같이 지내다 보면 생활 리듬이 자주 어긋나요. 자는 시간, 돈 쓰는 방식, 쉬는 방법 같은 사소한 지점에서 마찰이 반복됩니다. 서로의 영역을 확실히 나눠 두면 오히려 오래갈 수 있는 조합이에요.";
notes.push("일지 " + ad.branch + "·" + bd.branch + " 충 — 생활 리듬이 자주 어긋나 사소한 마찰이 반복돼요.");
} else if (isPunish(ab, bb)) {
score -= 8;
t2 += "두 일지가 형(刑) 관계예요. 겉으로 큰 싸움은 안 나는데, 가까워질수록 유독 예민해지는 지점이 생깁니다. 말투나 표정 같은 작은 신호에 서로 과하게 반응할 수 있어요. 애매하게 넘기지 말고 그때그때 말로 풀어야 쌓이지 않습니다.";
notes.push("일지 형 — 가까워질수록 예민해지는 지점이 생겨요.");
} else if (isWonjin(ab, bb)) {
score -= 10;
t2 += jGwa(ad.branch) + " " + jEun(bd.branch) + " 원진(怨嗔) 관계예요. 평소엔 아무 문제 없다가도 어느 순간 상대의 사소한 행동이 이유 없이 거슬리는 날이 옵니다. 미워할 이유가 딱히 없는데 밉다면 그건 원진의 소행이에요. 그 시기가 지나면 다시 멀쩡해지니, 그때 나온 말로 큰 결정을 내리지 않는 게 중요합니다.";
notes.push("일지 원진(怨嗔) — 이유 없이 미워지는 순간이 주기적으로 와요.");
} else if (isPo(ab, bb)) {
score -= 6;
t2 += jGwa(ad.branch) + " " + jEun(bd.branch) + " 파(破) 관계예요. 큰 싸움이 나는 건 아닌데, 소소한 마찰과 어긋남이 반복되기 쉬운 구조입니다. 약속 시간이 미묘하게 틀어지거나 말이 조금씩 어긋나는 식이에요. 자잘한 서운함을 쌓아두지 말고 그때그때 풀어주면 충분히 커버되는 수준입니다.";
notes.push("일지 파(破) — 잔잔한 균열이 생기기 쉬운 조합이에요.");
} else if (ab === bb) {
score += 6;
t2 += "두 분의 일지가 " + josa(ad.branch, "으로", "로") + " 같아요. 취향과 생활 습관이 비슷해서 같이 있으면 편합니다. 다만 둘 다 같은 걸 원하고 같은 걸 싫어하니, 서로를 채워준다기보다 나란히 걷는 느낌에 가까워요.";
notes.push("일지가 같아 취향과 생활 습관이 비슷해요.");
} else {
t2 += "두 일지 사이에 뚜렷한 합도 충도 없어요. 극적으로 끌리지도, 크게 부딪히지도 않는 담백한 관계입니다. 이런 조합은 사주보다 두 분이 쌓아가는 시간이 훨씬 크게 작용해요.";
}
sections.push({ title: "🏠 살 맞대는 궁합 (일지·배우자궁)", text: t2 });

// ---------- 3. 띠 궁합 (년지) ----------
const ay = a.pillars.year.branchIdx, by = b.pillars.year.branchIdx;
const tri = triadOf(ay, by);
let t3 = jEun(A) + " " + a.zodiac + "띠, " + jEun(B) + " " + b.zodiac + "띠예요. 년지는 집안·바깥 인연·첫인상을 보는 자리입니다. ";
if (tri) {
score += 9;
t3 += a.zodiac + "띠와 " + b.zodiac + "띠는 " + ELEMENTS[tri[3]] + "국 삼합이에요. 전통적으로 가장 좋게 보는 띠 조합으로, 주변에서도 '잘 어울린다'는 말을 자주 듣게 됩니다. 양가 어른들과의 관계나 친구들 사이에서도 무리 없이 섞이는 편이에요.";
notes.push("띠 삼합 — " + a.zodiac + "띠와 " + b.zodiac + "띠는 전통적으로 최고로 치는 조합이에요.");
} else if (isSixHarmony(ay, by)) {
score += 8;
t3 += a.zodiac + "띠와 " + b.zodiac + "띠는 육합입니다. 서로 부족한 걸 자연스럽게 메워주는 관계예요. 성향은 달라도 그 다름이 불편하지 않고 오히려 도움이 되는 조합입니다.";
notes.push("띠 육합 — " + a.zodiac + "띠와 " + b.zodiac + "띠는 서로 부족한 걸 메워주는 관계예요.");
} else if (isClash(ay, by)) {
score -= 7;
t3 += a.zodiac + "띠와 " + b.zodiac + "띠는 충 관계예요. 첫인상이 강렬하고 초반 끌림이 큰 대신, 시간이 지나면 가치관 차이가 드러납니다. 특히 명절이나 집안 행사처럼 양가가 얽히는 자리에서 온도차가 날 수 있어요. 서로의 배경을 존중하는 태도가 중요합니다.";
notes.push("띠 충 — " + a.zodiac + "띠와 " + b.zodiac + "띠는 처음엔 강하게 끌리지만 오래 부딪히기도 해요.");
} else if (isPunish(ay, by)) {
score -= 4;
t3 += "두 띠가 형 관계라 초반엔 몰랐던 예민한 지점이 시간이 지나며 드러날 수 있어요. 큰 문제는 아니고, 서로의 예민한 영역을 알아두면 충분히 넘어갈 수 있습니다.";
} else if (isWonjin(ay, by)) {
score -= 5;
t3 += a.zodiac + "띠와 " + b.zodiac + "띠는 원진 관계예요. 스타일이 달라 가끔 답답할 때가 있지만, 그만큼 서로에게 없는 걸 갖고 있다는 뜻이기도 합니다. 붙어 있는 시간과 각자의 시간을 적당히 나누면 훨씬 편해져요.";
notes.push("띠 원진 — " + a.zodiac + "띠와 " + b.zodiac + "띠는 가끔 이유 없이 답답해질 수 있어요.");
} else {
t3 += "띠끼리는 특별한 합도 충도 없어요. 띠 궁합은 이 관계에서 큰 변수가 아니니, 앞의 일간·일지 쪽을 더 비중 있게 보시면 됩니다.";
}
sections.push({ title: "🐍 띠 궁합 (년지)", text: t3 });

// ---------- 4. 배우자 인연 (재성·관성) ----------
const spouseGod = (p) => (p.input.gender === "F" ? ["편관", "정관"] : ["편재", "정재"]);
const spouseName = (p) => (p.input.gender === "F" ? "관성(남편 자리)" : "재성(아내 자리)");
let t4 = "";
[[a, b], [b, a]].forEach((pair) => {
const me = pair[0], you = pair[1];
const mn = nameOf(me), yn = nameOf(you);
if (!me.input.gender) { t4 += jEun(mn) + " 성별 정보가 없어 배우자성을 보기 어려워요. "; return; }
const gods = spouseGod(me);
const own = Math.round(gods.reduce((s2, g) => s2 + me.tenGods.count[g], 0) * 10) / 10;
const fromYou = gods.includes(tenGod(me.pillars.day.stemIdx, you.pillars.day.stemIdx));
t4 += mn + "의 사주에서 배우자를 뜻하는 " + spouseName(me) + " 기운은 " + own + "만큼 있어요. ";
if (own >= 2) { score += 4; t4 += "배우자 자리가 뚜렷해서 결혼 인연이 잘 드러나는 사주입니다. "; }
else if (own === 0) { t4 += "겉으로 드러난 배우자성이 없는 편이라 인연이 늦거나 조용히 오는 타입이에요. "; }
else { t4 += "적당히 있어서 극단적이지 않은 인연운이에요. "; }
if (fromYou) {
score += 6;
t4 += "그런데 " + yn + "의 일간이 정확히 " + mn + "의 배우자성에 해당합니다. 사주가 말하는 '만나야 할 사람' 유형이라, " + mn + "에게 " + jEun(yn) + " 본능적으로 끌리는 자리예요. ";
notes.push(yn + " 쪽 일간이 " + mn + " 쪽의 배우자성에 해당해요 — 사주가 말하는 '만나야 할 사람' 유형이에요.");
}
t4 += "\n";
});
sections.push({ title: "💍 배우자 인연 (재성·관성)", text: t4.trim() });

// ---------- 5. 오행 보완 ----------
let fill = 0;
const fillNotes = [];
let t5 = A + "의 오행은 " + ELEMENTS.map((e, i) => e + " " + a.elements.count[i]).join(", ") + "이고, ";
t5 += jEun(B) + " " + ELEMENTS.map((e, i) => e + " " + b.elements.count[i]).join(", ") + "입니다. ";
a.elements.missing.forEach((e) => { if (b.elements.percent[e] >= 20) { fill += 1; fillNotes.push(jI(B) + " " + josa(e, "을", "를") + " 채워주"); } });
b.elements.missing.forEach((e) => { if (a.elements.percent[e] >= 20) { fill += 1; fillNotes.push(jI(A) + " " + josa(e, "을", "를") + " 채워주"); } });
if (fill) {
score += Math.min(14, fill * 7);
t5 += fillNotes.join("고, ") + "는 관계예요. 내게 없는 오행을 가진 사람에게 끌리는 건 본능이에요. 같이 있으면 이유 없이 안정되는 느낌이 드는 게 바로 이 부분 때문입니다.";
notes.push("오행 상호보완 — " + fillNotes.join("고, ") + "는 사이. 없는 오행을 가진 사람에게 끌리는 건 본능이에요.");
} else if (a.elements.strongestIdx === b.elements.strongestIdx) {
t5 += "두 분 다 " + a.elements.strongest + " 기운이 가장 강해요. 비슷한 결이라 편하지만, 부족한 부분도 똑같이 비어 있어서 그건 둘이 아닌 밖에서 채워야 합니다.";
} else {
t5 += "서로의 빈 곳을 크게 채워주지는 않지만, 각자 균형이 나쁘지 않은 편이에요. 오행보다는 앞에서 본 일간·일지 관계가 이 관계를 더 크게 좌우합니다.";
}
sections.push({ title: "⚖️ 오행 보완", text: t5 });

// ---------- 6. 앞으로의 흐름 (대운) ----------
const nowYear = o.nowYear || null;
let t6 = "";
const curOf = (p) => {
if (!nowYear) return null;
const age = nowYear - p.input.year;
let cur = null;
p.daeun.list.forEach((d) => { if (age >= d.age) cur = d; });
return cur ? { d: cur, age: age } : null;
};
const ca = curOf(a), cb = curOf(b);
if (ca && cb) {
t6 += "지금 " + jEun(A) + " " + ca.d.age + "세부터 시작된 " + ca.d.name + " 대운(" + ca.d.element + "), " + jEun(B) + " " + cb.d.age + "세부터의 " + cb.d.name + " 대운(" + cb.d.element + ")을 지나고 있어요. ";
const helpsB = a.elements.missing.indexOf(cb.d.element) >= 0 || generates(ELEMENTS.indexOf(cb.d.element), ae);
const helpsA = b.elements.missing.indexOf(ca.d.element) >= 0 || generates(ELEMENTS.indexOf(ca.d.element), be);
if (helpsA && helpsB) t6 += "두 사람의 대운이 서로에게 필요한 기운을 물고 있어서, 지금이 이 관계에서 가장 좋은 구간이에요. 미룰 이유가 없는 시기입니다. ";
else if (helpsA || helpsB) t6 += "한쪽의 대운이 상대에게 도움이 되는 흐름이에요. 지금은 그 사람이 조금 더 끌어주는 시기라고 보시면 됩니다. ";
else t6 += "지금 대운은 서로를 특별히 밀어주지도, 방해하지도 않아요. 흐름보다 두 분의 선택이 더 크게 작용하는 시기입니다. ";
} else {
t6 += jEun(A) + " " + a.daeun.direction + "으로 " + a.daeun.startAge + "세부터, " + jEun(B) + " " + b.daeun.direction + "으로 " + b.daeun.startAge + "세부터 대운이 바뀌어요. ";
}
if (a.daeun.direction !== b.daeun.direction) t6 += "두 분의 대운이 서로 반대 방향으로 흘러서, 인생의 속도와 관심사가 시기마다 엇갈릴 수 있어요. 한쪽이 정착하고 싶을 때 다른 쪽은 움직이고 싶어지는 식입니다. 그 타이밍만 서로 이해하면 오히려 지루할 틈이 없는 조합이에요.";
else t6 += "두 분의 대운이 같은 방향으로 흘러요. 인생의 큰 리듬이 비슷해서, 자리 잡고 싶은 시기와 도전하고 싶은 시기가 얼추 맞아떨어집니다.";
sections.push({ title: "⏳ 앞으로의 흐름 (대운)", text: t6 });

// ---------- 신강/신약 균형 ----------
if (a.elements.strength !== b.elements.strength && a.elements.strength !== "중화" && b.elements.strength !== "중화") {
score += 4;
notes.push("한 쪽은 " + a.elements.strength + ", 한 쪽은 " + b.elements.strength + " — 밀고 당기는 힘의 균형이 맞아요.");
}

// 표시 점수 보정: 내부 원점수를 사람들이 이해하는 척도로 매핑 (순위는 불변)
const SCALE = [[26, 20], [53, 47], [58, 57], [63, 67], [69, 77], [84, 89], [100, 99]];
let disp = 99;
if (score <= SCALE[0][0]) disp = SCALE[0][1];
else for (let si = 1; si < SCALE.length; si++) {
if (score <= SCALE[si][0]) { const p = SCALE[si - 1], q = SCALE[si]; disp = p[1] + (score - p[0]) * (q[1] - p[1]) / (q[0] - p[0]); break; }
}
score = Math.round(Math.max(15, Math.min(99, disp)));

const v = score >= 90 ? ["💞", "절대 말어!!", "이 조합 놓치면 후회해요. 사주가 먼저 밀어주는 사이예요."]
: score >= 78 ? ["💕", "말어~", "웬만하면 계속 만나세요. 이 정도 궁합 흔치 않아요."]
: score >= 68 ? ["🙌", "좀 더 봐봐", "나쁘지 않아요. 다만 서로 맞추는 구간이 필요해요."]
: score >= 58 ? ["😐", "반반", "잘 되면 오래가고, 안 되면 길게 힘들어요. 대화가 전부예요."]
: score >= 48 ? ["😵", "음... 글쎄", "기질 차이가 커요. 서로 바꾸려 들면 더 힘들어져요."]
: ["🏃", "도망쳐!!!", "사주로만 보면 고난도예요. 그래도 좋다면 그건 두 분 몫!"];

const WARN = ["부딪", "어긋", "예민", "차이", "마찰", "고집", "힘들", "균열", "미워", "답답"];
const bads = notes.filter((n) => WARN.some((w) => n.indexOf(w) >= 0));
const goods = notes.filter((n) => bads.indexOf(n) < 0);

return { score: score, verdictEmoji: v[0], verdict: v[1], verdictSub: v[2], sections: sections, notes: notes, goods: goods, bads: bads, a: a, b: b };
}

// 하위 호환
export function pillarText(p) { return p ? p.name : "—"; }
