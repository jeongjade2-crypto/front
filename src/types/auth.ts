/**
 * 로그인 관련 타입 정의 파일
 * ------------------------------------------------------------
 * docs/specs/design.md에서 확인한 실제 백엔드 API(`POST /auth/login`)의
 * 요청/응답 형식을 그대로 옮겨 적은 타입들이다.
 * 이 파일은 타입만 정의하며, 실제로 API를 호출하지는 않는다.
 */

/**
 * 로그인 요청 body 타입
 * - loginId: 교무처 직원이 아이디 입력칸에 입력하는 값
 * - password: 교무처 직원이 비밀번호 입력칸에 입력하는 값
 */
export interface LoginRequest {
  loginId: string;
  password: string;
}

/** 로그인 성공(200) 시 백엔드가 내려주는 사용자 정보 */
export interface LoginUser {
  id: string;
  loginId: string;
  email: string;
  name: string;
}

/**
 * 로그인 성공(200) 응답 타입
 * - accessToken: 이후 다른 API 호출 시 Authorization 헤더에 담을 JWT
 *   (브라우저 자바스크립트에는 노출하지 않고, 서버(BFF)에서만 다루고
 *    httpOnly 쿠키로 저장한다)
 * - user: 상단바에 이름을 표시하는 등 화면에 사용할 로그인 사용자 정보
 */
export interface LoginResponse {
  accessToken: string;
  user: LoginUser;
}

/**
 * 로그인 실패(401 등) 시 백엔드가 내려주는 에러 응답 타입
 * - message: 이미 한글로 내려오는 실패 사유 (예: "로그인id 또는 비밀번호가 올바르지 않습니다.")
 * - error: 에러 종류(예: "Unauthorized")
 * - statusCode: HTTP 상태 코드
 */
export interface LoginErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}
