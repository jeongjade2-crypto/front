/**
 * 로그인 이후 화면 공통 레이아웃 (사이드바 + 상단바)
 * ------------------------------------------------------------
 * docs/specs/design.md 7번 항목: 이번 로그인 기능의 완료조건("로그인 성공 시
 * 대시보드로 이동한 화면이 실제로 보여야 함")을 만족시키기 위한 최소 뼈대다.
 * 사이드바 메뉴 상세, 상단바 디자인(사용자 이름 표시 등)은 공통 레이아웃/대시보드
 * 기능에서 별도로 설계·구현될 예정이며, 여기서는 docs/design.md 3-1/3-2절의
 * "상단바 + 사이드바 + 본문" 기본 구조만 만든다.
 *
 * 반응형: 모바일에서는 화면 폭이 좁으므로 사이드바를 숨기고 상단바 + 본문만 보여주고,
 * PC(md 이상)에서는 왼쪽에 사이드바를 항상 노출한다(디자인 문서 3-2절 반응형 기준 요약 반영).
 */
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/layout/logout-button";

/** 사이드바에 보여줄 메뉴 항목. 아직 화면이 만들어지지 않은 메뉴는 "준비 중"으로 표시한다. */
const MENU_ITEMS = [
  { label: "대시보드", href: "/dashboard", ready: true },
  { label: "수강과목 관리", href: "#", ready: false },
  { label: "성적관리", href: "#", ready: false },
  { label: "기준정보관리", href: "#", ready: false },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* 상단바: 화면 상단에 고정되고, 오른쪽에 로그아웃 버튼을 둔다. */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-topbar px-4 shadow-sm md:px-8">
        <span className="text-lg font-semibold text-foreground">
          성적관리 시스템
        </span>
        <LogoutButton />
      </header>

      <div className="flex">
        {/* 사이드바: 모바일에서는 숨기고, PC(md 이상)에서만 넓게 고정 노출한다. */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 md:block">
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.ready ? item.href : undefined}
                aria-disabled={!item.ready}
                className={
                  item.ready
                    ? "block rounded-xl px-4 py-2.5 text-base font-medium text-foreground hover:bg-accent-soft hover:text-accent-soft-foreground"
                    : "block cursor-not-allowed rounded-xl px-4 py-2.5 text-base font-medium text-disabled-foreground"
                }
              >
                {item.label}
                {!item.ready && (
                  <span className="ml-2 text-xs font-normal">(준비 중)</span>
                )}
              </a>
            ))}
          </nav>
        </aside>

        {/* 본문 콘텐츠: 화면 크기에 따라 안쪽 여백을 다르게 준다. */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
