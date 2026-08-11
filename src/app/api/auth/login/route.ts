/**
 * 로그인 대행(BFF, Backend-For-Frontend) Route Handler
 * ------------------------------------------------------------
 * 경로: POST /api/auth/login (Next.js 서버 안의 주소이므로 브라우저와 같은 출처라 CORS 문제가 없다)
 *
 * 하는 일:
 *  1) 브라우저의 로그인 폼이 이 주소로 { loginId, password }를 보낸다.
 *  2) 이 파일이 서버 쪽에서 실제 백엔드 `POST {NEXT_PUBLIC_API_BASE_URL}/auth/login`을 대신 호출한다.
 *  3) 성공(200)하면 응답의 accessToken을 httpOnly 쿠키에 저장하고, 브라우저에는
 *     user(이름 등 표시용 정보)만 돌려준다. → accessToken 자체는 브라우저 자바스크립트에
 *     절대 노출하지 않아 XSS로부터 보호한다.
 *  4) 실패(401)하면 백엔드가 내려준 한글 메시지 그대로 + 다음 행동 안내를 담아 돌려준다.
 *  5) 그 외 오류(네트워크 실패 등)는 "일시적인 오류" 안내로 감싸 돌려준다.
 *
 * 참고 문서: docs/specs/design.md ①, ②-3번
 */
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import type {
  LoginErrorResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export async function POST(request: Request) {
  // 1) 브라우저가 보낸 로그인 폼 데이터를 읽는다.
  let body: Partial<LoginRequest>;
  try {
    body = (await request.json()) as Partial<LoginRequest>;
  } catch {
    // 요청 본문이 JSON 형식이 아닌 등 잘못된 요청
    return NextResponse.json(
      { message: "로그인 요청 형식이 올바르지 않습니다. 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  const { loginId, password } = body;

  // 프론트(로그인 폼)에서도 빈 값 검사를 하지만, 서버에서도 한 번 더 방어적으로 확인한다.
  if (!loginId || !password) {
    return NextResponse.json(
      { message: "아이디와 비밀번호를 모두 입력한 뒤 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  // API 기본 주소는 반드시 환경변수로만 참조한다(코드에 직접 주소를 적지 않는다).
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    // 배포 환경설정 실수를 빠르게 알아챌 수 있도록 명확한 안내를 남긴다.
    return NextResponse.json(
      {
        message:
          "서버 설정에 문제가 있어 로그인을 진행할 수 없습니다. 관리자에게 문의해 주세요.",
      },
      { status: 500 },
    );
  }

  try {
    // 2) 서버(Next.js)가 실제 백엔드 로그인 API를 대신 호출한다.
    const backendResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password } satisfies LoginRequest),
      // 로그인 요청 결과는 매번 새로 확인해야 하므로 캐시하지 않는다.
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      // 4) 실패(주로 401): 백엔드가 내려준 한글 메시지를 그대로 사용하고, 다음 행동 안내를 덧붙인다.
      const errorBody = (await backendResponse
        .json()
        .catch(() => null)) as LoginErrorResponse | null;

      const reason =
        errorBody?.message ?? "아이디 또는 비밀번호가 올바르지 않습니다.";

      return NextResponse.json(
        {
          message: reason,
          guide: "아이디와 비밀번호를 다시 확인한 뒤 입력해 주세요.",
        },
        { status: backendResponse.status },
      );
    }

    // 3) 성공: accessToken은 httpOnly 쿠키에만 저장하고, user 정보만 브라우저로 돌려준다.
    const data = (await backendResponse.json()) as LoginResponse;
    await setSessionCookie(data.accessToken);

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch {
    // 5) 네트워크 오류 등 예상하지 못한 상황
    return NextResponse.json(
      {
        message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
}
