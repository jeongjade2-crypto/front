# 화면·파일 설계도

작성일: 2026-08-11
작성자: design-architect

이 문서는 `docs/specs/features.md`의 기능 명세서를 받아, 어떤 화면과 파일을 어떤 순서로 만들지 정리하는 설계도다.
색상·글자 크기·레이아웃 규칙은 이 문서에 적지 않고 `docs/design.md`(디자인 규칙 문서)를 그대로 따른다. 이 문서는 "무엇을, 어떤 순서로, 어떤 API와 함께 만들지"만 다룬다.

---

## 로그인

### 0. 설계 전 확인 — Swagger(API) 조회 결과 (확인 완료)

처음 설계 시도 시 WebFetch 도구가 `http://`를 자동으로 `https://`로 승격해 접속하는데, `lecture.s-mart.kr` 서버가 443(HTTPS) 포트를 열어두지 않아 `ECONNREFUSED`로 직접 조회에 실패했었다. 이후 **조정자가 curl로 직접 접속해 실제 API 스펙을 확보**해주었고, 아래 내용은 그 확인된 실제 값이다. 이번 로그인 기능 설계는 이 값을 기준으로 확정했다(더 이상 placeholder 아님).

**중요 — API 기본 주소 정정**
- `http://lecture.s-mart.kr/api` 는 **Swagger 문서(화면) 전용 주소**다. 실제 API 서버는 이 `/api` 경로 없이 루트에 있다.
- 실제 API 기본 주소: `http://lecture.s-mart.kr` — `.env.example`/`.env.local`의 `NEXT_PUBLIC_API_BASE_URL`도 이미 이 값으로 수정되어 있다(확인 완료).
- 전체 API JSON 스펙(향후 다른 화면 설계 시 재확인용): `http://lecture.s-mart.kr/api-json`
- 참고로 확인된 전체 API 경로 목록: `/`, `/users`, `/users/me`, `/auth/login`, `/health`, `/departments`, `/departments/{id}`, `/lectures`, `/lectures/{id}`, `/grade-scales`, `/grade-scales/convert`, `/grade-scales/{id}`, `/student-scores/upload`, `/student-scores`, `/student-scores/{id}`, `/dashboard/summary`, `/dashboard/department-achievement`, `/dashboard/lecture-difficulty`, `/dashboard/component-analysis`, `/dashboard/score-histogram`, `/dashboard/term-trend`, `/dashboard/department-lecture-matrix`, `/dashboard/student-ranking`, `/dashboard/at-risk-students` — 로그인 이후 기능(대시보드, 수강과목/과목=lectures, 성적=student-scores, 학과=departments, 학점환산기준=grade-scales) 설계 시 이 목록을 참고한다.

---

### ① 로그인 API 실제 계약 (확인 완료)

- **엔드포인트**: `POST {NEXT_PUBLIC_API_BASE_URL}/auth/login` (즉 `POST http://lecture.s-mart.kr/auth/login`)
  - 인증 불필요(로그인 자체는 토큰 없이 호출).
- **요청 body (`LoginDto`)**:
  ```json
  { "loginId": "user001", "password": "password123" }
  ```
  - `loginId`: string, 필수 (아이디 입력칸의 값)
  - `password`: string, 필수 (비밀번호 입력칸의 값)
- **성공 응답 (200, `LoginResponseDto`)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "loginId": "user001",
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
  ```
  - `accessToken`: 이후 다른 API 호출 시 `Authorization: Bearer {accessToken}` 헤더로 사용하는 JWT.
  - `user`: 로그인한 사용자 정보(상단바에 이름 표시 등에 사용 가능).
  - 응답에 토큰 만료 시간(exp)이 별도 필드로 내려오지 않으므로, 쿠키 만료 시간은 JWT 자체를 디코드해 얻거나(선택) 우선 넉넉한 고정 값(예: 1일)으로 두고 추후 조정한다.
- **실패 응답 (401, 실제 확인된 형식)**:
  ```json
  { "message": "로그인id 또는 비밀번호가 올바르지 않습니다.", "error": "Unauthorized", "statusCode": 401 }
  ```
  - `message` 필드가 이미 한글이므로, 로그인 실패 화면에서는 이 문구를 그대로 보여주고 "아이디와 비밀번호를 다시 확인한 뒤 입력해 주세요."처럼 다음 행동 안내를 한 줄 덧붙인다.
  - 아이디 없음/비밀번호 틀림을 구분하지 않고 동일한 401 + 동일 메시지로 응답하는 것으로 확인됨(보안상 일반적인 방식) — 케이스별 문구 분기는 하지 않는다.
  - 네트워크 오류·500 등 그 외 상황은 별도로 "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."로 안내한다(백엔드가 별도 형식을 내려주면 이 문서를 갱신).
- **토큰 유지 방식**: 백엔드가 세션 쿠키가 아닌 JWT를 응답 body로 내려주므로, 브라우저 자바스크립트가 토큰을 직접 다루면 XSS에 취약하다. 이 프로젝트는 **Next.js 서버의 Route Handler가 로그인을 대신 처리하고, 받은 `accessToken`을 `httpOnly` 쿠키로 브라우저에 심어주는 BFF(Backend-For-Frontend) 패턴**을 쓴다.
  - 이후 다른 화면에서 백엔드 API(예: `/lectures`, `/student-scores` 등)를 호출할 때도, 서버 쪽(Route Handler 또는 서버 컴포넌트)에서 이 쿠키를 읽어 `Authorization: Bearer {accessToken}` 헤더를 붙여 대신 호출하는 동일한 패턴을 계속 쓴다(다음 기능 설계 시에도 이 구조를 재사용).
  - `proxy.ts`(Next 16에서 `middleware.ts`를 대체하는 파일)가 이 쿠키의 존재 여부만 보고 로그인 여부를 판단해 라우트를 보호한다.
  - 새로고침해도 쿠키가 유지되므로 "로그인 유지" 완료조건도 자연스럽게 만족한다.

---

### ② 화면·파일 생성 순서

> Next.js 16에서는 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다(`node_modules/next/dist/docs/.../proxy.md` 확인). 이 프로젝트는 반드시 `proxy.ts`(함수명도 `proxy`)로 만든다. `middleware.ts`로 만들지 않는다.

1. **`src/types/auth.ts`** — 로그인 요청/응답 타입 정의 파일. `LoginRequest { loginId: string; password: string }`, `LoginResponse { accessToken: string; user: { id: string; loginId: string; email: string; name: string } }`, `LoginErrorResponse { message: string; error: string; statusCode: number }`를 그대로 옮겨 적는다. 사용 API: 없음(타입 정의만).

2. **`src/lib/auth/session.ts`** — 서버에서 로그인 쿠키(`accessToken` 저장용, 쿠키 이름 예: `session`)를 읽고/쓰고/지우는 공통 함수 모음(`httpOnly: true`, `secure`, `sameSite`, 만료시간 옵션 정의). Next.js `cookies()` 함수를 사용하는 서버 전용 코드. 사용 API: 없음.

3. **`src/app/api/auth/login/route.ts`** — 로그인 대행(BFF) Route Handler.
   - 브라우저의 로그인 폼이 이 주소(`/api/auth/login`, 같은 서버라 CORS 문제 없음)로 `{ loginId, password }`를 보낸다.
   - 이 파일이 서버 쪽에서 실제 백엔드 `POST {NEXT_PUBLIC_API_BASE_URL}/auth/login`을 호출한다(주소는 `NEXT_PUBLIC_API_BASE_URL` 환경변수 사용, 하드코딩 금지).
   - 성공(200)하면: 응답의 `accessToken`을 2번에서 만든 함수로 `httpOnly` 쿠키에 저장하고, 브라우저에는 `user`(이름 등 표시용 정보)만 돌려준다.
   - 실패(401)하면: 백엔드가 내려준 `message`("로그인id 또는 비밀번호가 올바르지 않습니다.")를 그대로 담아 "아이디와 비밀번호를 다시 확인한 뒤 입력해 주세요." 안내와 함께 브라우저로 전달한다.
   - 그 외 오류(네트워크 실패 등)는 "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."로 감싸 응답한다.
   - **사용 API: `POST /auth/login`**

4. **`src/lib/api/auth.ts`** — 브라우저(클라이언트 컴포넌트)에서 3번 라우트를 호출하는 함수 `loginRequest(loginId, password)`. fetch로 `/api/auth/login`을 호출하고 성공/실패를 구분해 반환한다. **사용 API: 3번에서 만든 자체 BFF 라우트(`/api/auth/login`)**

5. **`src/components/auth/login-form.tsx`** — 아이디 입력칸, 비밀번호 입력칸, 로그인 버튼으로 구성된 클라이언트 컴포넌트.
   - 로그인 버튼을 누르면 먼저 빈 칸이 있는지 프론트에서 검사해, 비어 있으면 서버에 요청을 보내지 않고 "아이디를 입력해 주세요" / "비밀번호를 입력해 주세요"를 한글로 안내한다(완료조건).
   - 값이 채워졌으면 4번 함수를 호출한다.
   - 성공하면 `/dashboard`로 이동한다.
   - 실패하면 3번이 돌려준 한글 실패 사유("로그인id 또는 비밀번호가 올바르지 않습니다.") + 다음 행동 안내("아이디와 비밀번호를 다시 확인한 뒤 입력해 주세요.")를 화면에 보여준다.
   - 색상/글자크기/버튼 스타일은 `docs/design.md`의 변수·클래스만 사용(하드코딩 금지).
   - **사용 API: 4번 함수 경유(`/api/auth/login` → `POST /auth/login`)**

6. **`src/app/(auth)/login/page.tsx`** — 로그인 페이지(`/login` 경로). `docs/design.md` 3-3절 규칙대로 사이드바/상단바 없이 화면 중앙에 카드 형태로 5번 컴포넌트를 배치한다(모바일 100% 폭, PC `max-w-sm` 중앙 정렬). 이미 로그인된 상태로 `/login`에 접근하면 `/dashboard`로 즉시 이동시키는 처리도 여기(또는 9번 proxy)에서 담당한다.

7. **`src/app/(dashboard)/layout.tsx`** — 로그인 이후 화면들이 공통으로 쓰는 뼈대 레이아웃(사이드바+상단바, `docs/design.md` 3-1/3-2절 구조). 이번 로그인 기능 완료조건 검증(로그인 성공 시 대시보드로 이동한 화면이 실제로 보여야 함)을 위해 최소 뼈대만 만든다. 사이드바 메뉴 항목·상단바 상세 디자인은 대시보드/공통 레이아웃 기능의 별도 설계 대상이며, 여기서는 "로그인 후 도착할 화면이 존재한다"는 정도만 책임진다.

8. **`src/app/(dashboard)/dashboard/page.tsx`** — 로그인 성공 시 이동할 `/dashboard` 페이지. 이번 로그인 기능 범위에서는 "대시보드입니다" 정도의 최소 내용만 두고, 실제 통계/카드 내용(실 API는 `/dashboard/summary` 등, 위 API 목록 참고)은 대시보드 기능 설계에서 채운다.

9. **`src/proxy.ts`** — 로그인 여부에 따라 화면 접근을 제어하는 Next.js 16 proxy 파일(구 middleware).
   - `matcher`로 `/dashboard`, `/courses`, `/grades`, `/references` 등 로그인 후 화면 전체를 지정한다(내부 화면 이름은 features.md의 메뉴 구성을 따름. 정확한 경로는 각 기능 설계 시 확정).
   - 2번에서 정한 쿠키가 없는 상태로 위 경로에 접근하면 `/login`으로 리다이렉트한다(완료조건: "로그인하지 않은 상태에서 내부 화면 직접 접근 시 로그인 화면으로 이동").
   - 쿠키가 있는 상태로 `/login`에 접근하면 `/dashboard`로 리다이렉트한다.
   - **사용 API: 없음(쿠키 존재 여부만 검사, 백엔드 호출 안 함)**

10. **`src/app/api/auth/logout/route.ts`** (이번 로그인 기능의 완료조건에는 없지만, 상단바에 로그아웃 버튼이 곧 필요해지므로 미리 자리만 잡아둔다) — 2번 쿠키 삭제 함수를 호출해 로그인 쿠키를 지우고 `/login`으로 보낸다. 확인된 API 목록에 별도 `/auth/logout` 엔드포인트가 없으므로, 백엔드 호출 없이 **쿠키만 삭제**하는 것으로 확정한다. 실제 상단바 로그아웃 버튼 연결은 공통 레이아웃 기능에서 진행. **사용 API: 없음(쿠키만 삭제)**

11. **환경변수 점검** — `.env.example`/`.env.local`의 `NEXT_PUBLIC_API_BASE_URL=http://lecture.s-mart.kr`로 이미 수정되어 있음을 확인(완료). 코드에서는 이 값을 하드코딩하지 않고 항상 이 환경변수로만 참조한다.

---

### 만들지 않는 것(이번 로그인 기능 범위 밖)

- 회원가입, 비밀번호 찾기 화면 — features.md에서 "확인 필요"로 남아 있고, 확인된 API 목록에도 회원가입/비밀번호 재설정 엔드포인트가 보이지 않으므로 이번 설계에 포함하지 않는다. (계정은 `/users` API로 이미 발급되어 있는 방식으로 추정 — 필요 시 이후 화면 설계 때 재확인)
- 사이드바 메뉴 상세, 상단바 로그인 사용자 정보 표시 UI — 공통 레이아웃/대시보드 기능에서 별도 설계.
- 로그인 화면 자체의 색상·글자크기 값 — `docs/design.md`를 그대로 참조하며 이 문서에 다시 적지 않는다.

---

### 확인 필요 사항 (남은 것 — 대부분 해소됨)

1. ~~로그인 API 정확한 경로/method~~ — 확인 완료(`POST /auth/login`).
2. ~~요청 필드명~~ — 확인 완료(`loginId`, `password`).
3. ~~성공 응답의 토큰 필드명~~ — 확인 완료(`accessToken`, 만료시간 필드는 없음 → 쿠키 만료는 임의 고정값으로 시작 후 조정).
4. ~~실패 시 에러 형식~~ — 확인 완료(`{ message, error, statusCode }`, 케이스 구분 없이 동일 401).
5. 회원가입/계정 발급 방식(웹사이트 자체 가입 지원 여부) — 여전히 확인 필요하나 이번 로그인 기능 범위 밖.
6. 로그아웃 전용 API 부재 확인됨 → 클라이언트 측 쿠키 삭제만으로 처리하는 것으로 확정(10번 항목, 추가 확인 불필요).
