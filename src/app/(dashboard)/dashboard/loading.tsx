/**
 * 대시보드 로딩 화면 (Next.js 라우트 세그먼트 규칙)
 * ------------------------------------------------------------
 * 같은 폴더의 page.tsx(서버 컴포넌트)가 `GET /dashboard/summary`를
 * 호출해 데이터를 가져오는 동안, Next.js가 자동으로 이 화면을 대신 보여준다.
 * 실제 화면(요약 카드 5개 + 등급 분포 + 통계 표 3개)과 비슷한 배치로
 * 회색 스켈레톤(bg-muted 사각형에 animate-pulse)을 두어, 무엇이 로딩 중인지
 * 사용자가 짐작할 수 있게 한다.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8" aria-busy="true" aria-live="polite">
      {/* 페이지 제목 자리 */}
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted md:h-9 md:w-40" />

      {/* 요약 카드 5개 자리 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border bg-card p-4 shadow-md md:p-6"
          >
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="mt-3 h-6 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* 등급 분포 자리 */}
      <div className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-md md:p-6">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-3 w-full rounded-full bg-muted" />
          ))}
        </div>
      </div>

      {/* 통계 표 3개 자리 */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-md md:p-6"
        >
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="mt-4 h-32 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
