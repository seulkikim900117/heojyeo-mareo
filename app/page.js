import Link from "next/link";

// ============================================================
// 랜딩 페이지
// ============================================================
export default function Home() {
  return (
    <main className="wrap">
      <div style={{ paddingTop: 90, textAlign: "center" }} className="fade-up">
        <div style={{ fontSize: 64 }}>💔</div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: -1.5,
            lineHeight: 1.25,
            marginTop: 8,
          }}
        >
          헤어져? <span style={{ color: "#3182f6" }}>말어?</span>
        </h1>
        <p style={{ marginTop: 14, fontSize: 17, color: "#4e5968" }}>
          싸울 때마다 고민되죠.
          <br />
          800년 전통 사주 궁합으로
          <br />
          <b>둘의 케미를 팩트체크</b>해 드립니다.
        </p>
      </div>

      <div style={{ marginTop: 44 }} className="fade-up">
        <div className="card">
          <div className="section-title">🔮 이렇게 봐드려요</div>
          <p style={{ fontSize: 14, color: "#4e5968" }}>
            두 사람의 생년월일시로 사주팔자를 뽑아서 —
          </p>
          <p style={{ fontSize: 14, color: "#4e5968", marginTop: 8 }}>
            <b>성격 케미</b> (일간 궁합) · <b>살 맞대는 궁합</b> (배우자궁) ·{" "}
            <b>띠 궁합</b> · <b>오행 보완</b>까지 네 가지 각도로 분석하고, 마지막에
            사주가 직접 판정을 내립니다.
          </p>
        </div>

        <div className="card" style={{ background: "#e8f3ff" }}>
          <div className="section-title">💬 판정 예시</div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>
            "절대 말어!! 💍" &nbsp;부터&nbsp; "도망쳐!!! 🏃" &nbsp;까지
          </p>
          <p style={{ fontSize: 13, color: "#4e5968", marginTop: 6 }}>
            결과는 링크로 만들어져서 상대방한테 바로 보낼 수 있어요. (보낼지 말지는
            점수 보고 결정하세요)
          </p>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Link href="/test">
          <button className="btn btn-primary">우리 궁합 보러 가기</button>
        </Link>
        <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
          로그인 없음 · 무료 · 입력한 정보는 저장되지 않아요
        </p>
      </div>

      <p
        className="muted"
        style={{ textAlign: "center", marginTop: 60, fontSize: 11 }}
      >
        본 서비스는 재미를 위한 것으로, 실제 연애/결혼 결정은 두 분의 마음이
        기준입니다 🙂
      </p>
    </main>
  );
}
