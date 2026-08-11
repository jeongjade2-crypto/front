/**
 * 대시보드 요약 카드 5개를 그리는 컴포넌트
 * ------------------------------------------------------------
 * 서버 컴포넌트(상호작용 없음). 부모(대시보드 페이지)로부터 `DashboardSummary`를
 * props로 받아 그 값만 그대로 화면에 보여준다. 별도로 API를 호출하지 않는다.
 *
 * docs/specs/design.md "대시보드" 섹션 ③-4번 설계대로 다음 순서로 카드 5개를 보여준다:
 * ① 등록 학과 수 ② 등록 강의 수 ③ 등록 성적 건수 ④ 평균 총점 ⑤ 평균 평점(4.5 만점)
 *
 * 색상·글자 크기·모서리·그림자·여백 값은 docs/design.md 카드 스타일 규칙을 그대로
 * 따르며, 값을 직접 하드코딩하지 않고 globals.css에 정의된 Tailwind 유틸리티
 * 클래스(bg-card, border-border, text-muted-foreground 등)만 사용한다.
 */
import { formatGpa, formatNumber, formatScore } from "@/lib/format/number";
import type { DashboardSummary } from "@/types/dashboard";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

/** 카드 하나의 내용(제목, 값, 보조 설명)을 표현하는 내부 타입 */
interface SummaryCardItem {
  /** 카드 이름(무엇을 의미하는 값인지 알려주는 한글 이름) */
  label: string;
  /** 화면에 크게 보여줄 값(이미 포맷 함수로 문자열로 변환된 값) */
  value: string;
  /** 값 아래에 작게 덧붙일 보조 설명(선택) */
  helperText?: string;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  // 카드에 표시할 값들을 순서대로 정리한다.
  // 값이 0이어도(예: 초기 상태) "0"을 그대로 보여주는 것을 기본 방침으로 한다
  // (docs/specs/design.md 확인 필요 사항 반영: 우선 "0" 그대로 표시).
  const cards: SummaryCardItem[] = [
    {
      label: "등록 학과 수",
      value: formatNumber(summary.totalDepartments),
    },
    {
      label: "등록 강의 수",
      value: formatNumber(summary.totalLectures),
    },
    {
      label: "등록 성적 건수",
      value: formatNumber(summary.totalStudentScores),
    },
    {
      label: "평균 총점",
      value: formatScore(summary.averageTotalScore),
    },
    {
      label: "평균 평점",
      value: formatGpa(summary.averageGpa),
      helperText: "4.5 만점 기준",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-4 shadow-md md:p-6"
        >
          {/* 카드 이름: 보조 설명 크기(2절 5단계) */}
          <p className="text-sm text-muted-foreground">{card.label}</p>
          {/* 카드 값: 눈에 띄도록 크게 강조(2절 1단계 다음가는 크기) */}
          <p className="mt-2 text-2xl font-bold text-foreground">
            {card.value}
          </p>
          {card.helperText && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {card.helperText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
