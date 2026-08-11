/**
 * 대시보드 데이터를 가져오는 서버 전용 함수
 * ------------------------------------------------------------
 * ⚠️ 서버 전용 코드입니다. 클라이언트 컴포넌트("use client")에서 import하지 마세요.
 * 이 파일은 `next/headers`의 `cookies()`(session.ts 경유)를 사용하므로 서버 환경(서버
 * 컴포넌트, Route Handler)에서만 동작한다.
 *
 * docs/specs/design.md "대시보드" 섹션 ①번 설계에 따라, 대시보드는 로그인처럼
 * 브라우저가 보낸 값을 받아 새 쿠키를 심어주는 동작이 없고 "화면을 그릴 데이터를
 * 읽어오기만" 하므로, 별도의 `/api/dashboard/summary` BFF 라우트를 두지 않고
 * 대시보드 페이지(서버 컴포넌트)에서 이 함수를 직접 호출해 백엔드 `/dashboard/summary`를
 * 곧바로 부른다. accessToken은 항상 서버 쪽에서만 다뤄지므로 브라우저로 노출되지 않는다.
 */
import { redirect } from "next/navigation";
import { clearSessionCookie, getSessionToken } from "@/lib/auth/session";
import type { DashboardSummary } from "@/types/dashboard";

/**
 * 로그인한 직원의 accessToken으로 `GET /dashboard/summary`를 호출해
 * 대시보드에 필요한 요약 데이터를 가져온다.
 *
 * 처리 방식(docs/specs/design.md 대시보드 섹션 ③-2번 그대로):
 * - 쿠키(accessToken)가 없으면(이론상 proxy.ts가 먼저 /login으로 보내지만,
 *   방어적으로 한 번 더 확인) 즉시 /login으로 이동시킨다.
 * - 백엔드가 401(토큰 만료/무효)을 내려주면 남아있는 쿠키를 지우고 /login으로 이동시킨다.
 * - 그 외 실패(네트워크 오류, 500 등)는 예외를 던져 라우트의 error.tsx가 처리하게 한다.
 *
 * @returns 대시보드 화면에 표시할 요약 데이터
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const token = await getSessionToken();

  // 로그인 쿠키가 없으면 대시보드를 그릴 수 없으므로 로그인 화면으로 보낸다.
  if (!token) {
    redirect("/login");
  }

  // API 기본 주소는 반드시 환경변수로만 참조한다(코드에 직접 주소를 적지 않는다).
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    // 배포 환경설정 실수를 빠르게 알아챌 수 있도록 명확한 에러를 던진다.
    // (사용자에게는 error.tsx가 "일시적인 오류" 안내로 감싸서 보여준다.)
    throw new Error(
      "서버 설정에 문제가 있어 대시보드 정보를 불러올 수 없습니다.",
    );
  }

  const response = await fetch(`${apiBaseUrl}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    // 대시보드는 진입하거나 새로고침할 때마다 최신 데이터를 보여줘야 하므로 캐시하지 않는다.
    cache: "no-store",
  });

  if (response.status === 401) {
    // 토큰이 만료되었거나 더 이상 유효하지 않은 경우: 쿠키를 지우고 다시 로그인하게 한다.
    await clearSessionCookie();
    redirect("/login");
  }

  if (!response.ok) {
    // 그 외 오류(네트워크 실패, 500 등)는 라우트 세그먼트 error.tsx가 처리하도록 예외로 던진다.
    throw new Error("대시보드 정보를 불러오지 못했습니다.");
  }

  return (await response.json()) as DashboardSummary;
}
