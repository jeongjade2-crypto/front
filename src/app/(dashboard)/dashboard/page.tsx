/**
 * 대시보드 페이지 (경로: /dashboard)
 * ------------------------------------------------------------
 * 로그인 직후 진입하는 첫 화면. async 서버 컴포넌트로 만들어, 서버 쪽에서
 * `getDashboardSummary()`(src/lib/api/dashboard.ts)를 호출해 백엔드
 * `GET /dashboard/summary`가 내려주는 데이터를 읽어와 그대로 화면에 그린다.
 *
 * docs/specs/design.md "대시보드" 섹션 ③-7번 설계에 따라
 * 페이지 제목 아래에 순서대로 배치한다:
 * 요약 카드 5개 → 등급 분포 → 학과별/강의별/학기별 통계 표 3개
 *
 * 데이터를 가져오는 동안에는 같은 폴더의 loading.tsx가, 가져오다 오류가 나면
 * error.tsx가 대신 화면을 보여준다(Next.js 라우트 세그먼트 규칙).
 */
import { GradeDistribution } from "@/components/dashboard/grade-distribution";
import { StatsTable } from "@/components/dashboard/stats-table";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { formatCount, formatScore } from "@/lib/format/number";

export default async function DashboardPage() {
  // 서버에서 대시보드 요약 데이터를 가져온다(캐시하지 않고 매번 최신 값을 조회).
  const summary = await getDashboardSummary();

  // 학과별 통계 표에 넣을 행 데이터를 미리 문자열로 포맷팅해 둔다.
  const departmentRows = summary.departmentStats.map((item, index) => ({
    key: `department-${index}-${item.departmentName}`,
    cells: [
      item.departmentName,
      formatCount(item.studentCount),
      formatScore(item.averageTotalScore),
    ],
  }));

  // 강의별 통계 표에 넣을 행 데이터를 미리 문자열로 포맷팅해 둔다.
  const lectureRows = summary.lectureStats.map((item, index) => ({
    key: `lecture-${index}-${item.lectureName}-${item.term}`,
    cells: [
      item.lectureName,
      item.term, // 학기 코드는 가공 없이 원본 그대로 표시(design.md 확정 사항)
      formatCount(item.studentCount),
      formatScore(item.averageTotalScore),
    ],
  }));

  // 학기별 통계 표에 넣을 행 데이터를 미리 문자열로 포맷팅해 둔다.
  const termRows = summary.termStats.map((item, index) => ({
    key: `term-${index}-${item.term}`,
    cells: [
      item.term,
      formatCount(item.studentCount),
      formatScore(item.averageTotalScore),
    ],
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 페이지 제목: docs/design.md 2절 "페이지 제목" 크기 */}
      <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
        대시보드
      </h1>

      {/* 요약 카드 5개: 학과 수/강의 수/성적 건수/평균 총점/평균 평점 */}
      <SummaryCards summary={summary} />

      {/* 등급 분포: 순수 CSS 막대바 + 인원/비율 텍스트 */}
      <GradeDistribution gradeDistribution={summary.gradeDistribution} />

      {/* 학과별/강의별/학기별 통계 표 (공통 표 컴포넌트 재사용) */}
      <StatsTable
        title="학과별 통계"
        columns={["학과명", "인원수", "평균 총점"]}
        rows={departmentRows}
      />
      <StatsTable
        title="강의별 통계"
        columns={["강의명", "학기", "인원수", "평균 총점"]}
        rows={lectureRows}
      />
      <StatsTable
        title="학기별 통계"
        columns={["학기", "인원수", "평균 총점"]}
        rows={termRows}
      />
    </div>
  );
}
