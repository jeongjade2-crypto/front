/**
 * 로그인 여부에 따라 화면 접근을 제어하는 Next.js 16 proxy 파일 (구 middleware)
 * ------------------------------------------------------------
 * docs/specs/design.md 9번 항목 설계를 그대로 따른다.
 *
 * 하는 일 (백엔드 API는 호출하지 않고, 로그인 쿠키의 존재 여부만 검사한다):
 *  1) 로그인 쿠키(SESSION_COOKIE_NAME)가 없는 상태로 로그인 후 화면(예: /dashboard)에
 *     접근하면 /login으로 돌려보낸다. (완료조건: 로그인하지 않은 상태에서 내부 화면
 *     직접 접근 시 로그인 화면으로 이동)
 *  2) 로그인 쿠키가 있는 상태로 /login에 접근하면 /dashboard로 돌려보낸다.
 *     (이미 로그인한 사람이 다시 로그인 화면을 볼 필요는 없기 때문)
 *
 * 참고: /login 페이지 자체에서도 같은 처리를 서버 컴포넌트에서 한 번 더 하고 있지만
 * (src/app/(auth)/login/page.tsx), proxy는 페이지 렌더링 전에 더 빠르게 리다이렉트할
 * 수 있어 함께 둔다.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * 로그인해야만 들어갈 수 있는 화면들의 경로 접두사.
 * 대시보드 외 나머지(수강과목 관리/성적관리/기준정보관리)는 features.md의 메뉴 구성을
 * 미리 반영해 둔 것이며, 실제 경로는 각 기능을 설계할 때 확정한다.
 */
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/courses",
  "/grades",
  "/references",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  const isProtectedPath = PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // 1) 로그인하지 않은 상태로 내부 화면에 접근 → 로그인 화면으로 이동
  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2) 이미 로그인한 상태로 로그인 화면에 접근 → 대시보드로 이동
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/courses/:path*", "/grades/:path*", "/references/:path*", "/login"],
};
