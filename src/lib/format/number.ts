/**
 * 숫자 표시 형식을 통일해서 관리하는 공용 유틸 함수 모음
 * ------------------------------------------------------------
 * docs/specs/design.md "대시보드" 섹션 0번에서 정한 숫자 표시 규칙을 함수로 모아둔 것이다.
 * 여러 컴포넌트(요약 카드, 등급 분포, 통계 표)가 값 표시 형식을 각자
 * 다르게 하드코딩하지 않도록, 이 파일에 정의된 함수만 가져다 쓴다.
 *
 * 규칙:
 * - 점수(총점 등)류: 소수점 첫째 자리까지 표시
 * - 평점(GPA)류: 소수점 둘째 자리까지 표시
 * - 비율(percentage)류: 소수점 첫째 자리까지 + "%" 표시
 * - 인원수(studentCount, count 등)류: 정수 그대로 + "명" 단위
 *
 * 백엔드가 초기 데이터(성적 0건) 상태에서 null/undefined를 내려줄 가능성에 대비해
 * 모든 함수는 값이 비어 있으면 "0" 계열의 안전한 기본값으로 처리한다(방어적 구현).
 */

/**
 * 점수(예: 평균 총점)를 소수점 첫째 자리까지 문자열로 바꾼다.
 * @param value 점수 값(없을 수 있음)
 * @returns 예: "76.5" / 값이 없으면 "0.0"
 */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.0";
  }
  return value.toFixed(1);
}

/**
 * 평점(GPA)을 소수점 둘째 자리까지 문자열로 바꾼다.
 * @param value 평점 값(없을 수 있음)
 * @returns 예: "3.25" / 값이 없으면 "0.00"
 */
export function formatGpa(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.00";
  }
  return value.toFixed(2);
}

/**
 * 비율(%) 값을 소수점 첫째 자리까지 + "%" 기호를 붙인 문자열로 바꾼다.
 * @param value 비율 값(0~100, 없을 수 있음)
 * @returns 예: "24.5%" / 값이 없으면 "0.0%"
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.0%";
  }
  return `${value.toFixed(1)}%`;
}

/**
 * 인원수(학생 수 등)를 정수 그대로 + "명" 단위를 붙인 문자열로 바꾼다.
 * @param value 인원수 값(없을 수 있음)
 * @returns 예: "30명" / 값이 없으면 "0명"
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0명";
  }
  // 인원수는 소수점이 나올 이유가 없으므로 정수로 반올림해 표시한다.
  return `${Math.round(value).toLocaleString("ko-KR")}명`;
}

/**
 * 단순 개수(카드에 표시하는 학과 수, 강의 수 등)를 "명"/"건" 등 단위 없이
 * 천 단위 구분 쉼표만 붙여 문자열로 바꾼다.
 * @param value 개수 값(없을 수 있음)
 * @returns 예: "1,234" / 값이 없으면 "0"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }
  return Math.round(value).toLocaleString("ko-KR");
}
