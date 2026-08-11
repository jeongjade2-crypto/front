/**
 * 대시보드 관련 타입 정의 파일
 * ------------------------------------------------------------
 * docs/specs/design.md "대시보드" 섹션에서 확인한 실제 백엔드 API
 * (`GET /dashboard/summary`)의 응답 형식을 그대로 옮겨 적은 타입들이다.
 * 이 파일은 타입만 정의하며, 실제로 API를 호출하지는 않는다.
 */

/** 등급별 분포 항목 (예: A+ 등급 12명, 전체의 24.5%) */
export interface GradeDistributionItem {
  /** 등급명 (예: "A+", "A", "B+" 등) */
  grade: string;
  /** 해당 등급을 받은 인원수 */
  count: number;
  /** 전체 대비 비율(%). 예: 24.5 */
  percentage: number;
}

/** 학과별 통계 항목 */
export interface DepartmentStatItem {
  /** 학과명 (예: "컴퓨터공학과") */
  departmentName: string;
  /** 해당 학과의 성적이 등록된 학생 수 */
  studentCount: number;
  /** 해당 학과의 평균 총점 */
  averageTotalScore: number;
}

/** 강의별 통계 항목 */
export interface LectureStatItem {
  /** 강의명 (예: "자료구조") */
  lectureName: string;
  /** 학기 코드 (예: "2610", 가공 없이 원본 그대로 표시) */
  term: string;
  /** 해당 강의를 수강하고 성적이 등록된 학생 수 */
  studentCount: number;
  /** 해당 강의의 평균 총점 */
  averageTotalScore: number;
}

/** 학기별 통계 항목 */
export interface TermStatItem {
  /** 학기 코드 (예: "2610", 가공 없이 원본 그대로 표시) */
  term: string;
  /** 해당 학기의 성적이 등록된 학생 수 */
  studentCount: number;
  /** 해당 학기의 평균 총점 */
  averageTotalScore: number;
}

/**
 * `GET /dashboard/summary` 응답 전체 타입
 * - 요약 카드(학과/강의/성적 건수, 평균 총점, 평균 평점) + 등급 분포 + 학과/강의/학기별 통계
 */
export interface DashboardSummary {
  /** 등록된 학과 수 */
  totalDepartments: number;
  /** 등록된 강의 수 */
  totalLectures: number;
  /** 등록된 성적 건수 */
  totalStudentScores: number;
  /** 전체 성적의 평균 합계점수 */
  averageTotalScore: number;
  /** 전체 평균 평점(GPA, 4.5 만점) */
  averageGpa: number;
  /** 등급별 분포 배열 */
  gradeDistribution: GradeDistributionItem[];
  /** 학과별 통계 배열 */
  departmentStats: DepartmentStatItem[];
  /** 강의별 통계 배열 */
  lectureStats: LectureStatItem[];
  /** 학기별 통계 배열 */
  termStats: TermStatItem[];
}
