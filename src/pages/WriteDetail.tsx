import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { postApi } from "../api/post";
import type { Posts } from "../types";
import { useAuthStore } from "../store/authStore";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export function WriteDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [post, setPost] = useState<Posts>();

    useEffect(() => {
        getPost();
    }, [postId])

    const getPost = async () => {
        try {
            const rsp = await postApi.getPost(postId as string);
            if (rsp.success) {
                setPost(rsp.post);
                // console.log(rsp.post);

                window.scrollTo(0, 0);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}년 ${month}월 ${day}일`;
    }

    // 본인 글인지 확인
    const isMyPost = user && post && (post.author?.user_id === user.user_id);

    // 수정 버튼 클릭 핸들러
    const handleEdit = () => {
        if (postId) {
            navigate(`/write?postId=${postId}`);
        }
    }

    // 삭제 버튼 클릭 핸들러
    const handleDelete = async () => {
        if (!postId) return;

        if (window.confirm('정말 이 글을 삭제하시겠습니까?')) {
            try {
                const response = await postApi.deletePost(postId);
                if (response.success) {
                    alert('글이 삭제되었습니다.');
                    navigate('/');
                } else {
                    alert('글 삭제에 실패했습니다.');
                }
            } catch (error) {
                console.error('글 삭제 실패:', error);
                alert('글 삭제에 실패했습니다.');
            }
        }
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex gap-8">

                {/* 메인 콘텐츠 영역 */}
                <div className="flex-1">
                    {/* 제목 */}
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight text-left">
                        {post.post_title}
                    </h1>

                    {/* 작성자 정보 및 수정/삭제 버튼 */}
                    <div className="flex items-center justify-between mb-16">
                        <div className="flex items-center gap-3">
                            <span className="text-base text-gray-900 font-medium">
                                {post.user_nickname || post.author?.user_nickname}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-500">
                                {formatDate(post.post_created_at)}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                조회수 {post.post_view}
                            </span>
                        </div>
                        {isMyPost && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleEdit}
                                    className="text-sm text-gray-500 hover:text-gray-900 transition cursor-pointer"
                                >
                                    수정
                                </button>
                                <span className="text-gray-400">·</span>
                                <button
                                    onClick={handleDelete}
                                    className="text-sm text-gray-500 hover:text-red-600 transition cursor-pointer"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>




                    {/* 본문 콘텐츠 */}
                    <div className="prose prose-lg max-w-none text-left">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                br: () => <br />,
                                h1: ({ children }) => <h1 className="text-3xl font-bold mt-10 mb-6 text-gray-900">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-2xl font-bold mt-9 mb-5 text-gray-900">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xl font-bold mt-8 mb-4 text-gray-900">{children}</h3>,
                                h4: ({ children }) => <h4 className="text-lg font-bold mt-7 mb-4 text-gray-900">{children}</h4>,
                                p: (props: any) => {
                                    const children = props.children;
                                    if (Array.isArray(children) && children.length === 1) {
                                        const firstChild = children[0];
                                        if (firstChild && typeof firstChild === 'object' && 'type' in firstChild && firstChild.type === 'img') {
                                            return <div className="my-8 flex justify-center">{children}</div>;
                                        }
                                    }
                                    if (children && typeof children === 'object' && 'type' in children && children.type === 'img') {
                                        return <div className="my-8 flex justify-center">{children}</div>;
                                    }
                                    return <p className="mb-8 text-gray-700 leading-relaxed text-base">{children}</p>;
                                },
                                strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-8 space-y-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-8 space-y-2">{children}</ol>,
                                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-gray-300 pl-4 my-8 italic text-gray-600">
                                        {children}
                                    </blockquote>
                                ),
                                code: ({ children, className }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800 font-mono">
                                            {children}
                                        </code>
                                    ) : (
                                        <code className={className}>{children}</code>
                                    );
                                },
                                pre: ({ children }) => (
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8">
                                        {children}
                                    </pre>
                                ),
                                a: ({ href, children }) => {
                                    if (!href) return <a>{children}</a>;
                                    
                                    // 모든 링크를 외부 링크로 처리
                                    // http:// 또는 https://로 시작하지 않으면 자동으로 https:// 추가
                                    let finalHref = href;
                                    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('#')) {
                                        finalHref = `https://${href}`;
                                    }
                                    
                                    return (
                                        <a 
                                            href={finalHref} 
                                            className="text-teal-600 hover:text-teal-700 underline" 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => {
                                                // React Router가 링크를 가로채지 않도록 처리
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // 새 탭에서 열기
                                                window.open(finalHref, '_blank', 'noopener,noreferrer');
                                            }}
                                        >
                                            {children}
                                        </a>
                                    );
                                },
                                img: ({ src, alt }) => (
                                    <div className="my-8 flex justify-center">
                                        <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" />
                                    </div>
                                ),
                            }}
                        >
                            {post.post_content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

         
        </div>
    );
}