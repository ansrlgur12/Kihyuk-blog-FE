import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { uploadApi } from '../api/upload';
import { userApi } from '../api/user';
import { postApi } from '../api/post';
import { API_BASE_URL } from '../lib/api';
import type { Posts } from '../types';
import { PostListItem } from '../components/PostListItem';

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
    };

    // 내 글 목록 가져오기
    useEffect(() => {
        if (activeTab === 'posts' && user?.user_id) {
            fetchMyPosts();
        }
    }, [activeTab, user?.user_id]);

    const fetchMyPosts = async () => {
        if (!user?.user_id) return;

        setIsLoadingPosts(true);
        setError('');

        try {
            const response = await postApi.getPosts({
                page: 1,
                user_id: user.user_id,
            });
            setMyPosts(response.posts || []);
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
                    <div className="bg-white rounded-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                            {/* 프로필 이미지 영역 */}
                            <div className="flex flex-col items-center sm:items-start">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4">
                                    {profileImage ? (
                                        <img
                                            src={API_BASE_URL + profileImage}
                                            alt={user.user_nickname}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg
                                            className="w-16 h-16 text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
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
                                    className="w-full px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    이미지 제거
                                </button>
                            </div>

                            {/* 닉네임 영역 */}
                            <div className="flex-1 flex">
                                <div className="w-full">
                                    {isEditingNickname ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                disabled={isLoading}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                                                placeholder="닉네임을 입력하세요"
                                            />
                                            <button
                                                onClick={handleNicknameSave}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                                            >
                                                저장
                                            </button>
                                            <button
                                                onClick={handleNicknameCancel}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold text-gray-900">{nickname}</span>
                                            <button
                                                onClick={() => setIsEditingNickname(true)}
                                                className="text-gray-600 hover:text-gray-900 transition cursor-pointer"
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
            case 'posts':
                return (
                    <div className="bg-white rounded-lg p-4 sm:p-6">
                        
                        {isLoadingPosts ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>글 목록을 불러오는 중...</p>
                            </div>
                        ) : myPosts.length > 0 ? (
                            <div className="space-y-4">
                                {myPosts.map((post) => (
                                    <PostListItem key={post.post_id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-base sm:text-lg">아직 작성한 글이 없습니다.</p>
                                <p className="text-xs sm:text-sm mt-2">첫 번째 글을 작성해보세요!</p>
                            </div>
                        )}
                    </div>
                );
            case 'temp':
                return (
                    <div className="bg-white rounded-lg p-4 sm:p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">임시저장 글</h2>
                        <p className="text-gray-500">임시저장 글 기능은 준비 중입니다.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className=" mx-auto py-8">
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

            <div className="flex gap-6">
                {/* 사이드바 */}
                <div className="w-48 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
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

