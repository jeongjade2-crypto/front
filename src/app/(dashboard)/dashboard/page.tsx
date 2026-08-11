/**
 * 대시보드 페이지 (경로: /dashboard)
 * ------------------------------------------------------------
 * docs/specs/design.md 8번 항목: 이번 로그인 기능 범위에서는 "로그인 성공 후
 * 이동할 화면이 실제로 존재한다"는 것만 보여주는 최소 내용만 둔다.
 * 실제 통계/카드 내용(예: /dashboard/summary 등 실제 API 연동)은
 * 대시보드 기능을 별도로 설계·구현할 때 채워 넣는다.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
        대시보드
      </h1>
      <div className="rounded-2xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success md:text-base">
        로그인에 성공했습니다. 왼쪽 메뉴에서 원하는 업무를 선택해 주세요.
      </div>
    </div>
  );
}
