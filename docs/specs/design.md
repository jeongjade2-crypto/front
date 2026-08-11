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

8. **`src/app/(dashboard)/dashboard/page.tsx`** — 로그인 성공 시 이동할 `/dashboard` 페이지. 이번 로그인 기능 범위에서는 "대시보드입니다" 정도의 최소 내용만 두고, 실제 통계/카드 내용(실 API는 `/dashboard/summary` 등, 위 API 목록 참고)은 대시보드 기능 설계에서 채운다. *(→ 아래 "대시보드" 섹션에서 실제 내용으로 교체한다.)*

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

---

## 대시보드

### 0. 설계 전 확인 — API 계약 (확인 완료, 재조회 생략)

조정자가 Swagger(`http://lecture.s-mart.kr/api-json`)에서 직접 확인한 값을 이미 전달해주었으므로, 이번에는 WebFetch로 재확인하지 않고 그 값을 그대로 설계에 반영한다(로그인 섹션과 같은 근거).

- **엔드포인트**: `GET {NEXT_PUBLIC_API_BASE_URL}/dashboard/summary`
  - **인증 필요**: `Authorization: Bearer {accessToken}` 헤더 필수.
- **응답 (`DashboardSummaryDto`)**:
  ```json
  {
    "totalDepartments": 5,
    "totalLectures": 8,
    "totalStudentScores": 137,
    "averageTotalScore": 76.5,
    "averageGpa": 3.25,
    "gradeDistribution": [
      { "grade": "A+", "count": 12, "percentage": 24.5 }
    ],
    "departmentStats": [
      { "departmentName": "컴퓨터공학과", "studentCount": 30, "averageTotalScore": 78.24 }
    ],
    "lectureStats": [
      { "lectureName": "자료구조", "term": "2610", "studentCount": 30, "averageTotalScore": 78.24 }
    ],
    "termStats": [
      { "term": "2610", "studentCount": 120, "averageTotalScore": 76.5 }
    ]
  }
  ```
  - `gradeDistribution` / `departmentStats` / `lectureStats` / `termStats`는 모두 위 형태의 객체 배열이다. features.md "확인 필요"에 남아 있던 각 배열의 정확한 필드명은 이번 값으로 확정한다.
  - `term`(예: `"2610"`)은 백엔드가 내려주는 원본 학기 코드다. 별도 파싱·재포맷(예: "2026년 1학기") 규칙이 확인되지 않았으므로, 1차 범위(features.md ④ "그대로 나열하는 수준")에 맞춰 **가공 없이 그대로 표시**한다. 표시 형식이 필요해지면 이후 기능 확장 때 별도 변환 함수를 추가한다.
  - 숫자 표시 규칙(이 설계에서 확정, 컴포넌트에 하드코딩하지 말고 포맷 함수 하나로 통일): `averageTotalScore`류 점수는 소수점 첫째 자리까지(`toFixed(1)`), `averageGpa`는 소수점 둘째 자리까지(`toFixed(2)`), `percentage`는 소수점 첫째 자리까지(`toFixed(1)`) + `%` 표시. `studentCount`/`count`류 인원수는 정수 그대로 "명" 단위를 붙인다.

### ① 데이터를 가져오는 방식 — Route Handler(BFF) 대신 서버 컴포넌트에서 직접 호출

로그인 섹션에서 만든 `src/lib/auth/session.ts`의 `getSessionToken()`(서버 전용, `httpOnly` 쿠키에서 accessToken을 읽는 함수)이 이미 존재하므로 그대로 재사용한다.

- 대시보드는 로그인처럼 "브라우저가 보낸 값을 받아 쿠키를 새로 심어주는" 동작이 없고, 단순히 **화면을 그릴 데이터를 서버에서 읽어오는 것**뿐이다. 이 경우 브라우저와 백엔드 사이에 굳이 `/api/dashboard/summary` 같은 자체 BFF 라우트를 하나 더 두지 않고, **`src/app/(dashboard)/dashboard/page.tsx` 자체를 async 서버 컴포넌트로 만들어 그 안에서 `getSessionToken()`으로 쿠키를 읽고 백엔드 `/dashboard/summary`를 직접 호출**한다.
  - 이렇게 하면 accessToken은 여전히 서버 코드 안에서만 다뤄지고 브라우저로 내려가지 않으므로(로그인 섹션의 XSS 우려와 동일하게 안전), 불필요한 네트워크 왕복(브라우저 → Next 서버 → 백엔드) 한 단계를 줄일 수 있다.
  - 다만 재사용 가능한 형태로 쓰기 위해, 실제 호출 로직은 페이지 파일에 직접 쓰지 않고 **`src/lib/api/dashboard.ts`**라는 서버 전용 함수로 분리한다(로그인 섹션의 `src/lib/api/auth.ts`와 같은 위치·같은 네이밍 규칙이지만, 이 파일은 브라우저에서 호출하는 게 아니라 서버 컴포넌트에서만 import하는 서버 전용 코드라는 점이 다르다. 파일 맨 위 주석에 "서버 전용, 클라이언트 컴포넌트에서 import 금지"를 명시한다).
  - 매번 최신 데이터를 보여줘야 하므로(요구사항 ①: 들어오거나 새로고침하면 최신 데이터), fetch 옵션에 `cache: "no-store"`를 준다.
  - 쿠키가 없는 경우(이론상 `proxy.ts`가 먼저 `/login`으로 보내지만, 방어적으로 한 번 더 확인)나 백엔드가 401(토큰 만료/무효)을 내려주는 경우에는, `clearSessionCookie()`로 쿠키를 지우고 `/login`으로 `redirect()` 시킨다(만료된 토큰으로 계속 대시보드에 머무는 것을 방지).
  - 그 외 오류(네트워크 실패, 500 등)는 예외를 던지고, Next.js의 라우트 세그먼트 `error.tsx`(아래 7번 파일)가 받아 "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." + 다시 시도 버튼을 보여준다.
  - 향후(범위 밖) 사용자가 화면에서 직접 "새로고침" 버튼을 눌러 데이터를 다시 받아오는 등 **클라이언트 쪽 상호작용이 필요해지면 그때 `/api/dashboard/summary` BFF 라우트를 추가**한다. 현재 1차 범위(진입 시 표시만)에는 불필요하다고 판단해 만들지 않는다.

### ② 등급 분포 표현 방식 결정 (차트 라이브러리 설치 여부 판단)

- **결론: 새 차트 라이브러리를 설치하지 않는다.** `gradeDistribution` 배열의 `percentage` 값을 그대로 각 등급 막대의 `width`(%)로 사용하는 **순수 CSS(div 너비) 막대바**로 구현하고, 그 옆(또는 아래)에 등급명·인원수·비율을 표(또는 리스트) 형태로 함께 적어 features.md 요구사항("각 등급의 인원수와 전체 대비 비율을 함께 확인할 수 있어야 한다")을 만족시킨다.
- **판단 근거**:
  - 표현해야 하는 값이 "등급별 인원/비율"이라는 단순한 1차원 막대 형태 하나뿐이라, `recharts`/`chart.js` 같은 라이브러리 없이 Tailwind `w-[percentage%]` 스타일만으로 충분히 구현 가능하다.
  - 프로젝트에 현재 차트 라이브러리가 전혀 없어(package.json 확인 결과 없음), 이번에 새로 추가하면 번들 크기·의존성·유지보수 부담이 늘어난다. "패키지 대량 설치 금지" 원칙(CLAUDE.md 4번)에 비추어도, 굳이 필요하지 않은 라이브러리를 지금 들이는 것은 과함.
  - 막대 색상은 `docs/design.md` 1-3/1-4절의 "포인트 강조(accent, 단독 사용)" 색(라이트 `pink-500`, 다크 `pink-400`)을 그대로 사용해 새 색을 만들지 않는다.
- **패키지 설치 필요 여부: 필요 없음.** (참고로, 이후 `/dashboard/score-histogram`, `/dashboard/term-trend`처럼 더 복잡한 추이·분포 그래프를 만드는 별도 기능이 생기면, 그때는 막대바만으로 표현하기 어려울 수 있으므로 차트 라이브러리 설치가 필요할지 다시 판단하고, 필요하면 "패키지 설치 필요 — 사용자 확인 필요"로 명시해 사용자 승인을 받은 뒤 진행한다. 이번 1차 범위에서는 설치하지 않는다.)

### ③ 화면·파일 생성 순서

1. **`src/types/dashboard.ts`** — 대시보드 응답 타입 정의 파일. 위 ①에서 확인한 `DashboardSummaryDto` 구조를 그대로 옮겨 적는다.
   ```ts
   export interface GradeDistributionItem { grade: string; count: number; percentage: number }
   export interface DepartmentStatItem { departmentName: string; studentCount: number; averageTotalScore: number }
   export interface LectureStatItem { lectureName: string; term: string; studentCount: number; averageTotalScore: number }
   export interface TermStatItem { term: string; studentCount: number; averageTotalScore: number }
   export interface DashboardSummary {
     totalDepartments: number;
     totalLectures: number;
     totalStudentScores: number;
     averageTotalScore: number;
     averageGpa: number;
     gradeDistribution: GradeDistributionItem[];
     departmentStats: DepartmentStatItem[];
     lectureStats: LectureStatItem[];
     termStats: TermStatItem[];
   }
   ```
   사용 API: 없음(타입 정의만).

2. **`src/lib/api/dashboard.ts`** — 서버 전용 함수 `getDashboardSummary()`.
   - `getSessionToken()`(기존 `src/lib/auth/session.ts` 재사용)으로 accessToken을 읽는다. 토큰이 없으면 `redirect("/login")`.
   - `fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/summary`, { headers: { Authorization: \`Bearer ${token}\` }, cache: "no-store" })` 호출.
   - 401이면 `clearSessionCookie()` 후 `redirect("/login")`.
   - 그 외 실패(ok=false, 네트워크 예외)는 에러를 던져 8번 `error.tsx`가 처리하게 한다.
   - 성공하면 `DashboardSummary` 타입으로 파싱해 반환한다.
   - **사용 API: `GET /dashboard/summary`**

3. **`src/lib/format/number.ts`** — 위 0번에서 정한 숫자 표시 규칙(점수 소수 1자리, 평점 소수 2자리, 비율 소수 1자리+%, 인원수 "명")을 함수 몇 개(`formatScore`, `formatGpa`, `formatPercentage`, `formatCount`)로 모아둔 공용 유틸. 여러 컴포넌트(요약 카드, 등급 분포, 통계 표)가 값 표시 형식을 각자 다르게 하드코딩하지 않도록 한 곳에서 관리한다. 사용 API: 없음.

4. **`src/components/dashboard/summary-cards.tsx`** — 요약 카드 5개를 그리는 컴포넌트(서버 컴포넌트, 상호작용 없음).
   - `DashboardSummary`를 props로 받아 다음 순서로 카드 5개를 렌더링한다: ① 등록 학과 수(`totalDepartments`) ② 등록 강의 수(`totalLectures`) ③ 등록 성적 건수(`totalStudentScores`) ④ 평균 총점(`averageTotalScore`) ⑤ 평균 평점(`averageGpa`, 카드 안 작은 보조 텍스트로 "4.5 만점" 표기).
   - 각 카드는 `docs/design.md` 카드 스타일(`bg-card`, `border-border`, `shadow-md`, `rounded-xl`(`radius-md`), 내부 여백 `p-6`/모바일 `p-4`)을 따르고, 값은 3절(카드/소제목, `text-lg font-semibold`)보다 크게 강조하고 싶으면 페이지 제목 다음가는 크기(`text-2xl font-bold`)를 값에, 카드 이름은 보조 설명 크기(`text-sm text-muted-foreground`)로 위나 아래에 배치한다.
   - 값이 0인 경우도 "0"으로 그대로 보여준다(문항 확인: 성적이 0건이면 `averageTotalScore`/`averageGpa`도 0으로 내려올 것으로 예상되며, 이 경우 값 아래에 작은 보조문구로 "등록된 데이터가 없습니다"를 함께 보여줄지는 실제 초기 데이터로 확인 후 조정. 우선은 "0"을 그대로 보여주는 것을 기본값으로 한다).
   - grid 배치: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6` (`docs/design.md` 3-2절 카드 grid 규칙을 5개 카드에 맞게 확장).
   - **사용 API: 없음(부모로부터 props로 데이터를 전달받음)**

5. **`src/components/dashboard/grade-distribution.tsx`** — 등급 분포 컴포넌트.
   - `gradeDistribution: GradeDistributionItem[]`을 props로 받는다.
   - 배열이 비어 있으면 "등록된 성적이 없어 등급 분포를 보여줄 수 없습니다."(보조 텍스트 색)를 보여준다.
   - 각 등급마다 한 줄: 왼쪽에 등급명(`grade`, 예: "A+"), 가운데 막대바(배경 `bg-muted`, 채워지는 부분 `bg-accent`, 너비를 `percentage`%로 지정), 오른쪽에 "12명 (24.5%)" 형태로 인원+비율을 함께 표시한다(3번 포맷 함수 사용).
   - 카드 컨테이너에 섹션 제목 "등급 분포"를 `docs/design.md` 2절 "섹션 제목"(`text-xl md:text-2xl font-semibold`) 크기로 붙인다.
   - **사용 API: 없음(부모로부터 props로 데이터를 전달받음)**

6. **`src/components/dashboard/stats-table.tsx`** — 학과별/강의별/학기별 통계에 공통으로 재사용하는 **일반화된 표 컴포넌트**.
   - props: `title`(예: "학과별 통계"), `columns`(헤더 이름 배열, 예: `["학과명", "인원수", "평균 총점"]`), `rows`(각 행을 이미 문자열로 포맷팅해 넘긴 2차원 배열 또는 `{ key, cells }[]`).
   - 표는 features.md ④ "1차 범위: 정렬/검색/필터/그래프화 없이 그대로 나열"만 만족하면 되므로, 정렬·검색 기능은 넣지 않는다.
   - `rows`가 비어 있으면 표 대신 "등록된 데이터가 없습니다." 안내문을 보여준다.
   - `docs/design.md` 3-2절 규칙대로 표는 `overflow-x-auto`로 감싸 모바일에서 가로 스크롤을 허용한다. 표 헤더는 `bg-muted text-muted-foreground text-sm`, 본문 셀은 `text-sm` 이상(`text-xs` 금지, 2-2절 규칙).
   - 이 컴포넌트 하나를 3번 재사용해서(부모인 8번 페이지에서) 학과별/강의별/학기별 표를 각각 만든다(개별 표 파일 3개를 따로 만들지 않아 중복을 줄인다).
   - **사용 API: 없음(부모로부터 props로 데이터를 전달받음)**

7. **`src/app/(dashboard)/dashboard/page.tsx`** (기존 8번 최소 placeholder를 실제 내용으로 교체) — `/dashboard` 경로의 async 서버 컴포넌트.
   - 2번 `getDashboardSummary()`를 호출해 데이터를 받아온다.
   - 페이지 제목 "대시보드"(`docs/design.md` 2절 "페이지 제목" 크기) 아래에 순서대로 배치: 4번 요약 카드 5개 → 5번 등급 분포 → 6번 통계 표 3개("학과별 통계", "강의별 통계", "학기별 통계" 제목을 각각 붙여서). 섹션 사이 간격은 `space-y-6`~`space-y-8`(4-3절).
   - **메뉴 진입점(features.md ⑤)**: 로그인 기능 때 이미 만든 `src/app/(dashboard)/layout.tsx`의 왼쪽 사이드바(대시보드/수강과목 관리/성적관리/기준정보관리 메뉴)가 이 요구사항을 이미 충족하므로, 이번 대시보드 기능에서 새 진입점 컴포넌트를 별도로 만들지 않는다. 다만 해당 메뉴들은 아직 대상 화면이 없어 `href="#"` + "(준비 중)"으로 비활성 처리되어 있으므로, **수강과목 관리/성적관리/기준정보관리 기능이 각각 구현될 때 그 기능의 design-architect가 `layout.tsx`의 `MENU_ITEMS` 항목을 실제 경로로 갱신**해야 한다(이번 대시보드 설계 범위에는 포함하지 않음, 다음 기능 설계 시 유의 사항으로 남김).
   - **사용 API: `GET /dashboard/summary`(2번 함수 경유)**

8. **`src/app/(dashboard)/dashboard/loading.tsx`** — 위 7번 페이지가 데이터를 가져오는 동안(서버 컴포넌트 fetch 대기) Next.js가 자동으로 보여주는 로딩 화면. 카드 5개·표 3개 자리에 회색 스켈레톤(`bg-muted` 사각형, `animate-pulse`)을 배치해 "로딩 중"임을 알기 쉽게 한다. **사용 API: 없음.**

9. **`src/app/(dashboard)/dashboard/error.tsx`** — 2번 함수가 401 외의 이유(네트워크 오류, 500 등)로 실패했을 때 Next.js 라우트 세그먼트 에러 바운더리로 보여줄 클라이언트 컴포넌트. "대시보드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." 안내와 "다시 시도하기" 버튼(Next.js가 넘겨주는 `reset()` 호출)을 둔다. `docs/design.md`의 오류(error) 색(`--destructive`, `--destructive-bg`, `--destructive-border`)을 사용한다. **사용 API: 없음(재시도 시 7번 페이지가 다시 렌더링되며 2번 함수를 다시 호출).**

---

### 만들지 않는 것(이번 대시보드 기능 범위 밖)

- `/api/dashboard/summary` 같은 별도 BFF Route Handler — 위 ①의 판단에 따라 서버 컴포넌트에서 직접 호출하므로 만들지 않는다. 추후 클라이언트 상호작용(새로고침 버튼 등)이 필요해지면 그때 추가한다.
- 학과별/강의별/학기별 통계의 정렬·검색·페이지네이션·엑셀 다운로드, 클릭 시 상세 분석 화면 — features.md "범위 밖"에 명시된 대로 이번 1차 범위에 포함하지 않는다. (`/dashboard/department-achievement`, `/dashboard/lecture-difficulty`, `/dashboard/component-analysis`, `/dashboard/score-histogram`, `/dashboard/term-trend`, `/dashboard/department-lecture-matrix`, `/dashboard/student-ranking`, `/dashboard/at-risk-students` 등 그 밖의 대시보드 관련 API는 이런 상세 분석 확장 기능에서 쓰일 것으로 보이며, 이번 요약 화면 설계에는 포함하지 않는다.)
- 특정 학기/기간 필터링 — features.md에서 범위 밖(확인 필요)으로 남아 있어 포함하지 않는다.
- 차트 라이브러리 설치 — 위 ②의 판단에 따라 이번에는 설치하지 않는다.
- 수강과목 관리/성적관리/기준정보관리로 이동하는 새 진입점 UI — 기존 사이드바가 이미 담당하므로 새로 만들지 않는다(단, 해당 기능 구현 시 `layout.tsx`의 링크를 갱신해야 함을 위 7번에 남겨둠).

---

### 확인 필요 사항 (남은 것)

1. 대시보드 상단 요약 수치가 전체 기간 누적인지, 특정 학기 기준인지 — features.md에서 여전히 확인 필요. 이번 설계는 API가 별도 기간 파라미터 없이 `GET /dashboard/summary`를 그대로 호출하는 구조이므로, 우선 "백엔드가 계산해 내려주는 값을 그대로 신뢰"하는 것으로 진행한다.
2. `totalStudentScores`가 0인 초기 상태에서 `averageTotalScore`/`averageGpa`가 실제로 어떤 값(0? null?)으로 내려오는지는 실제 빈 데이터로 확인 전까지 확정할 수 없다. 프론트에서는 방어적으로 `null`/`undefined`도 "0" 또는 "데이터 없음"으로 처리할 수 있게 3번 포맷 함수에서 널 체크를 넣어 구현한다(구현 단계에서 반영).
3. `term`(예: `"2610"`) 표시 형식을 사람이 읽기 쉬운 형태로 바꿀지 여부 — 1차 범위는 원본 그대로 표시로 확정했으나, 실제 화면 확인 후 사용자(김똘미)가 알아보기 어렵다는 피드백이 있으면 이후 별도 변환 규칙을 추가한다.

