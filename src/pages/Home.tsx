export function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* 탭 메뉴 */}
        <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
          <button className="pb-3 sm:pb-4 px-1 border-b-2 border-gray-900 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
            전체
          </button>
          <button className="pb-3 sm:pb-4 px-1 border-b-2 border-transparent text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
            인기
          </button>
          <button className="pb-3 sm:pb-4 px-1 border-b-2 border-transparent text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
            최신
          </button>
        </div>

        {/* 포스트 목록 영역 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 포스트 카드들 - API 연동 후 동적으로 표시 */}
          <div className="text-center py-12 sm:py-16 md:py-20 text-gray-400">
            <p className="text-base sm:text-lg">아직 작성된 글이 없습니다.</p>
            <p className="text-xs sm:text-sm mt-2">첫 번째 글을 작성해보세요!</p>
          </div>
        </div>
    </main>
  );
}

