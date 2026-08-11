/**
 * 브라우저(클라이언트 컴포넌트)에서 로그인을 요청하는 함수
 * ------------------------------------------------------------
 * 실제 백엔드(`POST /auth/login`)를 직접 호출하지 않고, Next.js 서버가 대행하는
 * BFF 라우트(`/api/auth/login`, src/app/api/auth/login/route.ts)를 호출한다.
 * 이렇게 하면 로그인 토큰(accessToken)이 브라우저 자바스크립트에 노출되지 않는다.
 */
import type { LoginUser } from "@/types/auth";

/** 로그인 성공 시 반환되는 결과 */
interface LoginSuccessResult {
  success: true;
  user: LoginUser;
}

/** 로그인 실패 시 반환되는 결과 (아이디/비밀번호 오류, 서버 오류 등 모든 실패 케이스 공통) */
interface LoginFailureResult {
  success: false;
  /** 화면에 그대로 보여줄 한글 실패 사유 */
  message: string;
  /** 실패 사유 아래에 함께 보여줄 "다음에 무엇을 하면 되는지" 안내 문구 (없을 수도 있음) */
  guide?: string;
}

export type LoginResult = LoginSuccessResult | LoginFailureResult;

/**
 * 로그인을 요청한다.
 * @param loginId 아이디 입력칸 값
 * @param password 비밀번호 입력칸 값
 * @returns 로그인 성공 여부와, 성공 시 사용자 정보 / 실패 시 한글 사유+안내
 */
export async function loginRequest(
  loginId: string,
  password: string,
): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });

    // 응답 본문은 성공/실패 모두 JSON이므로 먼저 파싱한다.
    const data = (await response.json().catch(() => null)) as
      | { user: LoginUser }
      | { message: string; guide?: string }
      | null;

    if (!response.ok || !data || !("user" in data)) {
      // 서버(BFF)가 내려준 한글 메시지를 그대로 사용하고, 값이 없으면 기본 안내로 대체한다.
      const message =
        data && "message" in data && data.message
          ? data.message
          : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      const guide = data && "guide" in data ? data.guide : undefined;

      return { success: false, message, guide };
    }

    return { success: true, user: data.user };
  } catch {
    // fetch 자체가 실패하는 경우(네트워크 단절 등)
    return {
      success: false,
      message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
