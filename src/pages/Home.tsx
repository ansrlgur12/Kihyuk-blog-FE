import { useEffect, useState } from "react";
import { postApi } from "../api/post";
import type { Posts } from "../types";
import { PostCard } from "../components/PostCard";
import { Pagination } from "../components/Pagination";


export function Home() {

  const [posts, setPosts] = useState<Posts[]>([]);
  const [sortType, setSortType] = useState<string>('post_created_at');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = window.innerWidth > 768 ? 8 : 4; // 기본값 8

  useEffect(() => {
    getPosts();
  }, [sortType, currentPage])


  const getPosts = async () => {
    const response = await postApi.getPosts({ page: currentPage, pageSize: pageSize, sort: sortType });
    const posts: Posts[] = response.posts || [];
    setPosts(posts);
    setTotalPages(response.pagination?.totalPages || 1);
  }

  const handleSortClick = (type: string) => {
    setSortType(type);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 변경 시 상단으로 스크롤
  }

  return (
    <main className="w-full py-8 sm:py-10 md:py-12 px-4 md:px-0">
      {/* 탭 메뉴 */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => handleSortClick('post_created_at')}
          className={`pb-3 sm:pb-4 px-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
            sortType === 'post_created_at' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          전체
        </button>
        <button 
          onClick={() => handleSortClick('post_view')}
          className={`pb-3 sm:pb-4 px-1 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
            sortType === 'post_view' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          조회수
        </button>
        {/* <button className="pb-3 sm:pb-4 px-1 border-b-2 border-transparent text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
          최신
        </button> */}
      </div>

      {posts.length > 0 ? (
        <>
          <div className="flex flex-wrap items-start justify-start gap-4 md:gap-6">
            {posts.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </div>
          {/* 페이지네이션 */}
          <div className="mt-8 md:mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 sm:py-16 md:py-20 text-gray-400">
          <p className="text-base sm:text-lg">아직 작성된 글이 없습니다.</p>
          <p className="text-xs sm:text-sm mt-2">첫 번째 글을 작성해보세요!</p>
        </div>
      )}
    </main>
  );
}

