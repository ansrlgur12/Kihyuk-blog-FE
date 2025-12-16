import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { uploadApi } from '../api/upload';
import { userApi } from '../api/user';
import { postApi } from '../api/post';
import { API_BASE_URL } from '../lib/api';
import type { Posts } from '../types';
import { PostListItem } from '../components/PostListItem';
import { Pagination } from '../components/Pagination';

type TabType = 'info' | 'posts' | 'temp';

export function Mypage() {
    const { user, updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // URL에서 탭 정보 읽기 (기본값: 'info')
    const getTabFromUrl = (): TabType => {
        const tab = searchParams.get('tab') as TabType;
        return tab && ['info', 'posts', 'temp'].includes(tab) ? tab : 'info';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl());
    const [nickname, setNickname] = useState(user?.user_nickname || '');
    const [profileImage, setProfileImage] = useState<string | null>(user?.user_image || null);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [myPosts, setMyPosts] = useState<Posts[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const pageSize = 4;
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);


    useEffect(() => {
        if (user) {
            setNickname(user.user_nickname);
            setProfileImage(user.user_image || null);
        }
    }, [user]);

    // URL 쿼리 파라미터 변경 감지하여 탭 상태 동기화
    useEffect(() => {
        const tabFromUrl = getTabFromUrl();
        setActiveTab(tabFromUrl);
    }, [searchParams]);

    // 탭 변경 핸들러 (URL 업데이트)
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ tab });
        setCurrentPage(1);
    };

    // 내 글 목록 가져오기
    useEffect(() => {
        if (activeTab === 'posts' && user?.user_id) {
            fetchMyPosts('posts');
        } else if (activeTab === 'temp' && user?.user_id) {
            fetchMyPosts('temp');
        }
    }, [activeTab, user?.user_id, currentPage]);

    const fetchMyPosts = async (post_status: string) => {
        if (!user?.user_id) return;

        setIsLoadingPosts(true);
        setError('');

        try {
            if (post_status === 'posts') {
                const response = await postApi.getPosts({
                    page: currentPage,
                    user_id: user.user_id,
                    pageSize: pageSize,
                });
                setMyPosts(response.posts || []);
                setTotalPages(response.pagination?.totalPages || 1);
            } else if (post_status === 'temp') {
                const response = await postApi.getTempPosts({
                    page: currentPage,
                    user_id: user.user_id,
                    pageSize: pageSize,
                });
                setMyPosts(response.posts || []);
                setTotalPages(response.pagination?.totalPages || 1);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || '글 목록을 불러오는데 실패했습니다.');
            setMyPosts([]);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // 프로필 이미지 업로드
            const uploadResponse = await uploadApi.uploadFiles('profile', [file]);

            // 응답 형태에 따라 파일 경로 추출
            let uploadedFile;
            if (Array.isArray(uploadResponse)) {
                uploadedFile = uploadResponse[0];
            } else {
                uploadedFile = uploadResponse.files[0];
            }

            const imagePath = uploadedFile.att_filepath || uploadedFile.att_path;

            if (!imagePath) {
                throw new Error('이미지 경로를 가져올 수 없습니다.');
            }

            // 프로필 업데이트 API 호출
            const updatedUser = await userApi.updateProfile({
                user_image: imagePath,
            });

            // 스토어 업데이트
            updateUser(updatedUser.user);
            setProfileImage(API_BASE_URL + updatedUser.user.user_image);
            setSuccess('프로필 이미지가 업로드되었습니다.');

            console.log(updatedUser.user);
        } catch (err: any) {
            setError(err.response?.data?.message || '이미지 업로드에 실패했습니다.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // 프로필 이미지 제거
            const updatedUser = await userApi.updateProfile({
                user_image: null,
            });

            // 스토어 업데이트
            updateUser(updatedUser.user);
            setProfileImage(null);
            setSuccess('프로필 이미지가 제거되었습니다.');
        } catch (err: any) {
            setError(err.response?.data?.message || '이미지 제거에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNicknameSave = async () => {
        // 닉네임 검증
        const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,10}$/;
        if (!nicknameRegex.test(nickname)) {
            setError('닉네임은 2-10자의 영문, 숫자, 한글로만 입력 가능합니다.');
            return;
        }

        if (nickname === user?.user_nickname) {
            setIsEditingNickname(false);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // 닉네임 업데이트
            const updatedUser = await userApi.updateNickname({
                user_nickname: nickname,
            });

            // 스토어 업데이트
            updateUser(updatedUser.user);
            setIsEditingNickname(false);
            setSuccess('닉네임이 변경되었습니다.');
        } catch (err: any) {
            setError(err.response?.data?.message || '닉네임 변경에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNicknameCancel = () => {
        setNickname(user?.user_nickname || '');
        setIsEditingNickname(false);
        setError('');
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 변경 시 상단으로 스크롤
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">로그인이 필요합니다.</p>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="bg-white rounded-lg p-6 md:p-8">
                        {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                            {/* 프로필 이미지 영역 */}
                            <div className="relative flex flex-col items-center md:items-start">
                                <div className="relative w-40 h-40 md:mb-4 md:w-48 md:h-48 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 group">
                                    {profileImage ? (
                                        <img
                                            src={API_BASE_URL + profileImage}
                                            alt={user.user_nickname}
                                            className="w-full h-full object-cover z-0"
                                        />
                                    ) : (
                                        <svg
                                            className="w-20 h-20 md:w-24 md:h-24 text-gray-400 z-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {/* 이미지 업로드 버튼 - 이미지가 없을 때만 표시 */}
                                    {!profileImage && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                                className="p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="이미지 업로드"
                                            >
                                                <svg
                                                    className="w-6 h-6 text-gray-800"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* PC: 이미지 업로드/제거 버튼 (이미지 아래) */}
                                <div className="hidden md:flex flex-col gap-2 w-full">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="w-full px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        이미지 업로드
                                    </button>
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={isLoading || !profileImage}
                                        className="w-full px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        이미지 제거
                                    </button>
                                </div>
                                {/* 모바일: 이미지 삭제 버튼 (아이콘) */}
                                {profileImage && (
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={isLoading}
                                        className="md:hidden absolute -top-1 right-20 p-1.5 bg-white border-2 border-red-500 rounded-full shadow-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed z-20"
                                        title="이미지 제거"
                                    >
                                        <svg
                                            className="w-4 h-4 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* 닉네임 영역 */}
                            <div className="flex-1 w-full flex items-center justify-center md:justify-start">
                                <div className="w-full">
                                    {isEditingNickname ? (
                                        <div className="space-y-3 text-center md:text-left">
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                disabled={isLoading}
                                                className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50"
                                                placeholder="닉네임을 입력하세요"
                                            />
                                            <div className="flex gap-2 justify-center md:justify-start">
                                                <button
                                                    onClick={handleNicknameSave}
                                                    disabled={isLoading}
                                                    className="px-5 py-2.5 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onClick={handleNicknameCancel}
                                                    disabled={isLoading}
                                                    className="px-5 py-2.5 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <span className="text-2xl md:text-3xl font-bold text-gray-900">{nickname}</span>
                                            <button
                                                onClick={() => setIsEditingNickname(true)}
                                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                                title="닉네임 수정"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-white rounded-lg p-4 sm:p-6">

                        {isLoadingPosts ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>글 목록을 불러오는 중...</p>
                            </div>
                        ) : myPosts.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {myPosts.map((post) => (
                                        <PostListItem key={post.post_id} post={post} />
                                    ))}
                                </div>
                                <div className="mt-8 md:mt-12">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-base sm:text-lg">아직 작성한 글이 없습니다.</p>
                                <p className="text-xs sm:text-sm mt-2">첫 번째 글을 작성해보세요!</p>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="w-full mx-auto py-8 px-4 md:px-0">
            {/* 에러 메시지 */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* 성공 메시지 */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}

            {/* 모바일: 상단 탭 형태 */}
            <div className="md:hidden mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <nav className="flex space-x-2">
                        <button
                            onClick={() => handleTabChange('info')}
                            className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${activeTab === 'info'
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            정보수정
                        </button>
                        <button
                            onClick={() => handleTabChange('posts')}
                            className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${activeTab === 'posts'
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            내 글 목록
                        </button>
                        <button
                            onClick={() => handleTabChange('temp')}
                            className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${activeTab === 'temp'
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            임시저장
                        </button>
                    </nav>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* 데스크톱: 사이드바 */}
                <div className="hidden md:block w-48 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                        <nav className="flex flex-col space-y-2">
                            <button
                                onClick={() => handleTabChange('info')}
                                className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'info'
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                정보수정
                            </button>
                            <button
                                onClick={() => handleTabChange('posts')}
                                className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'posts'
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                내 글 목록
                            </button>
                            <button
                                onClick={() => handleTabChange('temp')}
                                className={`text-left px-4 py-2 rounded-lg transition ${activeTab === 'temp'
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                임시저장 글
                            </button>
                        </nav>
                    </div>
                </div>

                {/* 메인 컨텐츠 */}
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

