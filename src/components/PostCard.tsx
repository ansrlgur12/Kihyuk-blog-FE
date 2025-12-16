import { useNavigate } from "react-router-dom";
import type { Posts } from "../types";
import { API_BASE_URL } from "../lib/api";
import { LuEye } from "react-icons/lu";

export const PostCard = ({ post }: { post: Posts }) => {

    const navigate = useNavigate();

    return (
        <div
            className="cursor-pointer bg-white shadow-sm overflow-hidden w-full md:w-[calc((100%-1*1.5rem)/2)] lg:w-[calc((100%-3*1.5rem)/4)] flex flex-col min-h-[400px] md:min-h-0"
            onClick={() => {
                navigate(`/detail/${post.post_id}`);
            }}
        >
            {post.post_thumbnail && post.post_thumbnail !== 'noimage' ? (
                <img
                    className="w-full h-48 object-cover flex-shrink-0"
                    src={post.post_thumbnail}
                    alt={post.post_title}
                />
            ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400">No Image</span>
                </div>
            )}

            <div className="p-4 flex flex-col flex-1">
                <h2 className="text-base font-bold mb-2 line-clamp-2 text-left">{post.post_title}</h2>

                {/* 컨텐츠 미리보기 */}
                {post.post_content ? (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-3 text-left min-h-[4rem]">
                        {post.post_content.replace(/[#*`]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').substring(0, 100)}...
                    </p>
                ) : (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-3 text-left min-h-[4rem]"></p>
                )}

                {/* 날짜와 댓글 수 */}

                <div className="text-xs text-gray-400 mb-3 text-left flex justify-between">
                    {post.post_created_at ? new Date(post.post_created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '날짜 없음'}


                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <LuEye /> {post.post_view}
                    </span>
                </div>


                {/* 작성자 정보 */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full">
                            {post.author?.user_image ? (
                                <img
                                    src={API_BASE_URL + post.author?.user_image}
                                    alt={post.author?.user_nickname}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                        </div>
                        <p className="text-xs text-gray-500">by {post.author?.user_nickname || post.user_nickname}</p>
                    </div>
                    {(post as any).like_count !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>❤</span>
                            <span>{(post as any).like_count}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}