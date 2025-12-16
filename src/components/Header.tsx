import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { API_BASE_URL } from '../lib/api';

export function Header() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출 (서버에서 refreshToken 쿠키 삭제)
      await authApi.logout();
    } catch (error) {
      // 로그아웃 API 실패해도 클라이언트 상태는 초기화
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // 세션 스토리지 정리
      sessionStorage.removeItem('auth_restore_attempted');
      // 클라이언트 상태 초기화
      clearAuth();
      navigate('/');
      setIsDropdownOpen(false);
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 md:px-0">
          {/* 로고 */}
          <button onClick={() => navigate('/')} className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 cursor-pointer">KH Blog</h1>
          </button>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && user ? (
              <>
                <button
                  onClick={() => navigate('/write')}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition cursor-pointer"
                >
                  <span className="hidden sm:inline">새 글 작성</span>
                  <span className="sm:hidden">작성</span>
                </button>
                <div className="relative flex items-center gap-2" ref={dropdownRef}>
                  {/* 프로필 이미지 */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user.user_image ? (
                      <img
                        src={API_BASE_URL + user.user_image}
                        alt={user.user_nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {/* 드롭다운 버튼 */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition cursor-pointer"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* 드롭다운 메뉴 */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-11 mt-2 w-48 bg-white shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          navigate('/mypage');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        마이페이지
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition cursor-pointer"
                >
                  로그인
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition cursor-pointer"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

