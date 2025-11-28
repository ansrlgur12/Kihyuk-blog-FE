import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import type { SignupRequest } from '../types';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { useModal } from '../hooks/useModal';

export function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const { isOpen, modalOptions, openModal, closeModal } = useModal();

    // 이미 로그인된 경우 홈으로 리다이렉트
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 정규식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,10}$/;

            if (!emailRegex.test(email)) {
                setError('올바른 이메일 형식을 입력해주세요.');
                setIsLoading(false);
                return;
            }

            if (!passwordRegex.test(password)) {
                setError('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
                setIsLoading(false);
                return;
            }

            if (!nicknameRegex.test(nickname)) {
                setError('닉네임은 2-10자의 영문, 숫자, 한글로만 입력 가능합니다.');
                setIsLoading(false);
                return;
            }

            const signupData: SignupRequest = {
                user_email: email,
                user_password: password,
                user_nickname: nickname,
            };

            await authApi.signup(signupData);

            // 회원가입 성공 시 모달 표시
            openModal({
                title: '회원가입 성공',
                message: '로그인 페이지로 이동합니다.',
                type: 'alert',
                confirmText: '확인',
                onConfirm: () => {
                    navigate('/login');
                },
            });
        } catch (err: any) {
            // 에러 발생 시 모달 표시
            openModal({
                title: '회원가입 실패',
                message: err.response?.data?.message || '회원가입에 실패했습니다. 입력 정보를 확인해주세요.',
                type: 'alert',
                confirmText: '확인',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                title={modalOptions.title}
                message={modalOptions.message}
                type={modalOptions.type}
                confirmText={modalOptions.confirmText}
                cancelText={modalOptions.cancelText}
                onConfirm={modalOptions.onConfirm}
                onCancel={modalOptions.onCancel}
            />

            <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="text-center text-3xl font-bold text-gray-900">
                            회원가입
                        </h2>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700 mb-1">
                                    이메일
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="이메일 주소를 입력하세요"
                                />
                            </div>
                            <div>
                                <label htmlFor="nickname" className="block text-left text-sm font-medium text-gray-700 mb-1">
                                    닉네임
                                </label>
                                <input
                                    id="nickname"
                                    name="nickname"
                                    type="text"
                                    autoComplete="nickname"
                                    required
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="닉네임을 입력하세요"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 mb-1">
                                    비밀번호
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isLoading ? '회원가입 중...' : '회원가입'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                        >
                            로그인
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

