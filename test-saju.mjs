import { calcSaju, pillarText } from "./lib/saju.js";
import { analyzeGunghap } from "./lib/gunghap.js";

const cases = [
  // [입력, 기대 년주/월주/일주/시주]
  [{ year: 2000, month: 1, day: 1, hour: 12 }, "기묘 병자 무오 무오"],
  [{ year: 1900, month: 1, day: 1, hour: 0 }, "기해 병자 갑술 갑자"],
  [{ year: 1990, month: 8, day: 15, hour: 10 }, "경오 갑신 임자 을사"],
  [{ year: 2024, month: 2, day: 4, hour: 20 }, "갑진 병인 무술 임술"], // 입춘일
  [{ year: 1995, month: 6, day: 10, unknownTime: true }, "을해 임오 임신 ?"],
];

for (const [input, expected] of cases) {
  const s = calcSaju(input);
  const got = [s.pillars.year, s.pillars.month, s.pillars.day, s.pillars.hour]
    .map(pillarText)
    .join(" ");
  const ok = got === expected ? "OK " : "MISMATCH";
  console.log(`${ok} ${JSON.stringify(input)} => ${got} (expected ${expected})`);
}

// 궁합 스모크 테스트
const r = analyzeGunghap(
  { name: "철수", year: 1995, month: 3, day: 14, hour: 9 },
  { name: "영희", year: 1996, month: 11, day: 2, hour: 21 }
);
console.log("\n점수:", r.score, r.verdict);
console.log("goods:", r.goods);
console.log("bads:", r.bads);
for (const s of r.sections) console.log("-", s.title, "→", s.text.slice(0, 60) + "...");
