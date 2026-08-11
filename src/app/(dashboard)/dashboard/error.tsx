/**
 * 대시보드 에러 화면 (Next.js 라우트 세그먼트 에러 바운더리)
 * ------------------------------------------------------------
 * `getDashboardSummary()`(src/lib/api/dashboard.ts)가 401 외의 이유(네트워크 오류,
 * 백엔드 500 등)로 실패해 예외를 던지면, Next.js가 같은 폴더의 page.tsx 대신
 * 이 컴포넌트를 보여준다. 반드시 클라이언트 컴포넌트("use client")여야 한다는
 * Next.js 규칙을 따른다.
 *
 * docs/design.md의 오류(error) 색(--destructive, --destructive-bg, --destructive-border)을
 * 사용해 "무엇이 문제인지 + 다음에 무엇을 하면 되는지"를 한글로 안내하고,
 * Next.js가 넘겨주는 reset()을 호출하는 "다시 시도하기" 버튼을 둔다.
 */
"use client";

import { useEffect } from "react";

interface DashboardErrorProps {
  /** Next.js가 넘겨주는 실제 에러 객체(디버깅용, 화면에는 노출하지 않음) */
  error: Error & { digest?: string };
  /** 이 함수를 호출하면 page.tsx를 다시 렌더링해 데이터를 다시 불러온다 */
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // 실제 원인은 개발자 콘솔에만 남기고, 화면에는 사용자가 이해하기 쉬운 한글 안내만 보여준다.
    console.error("대시보드 데이터를 불러오는 중 오류가 발생했습니다:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="w-full max-w-md rounded-xl border border-destructive-border bg-destructive-bg p-6 shadow-md">
        <p className="text-lg font-semibold text-destructive">
          대시보드 정보를 불러오지 못했습니다.
        </p>
        <p className="mt-2 text-sm text-destructive">
          잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
        </p>
      </div>

      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-2.5 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
      >
        다시 시도하기
      </button>
    </div>
  );
}
