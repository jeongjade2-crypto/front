/**
 * 로그인 세션(쿠키) 공통 함수 모음 — 서버 전용 코드
 * ------------------------------------------------------------
 * 백엔드(`POST /auth/login`)가 내려주는 JWT(accessToken)를 브라우저 자바스크립트가
 * 직접 다루면 XSS 공격에 취약해질 수 있다. 그래서 이 프로젝트는 Next.js 서버가
 * 로그인을 대행(BFF)하고, 받은 토큰을 httpOnly 쿠키에 담아 브라우저에 내려주는 방식을 쓴다.
 *
 * 이 파일은 그 쿠키를 읽고/쓰고/지우는 함수만 모아둔 것으로, 반드시
 * Route Handler(`src/app/api/**\/route.ts`)나 서버 컴포넌트에서만 사용한다.
 * (브라우저에서 직접 import해서 쓰는 파일이 아니다. `next/headers`의 `cookies()`는
 *  서버 환경에서만 동작하므로, 실수로 클라이언트 컴포넌트에서 이 파일을 불러오면
 *  빌드/실행 시 바로 에러가 나 잘못된 사용을 알아챌 수 있다.)
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * 쿠키 만료(유지) 시간.
 * 백엔드 로그인 응답에 토큰 만료 시간(exp)이 별도로 내려오지 않으므로,
 * docs/specs/design.md 설계대로 우선 넉넉한 고정값(1일)으로 두고 이후 필요하면 조정한다.
 */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24시간

/**
 * 로그인 성공 시, 서버(Route Handler)에서 호출해 accessToken을 httpOnly 쿠키로 저장한다.
 * @param accessToken 백엔드 `/auth/login` 응답의 accessToken 값
 */
export async function setSessionCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true, // 브라우저 자바스크립트(document.cookie)에서 읽지 못하게 해 XSS로부터 보호
    secure: process.env.NODE_ENV === "production", // 운영 환경(HTTPS)에서만 secure 플래그를 켠다(로컬 http 개발 환경 고려)
    sameSite: "lax", // 일반적인 화면 이동에는 쿠키가 함께 전송되면서, 외부 사이트발 요청은 막는 균형잡힌 설정
    path: "/", // 사이트 전체 경로에서 이 쿠키를 사용
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * 서버(Route Handler, 서버 컴포넌트)에서 현재 로그인 쿠키(accessToken)를 읽어온다.
 * @returns 쿠키가 있으면 accessToken 문자열, 없으면 undefined
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * 로그아웃 시, 서버(Route Handler)에서 호출해 로그인 쿠키를 삭제한다.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
