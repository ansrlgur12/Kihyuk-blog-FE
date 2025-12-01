import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import type { LoginRequest } from '../types';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { setAuth, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

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
            const loginData: LoginRequest = {
                user_email: email,
                user_password: password,
            };

            const response = await authApi.login(loginData);

            // 로그인 성공 시 스토어에 저장
            setAuth(response.accessToken, response.user);

            // 홈으로 리다이렉트
            navigate('/');
        } catch (err: any) {
            // console.log(err);
            setError(
                err.response?.data?.message ||
                '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-6 sm:space-y-8">
                    <div>
                        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
                            로그인
                        </h2>
                    </div>

                    <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-red-800">{error}</p>
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
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                    placeholder="이메일 주소를 입력하세요"
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
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-sm sm:text-base font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-xs sm:text-sm text-gray-600">
                        계정이 없으신가요?{' '}
                        <button
                            onClick={() => navigate('/signup')}
                            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                        >
                            회원가입
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

