/**
 * 로그인 관련 공통 상수
 * ------------------------------------------------------------
 * `src/lib/auth/session.ts`(Route Handler·서버 컴포넌트 전용)와
 * `src/proxy.ts`(Next.js 16 proxy) 양쪽에서 같은 쿠키 이름을 써야 하는데,
 * session.ts는 `next/headers`의 `cookies()`를 사용해 요청 컨텍스트 안에서만 동작한다.
 * proxy.ts는 `request.cookies`로 직접 쿠키를 읽으므로 `next/headers`를 가져올 필요가
 * 없다. 그래서 두 파일이 공통으로 참조하는 값(쿠키 이름)만 이 파일로 분리해 둔다.
 */

/** 로그인 상태를 나타내는 쿠키 이름 (값은 백엔드가 내려준 accessToken 문자열) */
export const SESSION_COOKIE_NAME = "session";
