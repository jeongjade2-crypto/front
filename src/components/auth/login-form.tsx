"use client";

/**
 * 로그인 폼 컴포넌트
 * ------------------------------------------------------------
 * 아이디 입력칸, 비밀번호 입력칸, 로그인 버튼으로 구성된 클라이언트 컴포넌트다.
 *
 * 동작 순서:
 *  1) 로그인 버튼을 누르면 먼저 화면(프론트)에서 빈 칸이 있는지 검사한다.
 *     비어 있으면 서버에 요청을 보내지 않고 어떤 칸을 채워야 하는지 한글로 안내한다.
 *  2) 값이 채워졌으면 lib/api/auth.ts의 loginRequest 함수로 로그인을 요청한다.
 *  3) 성공하면 /dashboard(대시보드)로 이동한다.
 *  4) 실패하면 서버가 돌려준 한글 실패 사유와, 다음에 무엇을 하면 되는지 안내를 함께 보여준다.
 *
 * 색상/글자크기/여백 등은 모두 docs/design.md에서 정의한 Tailwind 클래스 이름만 사용하고,
 * hex 값 등을 이 파일에 직접 적지 않는다.
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginRequest } from "@/lib/api/auth";

/** 입력칸별 빈 값 안내 메시지를 담는 타입 */
interface FieldErrors {
  loginId?: string;
  password?: string;
}

/** 로그인 실패(서버 응답) 시 보여줄 메시지 타입 */
interface FormError {
  message: string;
  guide?: string;
}

export function LoginForm() {
  const router = useRouter();

  // 입력칸 값
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // 입력칸별 빈 값 안내(프론트 검증 결과)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // 서버 응답에 의한 로그인 실패 안내(아이디/비밀번호 불일치, 서버 오류 등)
  const [formError, setFormError] = useState<FormError | null>(null);
  // 로그인 요청이 진행 중일 때 버튼을 잠시 비활성화하기 위한 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 이전에 보여주던 안내 메시지는 새로 시도할 때마다 초기화한다.
    setFormError(null);

    // 1) 빈 칸 검사 — 서버에 요청을 보내기 전에 프론트에서 먼저 확인한다(완료조건).
    const nextFieldErrors: FieldErrors = {};
    if (loginId.trim().length === 0) {
      nextFieldErrors.loginId = "아이디를 입력해 주세요.";
    }
    if (password.trim().length === 0) {
      nextFieldErrors.password = "비밀번호를 입력해 주세요.";
    }
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      // 빈 칸이 있으면 여기서 멈추고 서버에는 요청을 보내지 않는다.
      return;
    }

    // 2) 값이 모두 채워졌으면 로그인 요청을 보낸다.
    setIsSubmitting(true);
    const result = await loginRequest(loginId, password);
    setIsSubmitting(false);

    if (result.success) {
      // 3) 로그인 성공 → 대시보드로 이동한다.
      router.push("/dashboard");
      // 서버 컴포넌트가 최신 로그인 쿠키 상태를 반영하도록 라우터 캐시를 갱신한다.
      router.refresh();
      return;
    }

    // 4) 로그인 실패 → 한글 실패 사유 + 다음 행동 안내를 화면에 보여준다.
    setFormError({ message: result.message, guide: result.guide });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* 서버 응답으로 인한 로그인 실패 안내 (아이디/비밀번호 불일치, 서버 오류 등) */}
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive-border bg-destructive-bg px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">{formError.message}</p>
          {formError.guide && <p className="mt-1">{formError.guide}</p>}
        </div>
      )}

      {/* 아이디 입력칸 */}
      <div className="space-y-1.5">
        <label
          htmlFor="loginId"
          className="text-sm font-medium text-foreground"
        >
          아이디
        </label>
        <input
          id="loginId"
          name="loginId"
          type="text"
          autoComplete="username"
          placeholder="아이디를 입력해 주세요"
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          aria-invalid={Boolean(fieldErrors.loginId)}
          aria-describedby={
            fieldErrors.loginId ? "loginId-error" : undefined
          }
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {fieldErrors.loginId && (
          <p id="loginId-error" className="text-sm text-destructive">
            {fieldErrors.loginId}
          </p>
        )}
      </div>

      {/* 비밀번호 입력칸 */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해 주세요"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "password-error" : undefined
          }
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* 로그인 버튼 — 요청이 진행 중일 때는 중복 클릭을 막기 위해 잠시 비활성화한다. */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-6 py-2.5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled-foreground"
      >
        {isSubmitting ? "로그인 중..." : "로그인하기"}
      </button>
    </form>
  );
}
