import { Header } from '../components/Header';

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 탭 메뉴 */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          <button className="pb-4 px-1 border-b-2 border-gray-900 text-sm font-medium text-gray-900">
            전체
          </button>
          <button className="pb-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
            인기
          </button>
          <button className="pb-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
            최신
          </button>
        </div>

        {/* 포스트 목록 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 포스트 카드들 - API 연동 후 동적으로 표시 */}
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">아직 작성된 글이 없습니다.</p>
            <p className="text-sm mt-2">첫 번째 글을 작성해보세요!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

