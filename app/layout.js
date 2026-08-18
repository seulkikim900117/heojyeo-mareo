import "./globals.css";

export const metadata = {
  title: "헤어져? 말어? — 사주로 보는 연애 궁합",
  description:
    "생년월일시만 넣으면 사주팔자로 두 사람의 궁합을 분석해 드립니다. 헤어질까? 말까? 사주가 답해드림.",
  openGraph: {
    title: "헤어져? 말어?",
    description: "사주로 보는 우리 커플 궁합 테스트",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
