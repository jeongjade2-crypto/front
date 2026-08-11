/**
 * 로그아웃 Route Handler
 * ------------------------------------------------------------
 * 경로: POST /api/auth/logout
 *
 * 확인된 백엔드 API 목록에는 별도의 로그아웃 엔드포인트가 없으므로
 * (docs/specs/design.md 10번 항목 확정 내용), 백엔드를 호출하지 않고
 * 이 서버(Next.js)에 저장해 둔 로그인 쿠키만 삭제한다.
 *
 * 상단바의 로그아웃 버튼 연결 등 실제 UI는 공통 레이아웃 기능에서 계속 다듬어질 예정이며,
 * 이번 로그인 기능에서는 쿠키 삭제 기능 자체만 미리 준비해 둔다.
 */
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "로그아웃되었습니다." }, { status: 200 });
}
