"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ============================================================
// 입력 페이지: 두 사람의 생년월일시 입력 → /result 로 이동
// (URL에 정보가 담기므로 결과를 링크로 공유 가능)
// ============================================================

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => thisYear - 15 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function PersonForm({ idx, emoji, value, onChange }) {
        const set = (k, v) => onChange({ ...value, [k]: v });
        return (
                  <div className="card">
                    <div className="section-title">
        {emoji} {idx === 1 ? "나" : "상대방"}
      </div>
            <label>이름 (별명도 OK)</label>
            <input
              placeholder={idx === 1 ? "예: 뚜기" : "예: 그 사람"}
                            value={value.name}
        maxLength={10}
              onChange={(e) => set("name", e.target.value)}
            />
                          <label>성별</label>
            <select value={value.gender} onChange={(e) => set("gender", e.target.value)}>
                            <option value="">선택해 주세요</option>
              <option value="F">여자</option>
              <option value="M">남자</option>
                    </select>
            <label>생년월일 (양력)</label>
            <div className="row3">
                            <select value={value.year} onChange={(e) => set("year", e.target.value)}>
                <option value="">년</option>
{YEARS.map((y) => (
                  <option key={y} value={y}>
      {y}년
      </option>
                     ))}
</select>
        <select value={value.month} onChange={(e) => set("month", e.target.value)}>
                <option value="">월</option>
{MONTHS.map((m) => (
                  <option key={m} value={m}>
      {m}월
      </option>
                      ))}
</select>
        <select value={value.day} onChange={(e) => set("day", e.target.value)}>
                <option value="">일</option>
{DAYS.map((d) => (
                  <option key={d} value={d}>
      {d}일
      </option>
                    ))}
</select>
      </div>
      <label>태어난 시간 (진태양시 보정 적용)</label>
      <div className="row2">
              <select value={value.hour} onChange={(e) => set("hour", e.target.value)}>
                <option value="">몰라요</option>
{HOURS.map((h) => (
                  <option key={h} value={h}>
      {String(h).padStart(2, "0")}시
      </option>
          ))}
</select>
        <select
          value={value.minute}
          onChange={(e) => set("minute", e.target.value)}
          disabled={value.hour === ""}
        >
{MINUTES.map((m) => (
                  <option key={m} value={m}>
      {String(m).padStart(2, "0")}분
      </option>
          ))}
</select>
                </div>
                </div>
  );
}

const empty = { name: "", gender: "", year: "", month: "", day: "", hour: "", minute: "0" };

export default function TestPage() {
        const router = useRouter();
        const [p1, setP1] = useState(empty);
        const [p2, setP2] = useState(empty);
        const [err, setErr] = useState("");

  const submit = () => {
            for (const [p, who] of [
                        [p1, "나"],
                        [p2, "상대방"],
                      ]) {
                        if (!p.year || !p.month || !p.day) {
                                      setErr(`"${who}"의 생년월일을 모두 선택해 주세요!`);
                                      return;
                        }
                        if (!p.gender) {
                                      setErr(`"${who}"의 성별을 선택해 주세요!`);
                                      return;
                        }
            }
            const q = new URLSearchParams({
                        n1: p1.name || "나",
                        g1: p1.gender,
                        y1: p1.year,
                        m1: p1.month,
                        d1: p1.day,
                        h1: p1.hour,
                        mi1: p1.hour === "" ? "" : p1.minute || "0",
                        n2: p2.name || "그 사람",
                        g2: p2.gender,
                        y2: p2.year,
                        m2: p2.month,
                        d2: p2.day,
                        h2: p2.hour,
                        mi2: p2.hour === "" ? "" : p2.minute || "0",
            });
            router.push(`/result?${q.toString()}`);
  };

  return (
            <main className="wrap">
              <div style={{ paddingTop: 40 }} className="fade-up">
              <Link href="/" className="muted">
                ← 홈으로
      </Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "16px 0 6px" }}>
          두 사람의 정보를 알려주세요
                </h1>
        <p style={{ fontSize: 14, color: "#8b95a1", marginBottom: 24 }}>
          시간까지 알면 정확도가 올라가요. 입력한 정보는 서버에 저장되지 않습니다.
                </p>

        <PersonForm idx={1} emoji="🙋" value={p1} onChange={setP1} />
                        <PersonForm idx={2} emoji="💘" value={p2} onChange={setP2} />

          {err && (
                          <p style={{ color: "#f04452", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
{err}
</p>
        )}

        <button className="btn btn-primary" onClick={submit}>
                        궁합 결과 보기 🔮
              </button>
              </div>
              </main>
  );
}
