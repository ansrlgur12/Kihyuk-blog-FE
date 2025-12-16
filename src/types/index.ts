// 사용자 타입
export interface User {
    user_id: number;
    user_email: string;
    user_nickname: string;
    user_image?: string;
}

// 유저 업데이트
export interface UpdateProfileRequest {
    user: User;
}

// 로그인 요청 타입
export interface LoginRequest {
    user_email: string;
    user_password: string;
}

// 회원가입 요청 타입
export interface SignupRequest {
    user_email: string;
    user_password: string;
    user_nickname: string;
}

// 인증 응답 타입 (백엔드에서 받는 응답 구조)
export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface SignupResponse {
    success: boolean;
}

export interface RefreshTokenResponse {
    accessToken: string;
}

// 포스팅 타입

export interface Post {
    post_title: string;
    post_content: string;
    post_thumbnail: string;
    post_status: string;
}

export interface Posts {
    post_id: number;
    post_title: string;
    post_content: string;
    post_thumbnail: string;
    post_status: string;
    post_created_at: string;
    user_nickname: string;
    post_view: number,
    author: {
        user_id: number,
        user_nickname: string,
        user_image: string;
    };
}

export interface PostResponse {
    success: boolean;
}

export interface TempSavePost {
    post_title: string;
    post_content: string;
    post_thumbnail: string;
    post_status: string;

}

export interface getPostsRequest {
    page: number;
    pageSize?: number;
    user_id?: number;
    sort?: string;
}

export interface getPostsResponse {
    posts: Posts[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface getPostResponse {
    post: Posts;
    success: boolean;
    message: string;
}