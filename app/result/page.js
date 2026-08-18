"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { analyzeGunghap } from "../../lib/gunghap";
import { pillarText, ELEMENTS, ELEMENT_EMOJI } from "../../lib/saju";

// ============================================================
// 결과 페이지: URL 쿼리에서 두 사람 정보를 읽어 궁합 분석
// → URL 자체가 결과 공유 링크가 됨
// ============================================================

const ELEM_COLORS = ["#2e9e5b", "#f04452", "#b98a3c", "#8b95a1", "#3182f6"]; // 목화토금수
const KAKAO_JS_KEY = "2942cbcd860f6ea0778deb3c3b90d1f7"; // developers.kakao.com JavaScript 키
function SajuCard({ title, saju, name }) {
        const p = saju.pillars;
        const total = saju.elements.reduce((a, b) => a + b, 0);
        return (
                  <div className="card">
                    <div className="section-title">
        {title} {name}
        <span style={{ fontWeight: 500, fontSize: 13, color: "#8b95a1" }}>
{" "}
          · {saju.zodiac}띠
                </span>
                </div>
      <div className="pillars">
          {[
                          ["시주", p.hour],
                          ["일주", p.day],
                          ["월주", p.month],
                          ["년주", p.year],
                        ].map(([label, pillar]) => (
                                        <div className="pillar" key={label}>
                                          <div className="p-label">{label}</div>
                                          <div className="p-char">{pillar ? pillarText(pillar) : "?"}</div>
                              </div>
                                      ))}
                </div>
      <div style={{ marginTop: 14 }}>
{ELEMENTS.map((el, i) => (
                <div className="elem-row" key={el}>
                  <span className="elem-name">
{ELEMENT_EMOJI[i]} {el}
</span>
            <div className="elem-track">
                    <div
                className="elem-fill"
                style={{
                                        width: `${(saju.elements[i] / Math.max(total, 1)) * 100}%`,
                                        background: ELEM_COLORS[i],
                }}
              />
                    </div>
            <span className="elem-count">{saju.elements[i]}</span>
                    </div>
        ))}
              </div>
              </div>
  );
}

function ResultBody() {
        const sp = useSearchParams();
        const [copied, setCopied] = useState(false);
        const [revealed, setRevealed] = useState(false);

  const get = (k) => sp.get(k) ?? "";
        const p1 = {
                  name: get("n1"),
                gender: get("g1") || null,
                  year: +get("y1"),
                  month: +get("m1"),
                  day: +get("d1"),
                  hour: get("h1") === "" ? null : +get("h1"),
                  minute: get("mi1") === "" ? 0 : +get("mi1"),
                  unknownTime: get("h1") === "",
        };
        const p2 = {
                  name: get("n2"),
                gender: get("g2") || null,
                  year: +get("y2"),
                  month: +get("m2"),
                  day: +get("d2"),
                  hour: get("h2") === "" ? null : +get("h2"),
                  minute: get("mi2") === "" ? 0 : +get("mi2"),
                  unknownTime: get("h2") === "",
        };

  useEffect(() => {
            const t = setTimeout(() => setRevealed(true), 400);
            return () => clearTimeout(t);
  }, []);
        useEffect(() => { if (!KAKAO_JS_KEY || window.Kakao) return; const s = document.createElement("script"); s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"; s.onload = () => window.Kakao.init(KAKAO_JS_KEY); document.head.appendChild(s); }, []); // 카카오 SDK 로드

  if (!p1.year || !p2.year || !p1.month || !p2.month || !p1.day || !p2.day) {
            return (
                        <main className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
              <p style={{ fontSize: 40 }}>🤷</p>
        <p style={{ fontWeight: 700, marginTop: 8 }}>정보가 부족해요</p>
        <p className="muted" style={{ margin: "8px 0 24px" }}>
          링크가 잘못되었거나 입력이 빠졌어요.
                </p>
        <Link href="/test">
                          <button className="btn btn-primary">다시 입력하기</button>
                </Link>
                </main>
    );
}

  const r = analyzeGunghap(p1, p2);

  const share = async () => {
            const url = window.location.href;
            const text = `[헤어져? 말어?] ${p1.name} ❤ ${p2.name} 궁합 ${r.score}점 — "${r.verdict}"`;
            if (navigator.share) {
                        try {
                                      await navigator.share({ title: "헤어져? 말어?", text, url });
                                      return;
                        } catch {}
            }
            await navigator.clipboard.writeText(`${text}\n${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
  };
const shareKakao = () => { const url = window.location.href; if (KAKAO_JS_KEY && window.Kakao && window.Kakao.Share) { window.Kakao.Share.sendDefault({ objectType: "text", text: '💘 헤어져? 말어?\n' + p1.name + ' ❤ ' + p2.name + ' 궁합 ' + r.score + '점 — "' + r.verdict + '"', link: { mobileWebUrl: url, webUrl: url } }); } else { share(); } };

  return (
            <main className="wrap">
              <div style={{ paddingTop: 40 }} className="fade-up">
                <Link href="/" className="muted">
                  ← 홈으로
        </Link>

        <div className="gauge">
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#8b95a1" }}>
{p1.name} ❤ {p2.name}
</div>
          <div className="score">
{r.score}
            <small> 점</small>
      </div>
          <div className="gauge-track">
                  <div
              className="gauge-fill"
              style={{ width: revealed ? `${r.score}%` : "0%" }}
            />
                  </div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 18 }}>
{r.verdictEmoji} {r.verdict}
</div>
          <p style={{ fontSize: 15, color: "#4e5968", marginTop: 8 }}>
{r.verdictSub}
</p>
      </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
{r.goods.map((g) => (
                  <span className="tag tag-good" key={g}>
                    👍 {g}
 </span>
           ))}
{r.bads.map((b) => (
                  <span className="tag tag-bad" key={b}>
                    ⚠️ {b}
 </span>
           ))}
</div>

{r.sections.map((s) => (
                <div className="card card-white" key={s.title}>
            <div className="section-title">{s.title}</div>
             <p style={{ fontSize: 14.5, color: "#4e5968" }}>{s.text}</p>
      </div>
        ))}

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "28px 0 12px" }}>
          두 사람의 사주팔자
                </h2>
        <SajuCard title="🙋" saju={r.saju1} name={p1.name} />
        <SajuCard title="💘" saju={r.saju2} name={p2.name} />

        <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
                  <button className="btn btn-kakao" onClick={shareKakao}>카카오톡으로 공유 💬</button>
          <button className="btn btn-primary" onClick={share}>
          {copied ? "링크 복사 완료! ✅" : "결과 공유하기 🔗"}
</button>
          <Link href="/test">
                  <button className="btn btn-ghost">다른 사람이랑도 해보기 👀</button>
      </Link>
      </div>

        <p
          className="muted"
          style={{ textAlign: "center", marginTop: 40, fontSize: 11 }}
        >
          본 결과는 전통 사주 이론을 재미로 재구성한 것입니다. 진짜 결정은 늘 두
          분의 몫! 💖
                </p>
                </div>
                </main>
  );
}

export default function ResultPage() {
        return (
                  <Suspense
            fallback={
                          <main className="wrap" style={{ paddingTop: 120, textAlign: "center" }}>
          <p style={{ fontSize: 40 }}>🔮</p>
          <p style={{ fontWeight: 700 }}>사주 뽑는 중...</p>
      </main>
}
    >
      <ResultBody />
          </Suspense>
  );
}
