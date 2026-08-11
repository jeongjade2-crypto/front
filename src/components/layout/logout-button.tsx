"use client";

/**
 * 로그아웃 버튼 컴포넌트
 * ------------------------------------------------------------
 * 상단바에 위치하는 로그아웃 버튼이다. 누르면 서버(/api/auth/logout)에
 * 로그인 쿠키 삭제를 요청하고, 완료되면 로그인 화면(/login)으로 이동한다.
 *
 * 참고: 로그아웃은 "저장/삭제"처럼 되돌리기 어려운 데이터 변경이 아니라
 * 단순히 내 로그인 상태를 끝내는 동작이라 별도의 확인창은 두지 않는다
 * (프로젝트 규칙상 확인창이 필요한 대상은 저장·삭제 동작).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // 요청 성공/실패와 관계없이 로그인 화면으로 보내고 최신 상태로 새로고침한다.
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-disabled-foreground"
    >
      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
