/**
 * 로그인 페이지 (경로: /login)
 * ------------------------------------------------------------
 * docs/design.md 3-3절 규칙대로 사이드바/상단바 없이 화면 중앙에 카드 형태로 배치한다.
 * 모바일에서는 카드 폭 100%(좌우 여백 px-4), PC에서는 카드 최대 폭 max-w-sm으로 중앙 정렬한다.
 *
 * 이미 로그인된 상태(로그인 쿠키가 있는 상태)로 이 페이지에 접근하면,
 * 다시 로그인할 필요가 없으므로 바로 /dashboard로 이동시킨다.
 */
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionToken } from "@/lib/auth/session";

export default async function LoginPage() {
  // 이미 로그인되어 있으면(쿠키 존재) 로그인 화면을 보여줄 필요 없이 대시보드로 보낸다.
  const sessionToken = await getSessionToken();
  if (sessionToken) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        {/* 서비스 이름과 안내 문구 — 설명서 없이도 무슨 화면인지 바로 알 수 있도록 한다. */}
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            성적관리 시스템
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            아이디와 비밀번호를 입력해 로그인해 주세요.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
