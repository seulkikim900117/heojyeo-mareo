"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { compatibility, ELEMENTS, ELEMENT_EMOJI } from "../../lib/engine.js";

// ============================================================
// 결과 페이지: URL 쿼리에서 두 사람 정보를 읽어 궁합 분석
// ============================================================

const ELEM_COLORS = ["#2e9e5b", "#f04452", "#b98a3c", "#8b95a1", "#3182f6"];
const KAKAO_JS_KEY = "2942cbcd860f6ea0778deb3c3b90d1f7";

function Pillar({ label, p }) {
if (!p) return null;
return (
<div className="pillar">
<div className="p-label">{label}</div>
<div className="p-char">{p.name}</div>
<div className="p-god">{p.tenGod}</div>
</div>
);
}

function SajuCard({ emoji, s }) {
const p = s.pillars;
const maxc = Math.max.apply(null, s.elements.count) || 1;
return (
<div className="card">
<div className="section-title">
{emoji} {s.name}
<span style={{ fontWeight: 500, fontSize: 13, color: "#8b95a1" }}>
{" "}· {s.zodiac}띠 · {s.dayMaster.stem}({s.dayMaster.element})일간 · {s.elements.strength}
</span>
</div>

<div className="pillars">
<Pillar label="시주" p={p.hour} />
<Pillar label="일주" p={p.day} />
<Pillar label="월주" p={p.month} />
<Pillar label="년주" p={p.year} />
</div>

{ELEMENTS.map((e, i) => (
<div className="elem-row" key={e}>
<span className="elem-name">{ELEMENT_EMOJI[i]} {e}</span>
<span className="elem-track">
<span
className="elem-fill"
style={{ width: (s.elements.count[i] / maxc) * 100 + "%", background: ELEM_COLORS[i] }}
/>
</span>
<span className="elem-count">{s.elements.count[i]}</span>
</div>
))}

<div className="mini-title">십성</div>
<div className="chips">
{Object.keys(s.tenGods.group).map((g) => (
<span className={"chip" + (s.tenGods.group[g] === 0 ? " chip-off" : "")} key={g}>
{g} {Math.round(s.tenGods.group[g] * 10) / 10}
</span>
))}
</div>

<div className="mini-title">대운 ({s.daeun.direction} · {s.daeun.startAge}세부터)</div>
<div className="daeun">
{s.daeun.list.slice(0, 6).map((d) => (
<span className="daeun-item" key={d.age}>
<b>{d.age}</b>
{d.name}
</span>
))}
</div>

<div className="mini-title">공망</div>
<p className="muted-p">{s.gongmang.branches.join(", ")}</p>

<div className="mini-title">타고난 결</div>
<p className="muted-p">{s.psychology.summary}</p>
{s.psychology.cautions.map((c) => (
<p className="muted-p" key={c}>· {c}</p>
))}
</div>
);
}

function ResultInner() {
const sp = useSearchParams();
const get = (k) => sp.get(k) || "";
const [revealed, setRevealed] = useState(false);
const [copied, setCopied] = useState(false);
  const [nowYear] = useState(() => new Date().getFullYear());

const p1 = {
name: get("n1") || "나",
gender: get("g1") || null,
year: +get("y1"), month: +get("m1"), day: +get("d1"),
hour: get("h1") === "" ? null : +get("h1"),
minute: get("mi1") === "" ? 0 : +get("mi1"),
};
const p2 = {
name: get("n2") || "그 사람",
gender: get("g2") || null,
year: +get("y2"), month: +get("m2"), day: +get("d2"),
hour: get("h2") === "" ? null : +get("h2"),
minute: get("mi2") === "" ? 0 : +get("mi2"),
};

useEffect(() => {
const t = setTimeout(() => setRevealed(true), 400);
return () => clearTimeout(t);
}, []);

useEffect(() => {
if (!KAKAO_JS_KEY || window.Kakao) return;
const s = document.createElement("script");
s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
s.onload = () => window.Kakao.init(KAKAO_JS_KEY);
document.head.appendChild(s);
}, []);

if (!p1.year || !p2.year || !p1.month || !p2.month || !p1.day || !p2.day) {
return (
<main className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
<p style={{ fontSize: 40 }}>🔮</p>
<p style={{ fontWeight: 700, marginTop: 8 }}>정보가 부족해요</p>
<p className="muted" style={{ margin: "8px 0 24px" }}>링크가 잘못되었거나 입력이 빠졌어요.</p>
<Link href="/test">
<button className="btn btn-primary">다시 입력하기</button>
</Link>
</main>
);
}

const r = compatibility(p1, p2, { nowYear: nowYear });

const share = async () => {
const url = window.location.href;
const text = "[헤어져? 말어?] " + p1.name + " ❤ " + p2.name + " 궁합 " + r.score + "점 — " + r.verdict;
if (navigator.share) {
try {
await navigator.share({ title: "헤어져? 말어?", text: text, url: url });
return;
} catch (e) {}
}
await navigator.clipboard.writeText(text + "\n" + url);
setCopied(true);
setTimeout(() => setCopied(false), 2000);
};

const shareKakao = () => {
const url = window.location.href;
if (KAKAO_JS_KEY && window.Kakao && window.Kakao.Share) {
window.Kakao.Share.sendDefault({
objectType: "text",
text: "💘 헤어져? 말어?\n" + p1.name + " ❤ " + p2.name + " 궁합 " + r.score + "점 — \"" + r.verdict + "\"",
link: { mobileWebUrl: url, webUrl: url },
});
} else {
share();
}
};

return (
<main className="wrap wrap-wide">
<div style={{ paddingTop: 40 }} className="fade-up">
<Link href="/" className="muted">← 홈으로</Link>

<div className="gauge">
<div style={{ fontSize: 15, fontWeight: 700, color: "#8b95a1" }}>
{p1.name} ❤ {p2.name}
</div>
<div className="score">
{r.score}
<small> 점</small>
</div>
<div className="gauge-track">
<div className="gauge-fill" style={{ width: revealed ? r.score + "%" : "0%" }} />
</div>
<div style={{ fontSize: 34, fontWeight: 900, marginTop: 18 }}>
{r.verdictEmoji} {r.verdict}
</div>
<p style={{ fontSize: 15, color: "#4e5968", marginTop: 8 }}>{r.verdictSub}</p>
</div>

<div style={{ textAlign: "center", marginBottom: 24 }}>
{r.goods.map((g) => (
<span className="tag tag-good" key={g}>👍 {g}</span>
))}
{r.bads.map((b) => (
<span className="tag tag-bad" key={b}>⚠️ {b}</span>
))}
</div>

{r.sections.map((sec) => (
          <div className="card card-white" key={sec.title}>
            <div className="section-title">{sec.title}</div>
            <p className="sec-text">{sec.text}</p>
          </div>
        ))}

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "28px 0 12px" }}>두 사람의 사주팔자</h2>
<SajuCard emoji="🙋" s={r.a} />
<SajuCard emoji="💘" s={r.b} />

<div style={{ marginTop: 24, display: "grid", gap: 10 }}>
<button className="btn btn-kakao" onClick={shareKakao}>카카오톡으로 공유 💬</button>
<button className="btn btn-primary" onClick={share}>
{copied ? "링크 복사 완료! ✅" : "결과 공유하기 🔗"}
</button>
<Link href="/test">
<button className="btn btn-ghost">다른 사람이랑도 해보기 👀</button>
</Link>
</div>

<p className="muted" style={{ textAlign: "center", marginTop: 40, fontSize: 11 }}>
본 결과는 전통 사주 이론을 재미로 재구성한 것입니다. 진짜 결정은 늘 두 분의 몫! 💖
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
<ResultInner />
</Suspense>
);
}
