/**
 * 학과별 / 강의별 / 학기별 통계에 공통으로 재사용하는 일반화된 표 컴포넌트
 * ------------------------------------------------------------
 * 서버 컴포넌트(상호작용 없음). 부모가 이미 문자열로 포맷팅해 넘겨준 값만
 * 표에 그대로 그린다. 정렬·검색·필터 등은 넣지 않는다(features.md 1차 범위 기준).
 *
 * 이 컴포넌트 하나를 대시보드 페이지에서 세 번 재사용해서(학과별/강의별/학기별)
 * 표를 각각 만든다(개별 표 파일 3개를 따로 만들지 않아 중복을 줄인다).
 */

/** 표 한 행. key는 React map용 고유 키, cells는 각 칸에 그대로 보여줄 문자열 배열 */
export interface StatsTableRow {
  key: string;
  cells: string[];
}

interface StatsTableProps {
  /** 표 위에 붙는 제목(예: "학과별 통계") */
  title: string;
  /** 표 헤더에 표시할 컬럼 이름 배열(예: ["학과명", "인원수", "평균 총점"]) */
  columns: string[];
  /** 표 본문에 표시할 행 배열. 비어 있으면 안내 문구를 대신 보여준다. */
  rows: StatsTableRow[];
}

export function StatsTable({ title, columns, rows }: StatsTableProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-md md:p-6">
      {/* 섹션 제목: docs/design.md 2절 "섹션 제목" 크기 */}
      <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
        {title}
      </h2>

      {rows.length === 0 ? (
        // 데이터가 없는 경우 표 대신 한글 안내 문구를 보여준다.
        <p className="mt-4 text-sm text-muted-foreground">
          등록된 데이터가 없습니다.
        </p>
      ) : (
        // 모바일 화면에서도 표 형태를 유지할 수 있도록 가로 스크롤을 허용한다.
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left">
            <thead>
              <tr className="bg-muted text-sm text-muted-foreground">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap rounded-sm px-3 py-2 font-medium"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-divider last:border-b-0"
                >
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${row.key}-${index}`}
                      className="whitespace-nowrap px-3 py-2 text-sm text-foreground"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
