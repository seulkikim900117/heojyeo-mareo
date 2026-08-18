// ============================================================
// 궁합 분석 로직: 두 사람의 사주를 비교해 점수 + 풀이 생성
// 전통 궁합 이론(천간합, 지지 육합/삼합/충/형, 오행 상생상극)을
// 재미 위주로 점수화한 것. 결과는 엔터테인먼트 용도!
// ============================================================

import { calcSaju, ELEMENTS, ELEMENT_EMOJI, STEMS, BRANCHES, BRANCH_ANIMALS, generates, controls, STEM_ELEMENT, BRANCH_ELEMENT } from "./saju.js";

// --- 관계 판정 유틸 ---
const stemHap = (a, b) => (a + 5) % 10 === b || (b + 5) % 10 === a; // 천간합
const branchYukhap = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0) || a + b === 13; // 육합
const branchChung = (a, b) => Math.abs(a - b) === 6; // 충
const branchSamhap = (a, b) => a !== b && a % 4 === b % 4; // 삼합(반합)
const HYEONG_PAIRS = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]]; // 인사신, 축술미, 자묘
const branchHyeong = (a, b) => HYEONG_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
const WONJIN_PAIRS = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]]; // 원진
const branchWonjin = (a, b) => WONJIN_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

function relationOfElements(a, b) {
      if (a === b) return "same";
      if (generates(a, b)) return "aGivesB";
      if (generates(b, a)) return "bGivesA";
      if (controls(a, b)) return "aControlsB";
      return "bControlsA";
}

// ============================================================
// 메인: 궁합 분석
// ============================================================
export function analyzeGunghap(person1, person2) {
      const s1 = calcSaju(person1);
      const s2 = calcSaju(person2);

  let score = 50;
      const goods = [];
      const bads = [];

  const n1 = person1.name || "첫 번째 분";
      const n2 = person2.name || "두 번째 분";

  // ---------- 1) 일간 궁합 (서로의 본질적 케미) ----------
  const d1 = s1.dayMaster, d2 = s2.dayMaster;
      const e1 = STEM_ELEMENT[d1], e2 = STEM_ELEMENT[d2];
      let mindText = "";
      if (stemHap(d1, d2)) {
              score += 16;
              goods.push("천간합(天干合) — 영혼의 단짝 조합");
              mindText = `${n1}의 일간 ${STEMS[d1]}(${ELEMENTS[e1]})와 ${n2}의 일간 ${STEMS[d2]}(${ELEMENTS[e2]})는 천간합! 사주에서 손꼽히는 인연으로, 처음 만났을 때부터 뭔가 통한다는 느낌을 받았을 조합이에요. 서로가 서로에게 자석처럼 끌립니다.`;
      } else {
              const rel = relationOfElements(e1, e2);
              if (rel === "same") {
                        score += 5;
                        goods.push("일간 오행이 같음 — 닮은꼴 커플");
                        mindText = `두 분 다 ${ELEMENTS[e1]}${ELEMENT_EMOJI[e1]} 기운의 일간이에요. 성향이 비슷해서 편하지만, 비슷한 만큼 고집도 부딪힐 수 있어요. "우리 왜 이렇게 똑같아?"와 "너 왜 나처럼 굴어?" 사이를 오가는 관계.`;
              } else if (rel === "aGivesB" || rel === "bGivesA") {
                        score += 10;
                        const giver = rel === "aGivesB" ? n1 : n2;
                        const taker = rel === "aGivesB" ? n2 : n1;
                        goods.push("일간 상생(相生) — 한쪽이 다른 쪽을 키워주는 관계");
                        mindText = `${giver}의 기운이 ${taker}를 生(생)해주는 상생 관계예요. ${giver}가 챙겨주고 ${taker}가 받으면서 크는 구조라, 자연스럽게 서로에게 스며듭니다. 다만 주는 쪽이 지치지 않게 균형을 챙기세요.`;
              } else {
                        score -= 9;
                        const winner = rel === "aControlsB" ? n1 : n2;
                        const loser = rel === "aControlsB" ? n2 : n1;
                        bads.push("일간 상극(相剋) — 본질 성향이 부딪히는 조합");
                        mindText = `${winner}의 기운이 ${loser}를 剋(극)하는 상극 관계예요. 연애 초반엔 이 긴장감이 오히려 스릴이지만, 오래 가면 ${loser}가 은근히 눌리는 느낌을 받을 수 있어요. 싸움의 패턴이 반복된다면 이 구조 때문일 확률이 높습니다.`;
              }
      }

  // ---------- 2) 일지 궁합 (배우자궁) ----------
  const b1 = s1.pillars.day.branch, b2 = s2.pillars.day.branch;
      let spouseText = "";
      if (branchYukhap(b1, b2)) {
              score += 16;
              goods.push("일지 육합(六合) — 배우자궁이 꼭 맞물리는 찰떡 조합");
              spouseText = `${n1}의 일지 ${BRANCHES[b1]}와 ${n2}의 일지 ${BRANCHES[b2]}는 육합! 일지는 "배우자 자리"인데 이 둘이 합을 이루면 살 맞대고 사는 궁합이 아주 좋다는 뜻이에요. 같이 있을 때 제일 편한 사람일 가능성이 큽니다.`;
      } else if (branchSamhap(b1, b2)) {
              score += 11;
              goods.push("일지 삼합(三合) — 같은 팀 케미");
              spouseText = `두 분의 일지 ${BRANCHES[b1]}·${BRANCHES[b2]}는 삼합 관계예요. 목표를 향해 같이 달리는 "팀워크형" 궁합이라, 연애를 넘어 인생 동업자로도 잘 맞습니다. 함께 뭔가를 도모할 때 시너지가 폭발해요.`;
      } else if (branchChung(b1, b2)) {
              score -= 15;
              bads.push("일지 충(沖) — 배우자궁끼리 정면충돌");
              spouseText = `${BRANCHES[b1]}와 ${BRANCHES[b2]}는 충(沖)이에요. 배우자 자리끼리 부딪히니 같이 사는 문제(생활 습관, 공간, 잠버릇까지)에서 유독 트러블이 잦을 수 있어요. 열정도 그만큼 강렬해서 "싸우면서 정드는" 타입인데, 문제는 체력전이라는 것...`;
      } else if (branchWonjin(b1, b2)) {
              score -= 10;
              bads.push("일지 원진(怨嗔) — 이유 없이 미워지는 순간이 오는 조합");
              spouseText = `${BRANCHES[b1]}와 ${BRANCHES[b2]}는 원진 관계예요. 평소엔 좋다가도 어느 순간 상대의 사소한 행동이 이유 없이 거슬리는 날이 옵니다. "쟤 숨 쉬는 것도 얄미워" 모드가 주기적으로 온다면 원진의 소행이에요.`;
      } else if (branchHyeong(b1, b2)) {
              score -= 8;
              bads.push("일지 형(刑) — 서로를 은근히 갈아넣는 조합");
              spouseText = `${BRANCHES[b1]}와 ${BRANCHES[b2]}는 형(刑) 관계예요. 겉으론 잘 지내는데 속으로 스트레스가 쌓이는 구조라, 참다가 한 번에 터지는 패턴을 조심해야 해요. 불만은 그때그때 말로 푸는 게 답입니다.`;
      } else {
              score += 2;
              spouseText = `두 분의 일지(배우자궁)는 특별한 합도 충도 없는 무난한 관계예요. 극적인 케미는 아니지만, 반대로 크게 부딪힐 이유도 없다는 뜻. 궁합은 결국 노력으로 채우는 부분이 큰 조합입니다.`;
      }

  // ---------- 3) 띠 궁합 (년지) ----------
  const y1 = s1.pillars.year.branch, y2 = s2.pillars.year.branch;
      let zodiacText = "";
      if (branchYukhap(y1, y2)) {
              score += 7;
              goods.push(`띠 육합 — ${s1.zodiac}띠·${s2.zodiac}띠 찰떡 조합`);
              zodiacText = `${s1.zodiac}띠와 ${s2.zodiac}띠는 육합이에요. 어르신들이 "궁합 좋다" 할 때 보는 게 바로 이 띠 궁합인데, 두 분은 합격입니다. 집안 어른들 반응도 좋을 확률이 높아요.`;
      } else if (branchSamhap(y1, y2)) {
              score += 6;
              goods.push(`띠 삼합 — ${s1.zodiac}띠·${s2.zodiac}띠 환상의 팀`);
              zodiacText = `${s1.zodiac}띠와 ${s2.zodiac}띠는 삼합! 전통적으로 최고로 치는 띠 조합 중 하나예요. 서로의 부족한 부분을 자연스럽게 메워주는 관계입니다.`;
      } else if (branchChung(y1, y2)) {
              score -= 8;
              bads.push(`띠 충 — ${s1.zodiac}띠·${s2.zodiac}띠는 상충 관계`);
              zodiacText = `${s1.zodiac}띠와 ${s2.zodiac}띠는 충이에요. 어른들이 걱정할 수 있는 조합이지만, 띠 궁합은 사주 전체에서 비중이 크지 않아요. 일간·일지 궁합이 좋다면 크게 신경 쓸 필요 없습니다.`;
      } else if (branchWonjin(y1, y2)) {
              score -= 5;
              bads.push(`띠 원진 — ${s1.zodiac}띠·${s2.zodiac}띠`);
              zodiacText = `${s1.zodiac}띠와 ${s2.zodiac}띠는 원진 관계예요. 서로 스타일이 달라 답답할 때가 있지만, 그만큼 서로에게 없는 걸 갖고 있다는 뜻이기도 해요.`;
      } else {
              zodiacText = `${s1.zodiac}띠와 ${s2.zodiac}띠 — 특별한 합충 없이 무난한 띠 조합이에요.`;
      }

  // ---------- 4) 오행 보완 ----------
  let fillText = "";
      let fillCount = 0;
      const fills = [];
      for (let el = 0; el < 5; el++) {
              if (s1.elements[el] === 0 && s2.elements[el] >= 2) {
                        fills.push(`${n2}의 넘치는 ${ELEMENTS[el]}${ELEMENT_EMOJI[el]} 기운이 ${n1}에게 없는 ${ELEMENTS[el]}을 채워줘요`);
                        fillCount++;
              }
              if (s2.elements[el] === 0 && s1.elements[el] >= 2) {
                        fills.push(`${n1}의 넘치는 ${ELEMENTS[el]}${ELEMENT_EMOJI[el]} 기운이 ${n2}에게 없는 ${ELEMENTS[el]}을 채워줘요`);
                        fillCount++;
              }
      }
      if (fillCount > 0) {
              score += Math.min(fillCount * 5, 10);
              goods.push("오행 상호보완 — 서로의 빈 곳을 채워주는 사이");
              fillText = fills.join(". ") + ". 사주에서 나에게 없는 오행을 가진 사람에게 끌리는 건 본능이에요. 같이 있으면 이상하게 안정되는 이유가 여기 있습니다.";
      } else {
              fillText = "서로의 오행을 극적으로 채워주는 구조는 아니에요. 하지만 오행 보완은 궁합의 여러 요소 중 하나일 뿐!";
      }

  // ---------- 5) 월지 궁합 ----------
  const m1 = s1.pillars.month.branch, m2 = s2.pillars.month.branch;
      if (branchYukhap(m1, m2) || branchSamhap(m1, m2)) {
              score += 5;
              goods.push("월지 합 — 생활 리듬이 잘 맞는 조합");
      } else if (branchChung(m1, m2)) {
              score -= 5;
              bads.push("월지 충 — 라이프스타일 차이 주의");
      }

  // ---------- 점수 마무리 ----------
  score = Math.max(4, Math.min(99, score));

  // ---------- 판정 ----------
  let verdict, verdictEmoji, verdictSub;
      if (score >= 85) {
              verdict = "절대 말어!!";
              verdictEmoji = "💍";
              verdictSub = "이 사람 놓치면 평생 후회합니다. 꽉 잡으세요.";
      } else if (score >= 70) {
              verdict = "말어~";
              verdictEmoji = "💕";
              verdictSub = "웬만하면 계속 만나세요. 이 정도 궁합 흔치 않아요.";
      } else if (score >= 55) {
              verdict = "음... 말어?";
              verdictEmoji = "🤔";
              verdictSub = "나쁘지 않아요. 노력하면 충분히 갈 수 있는 궁합.";
      } else if (score >= 40) {
              verdict = "고민 좀 해봐...";
              verdictEmoji = "😐";
              verdictSub = "사주는 반반이에요. 결국 두 분 하기 나름입니다.";
      } else if (score >= 25) {
              verdict = "헤어져...?";
              verdictEmoji = "💔";
              verdictSub = "사주상 부딪히는 지점이 꽤 있어요. 각오는 하고 만나세요.";
      } else {
              verdict = "도망쳐!!!";
              verdictEmoji = "🏃";
              verdictSub = "사주가 말합니다. 이건... 전쟁입니다. 그래도 사랑이 이길 수도?";
      }

  return {
          score,
          verdict,
          verdictEmoji,
          verdictSub,
          goods,
          bads,
          sections: [
              { title: "🧠 성격 케미 (일간 궁합)", text: mindText },
              { title: "🏠 살 맞대는 궁합 (일지·배우자궁)", text: spouseText },
              { title: "🐉 띠 궁합 (년지)", text: zodiacText },
              { title: "⚖️ 오행 보완", text: fillText },
                  ],
          saju1: s1,
          saju2: s2,
  };
}
