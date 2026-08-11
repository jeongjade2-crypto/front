/**
 * 등급 분포 컴포넌트
 * ------------------------------------------------------------
 * 서버 컴포넌트(상호작용 없음). 부모(대시보드 페이지)로부터 등급별 분포 배열을
 * props로 받아 그대로 보여준다. 별도로 API를 호출하지 않는다.
 *
 * docs/specs/design.md "대시보드" 섹션 ②번 결정에 따라 새 차트 라이브러리를
 * 설치하지 않고, `percentage` 값을 그대로 막대(div)의 너비(%)로 지정하는
 * 순수 CSS 막대바로 등급 분포를 표현한다. 막대 옆에 인원수/비율 텍스트를
 * 함께 표시해 features.md 요구사항("인원수와 비율을 함께 확인 가능")을 만족한다.
 */
import { formatCount, formatPercentage } from "@/lib/format/number";
import type { GradeDistributionItem } from "@/types/dashboard";

interface GradeDistributionProps {
  gradeDistribution: GradeDistributionItem[];
}

export function GradeDistribution({
  gradeDistribution,
}: GradeDistributionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-md md:p-6">
      {/* 섹션 제목: docs/design.md 2절 "섹션 제목" 크기 */}
      <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
        등급 분포
      </h2>

      {gradeDistribution.length === 0 ? (
        // 등록된 성적이 없어 등급 분포를 계산할 수 없는 경우 안내 문구를 보여준다.
        <p className="mt-4 text-sm text-muted-foreground">
          등록된 성적이 없어 등급 분포를 보여줄 수 없습니다. 성적을 먼저
          등록한 뒤 다시 확인해 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {gradeDistribution.map((item) => (
            <li
              key={item.grade}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* 왼쪽: 등급명 */}
              <span className="w-12 shrink-0 text-sm font-semibold text-foreground">
                {item.grade}
              </span>

              {/* 가운데: 막대바(배경 bg-muted, 채워지는 부분 bg-accent) */}
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  // 스크린리더 사용자를 위한 값 안내(접근성)
                  role="img"
                  aria-label={`${item.grade} 등급 ${formatCount(item.count)}, 전체의 ${formatPercentage(item.percentage)}`}
                />
              </div>

              {/* 오른쪽: 인원수 + 비율 텍스트 */}
              <span className="shrink-0 text-sm text-muted-foreground sm:w-32 sm:text-right">
                {formatCount(item.count)} ({formatPercentage(item.percentage)})
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
