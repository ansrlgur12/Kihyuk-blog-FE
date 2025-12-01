import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { uploadApi } from '../api/upload';
import { API_BASE_URL } from '../lib/api';

export function Write() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(``);
    const [tempFileMap, setTempFileMap] = useState<Map<string, File>>(new Map());
    // alt/파일명으로 File 객체를 찾기 위한 Map
    const [fileByAltMap, setFileByAltMap] = useState<Map<string, File>>(new Map());
    const [isUploading, setIsUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const tempFileMapRef = useRef<Map<string, File>>(new Map());
    const navigate = useNavigate();

    // tempFileMap 변경 시 ref도 업데이트
    useEffect(() => {
        tempFileMapRef.current = tempFileMap;
    }, [tempFileMap]);

    // Write 페이지 진입 시 body 스크롤 비활성화
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalHeight = document.body.style.height;
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.height = originalHeight;
        };
    }, []);

    // content에서 모든 이미지 정보를 순서대로 배열로 저장
    const imageList = useMemo(() => {
        const list: Array<{ alt: string; url: string; fullMatch: string }> = [];
        const imageRegex = /!\[([^\]]*)\]\((blob:[^\)]+|https?:\/\/[^\)]+)\)/g;
        let match;
        while ((match = imageRegex.exec(content)) !== null) {
            list.push({
                alt: match[1],
                url: match[2],
                fullMatch: match[0] // 전체 마크다운 텍스트
            });
        }
        return list;
    }, [content]);

    // 이미지 렌더링 순서 추적
    const imageIndexRef = useRef(0);

    // content가 변경될 때마다 인덱스 리셋
    useEffect(() => {
        imageIndexRef.current = 0;
    }, [content]);

    // 이전 content 길이 및 이미지 개수 추적
    const prevContentLengthRef = useRef<number>(0);
    const prevImageCountRef = useRef<number>(0);

    // content 변경 시 스크롤 처리
    useLayoutEffect(() => {
        const previewElement = previewRef.current;
        if (!previewElement) return;

        const currentContentLength = content.length;
        const prevContentLength = prevContentLengthRef.current;

        // 내용이 추가되었는지 확인 (길이가 늘어났고, 이전 길이가 0이 아닌 경우)
        const isContentAdded = currentContentLength > prevContentLength && prevContentLength > 0;

        // 이미지가 추가되었는지 확인
        const imageRegex = /!\[([^\]]*)\]\((blob:[^\)]+|https?:\/\/[^\)]+)\)/g;
        const currentImageCount = (content.match(imageRegex) || []).length;
        const isImageAdded = currentImageCount > prevImageCountRef.current;

        if (isContentAdded || isImageAdded) {
            // 내용이나 이미지가 추가되었으면 맨 아래로 스크롤
            // 이미지 로딩을 기다리기 위해 여러 프레임에 걸쳐 시도
            let attempts = 0;
            const maxAttempts = 10;

            const scrollToBottom = () => {
                if (previewElement) {
                    const previousScrollHeight = previewElement.scrollHeight;
                    previewElement.scrollTop = previewElement.scrollHeight;

                    // 스크롤 높이가 변경되었는지 확인 (이미지 로딩 중일 수 있음)
                    if (previousScrollHeight !== previewElement.scrollHeight && attempts < maxAttempts) {
                        attempts++;
                        requestAnimationFrame(scrollToBottom);
                    }
                }
            };

            requestAnimationFrame(() => {
                scrollToBottom();
                // 추가로 약간의 지연 후에도 한 번 더 시도 (이미지 로딩 완료 대기)
                setTimeout(() => {
                    if (previewElement) {
                        previewElement.scrollTop = previewElement.scrollHeight;
                    }
                }, 100);
            });
        }

        // 현재 길이와 이미지 개수를 이전 값으로 저장
        prevContentLengthRef.current = currentContentLength;
        prevImageCountRef.current = currentImageCount;
    }, [content]);

    // 툴바 기능: 텍스트 삽입
    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

        setContent(newText);

        // 커서 위치 조정
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleHeading = (level: number) => {
        const prefix = '#'.repeat(level) + ' ';
        insertText(prefix);
    };

    const handleBold = () => {
        insertText('**', '**');
    };

    const handleStrikethrough = () => {
        insertText('~~', '~~');
    };

    const handleQuote = () => {
        insertText('> ');
    };

    const handleLink = () => {
        const url = prompt('링크 URL을 입력하세요:');
        if (url) {
            const text = textareaRef.current?.selectionStart !== textareaRef.current?.selectionEnd
                ? content.substring(textareaRef.current!.selectionStart, textareaRef.current!.selectionEnd)
                : '링크 텍스트';
            insertText(`[${text}](`, ')');
            setTimeout(() => {
                if (textareaRef.current) {
                    const pos = textareaRef.current.selectionStart - 1;
                    textareaRef.current.setSelectionRange(pos, pos);
                }
            }, 0);
        }
    };

    // cleanup: 컴포넌트 언마운트 시에만 URL 해제 (리렌더링 시에는 해제하지 않음)
    useEffect(() => {
        return () => {
            // 컴포넌트가 완전히 언마운트될 때만 URL 해제 (ref를 통해 최신 값 참조)
            tempFileMapRef.current.forEach((_file, tempUrl) => {
                URL.revokeObjectURL(tempUrl);
            });
        };
    }, []); // 빈 dependency 배열로 컴포넌트 언마운트 시에만 실행

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        let newContent = content;
        const imageMarkdowns: string[] = [];

        // 각 파일에 대해 임시 URL 생성 및 마크다운 삽입
        Array.from(files).forEach((file) => {
            const tempUrl = URL.createObjectURL(file);

            // Map에 저장 (나중에 업로드할 때 사용)
            setTempFileMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(tempUrl, file);
                return newMap;
            });

            // alt/파일명으로도 매핑 저장
            setFileByAltMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(file.name, file);
                return newMap;
            });

            // 마크다운 이미지 문법 생성
            const imageMarkdown = `![${file.name}](${tempUrl})`;
            imageMarkdowns.push(imageMarkdown);
        });

        // 현재 커서 위치에 이미지 마크다운 삽입
        if (imageMarkdowns.length > 0) {
            const markdownText = imageMarkdowns.join('\n\n');
            newContent =
                content.substring(0, start) +
                (start > 0 && content[start - 1] !== '\n' ? '\n\n' : '\n') +
                markdownText +
                '\n\n' +
                content.substring(start);

            setContent(newContent);

            // 커서 위치 조정
            setTimeout(() => {
                textarea.focus();
                const newCursorPos = start + markdownText.length + 4; // '\n\n' + '\n\n'
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }

        // input 초기화 (같은 파일 다시 선택 가능하도록)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImage = () => {
        fileInputRef.current?.click();
    };

    const handleCode = () => {
        insertText('`', '`');
    };

    const handleExit = () => {
        if (window.confirm('작성 중인 내용이 사라질 수 있습니다. 정말 나가시겠습니까?')) {
            navigate('/');
        }
    };

    const handleSave = async () => {
        if (isUploading) return;

        setIsUploading(true);
        try {
            // content에서 임시 URL 찾기 (blob:로 시작하는 URL)
            const tempUrlRegex = /!\[([^\]]*)\]\((blob:[^\)]+)\)/g;
            const matches = Array.from(content.matchAll(tempUrlRegex));

            if (matches.length > 0) {
                // 임시 URL에 해당하는 File 객체들 수집
                const filesToUpload: File[] = [];
                const tempUrlToServerUrl: Map<string, string> = new Map();

                for (const match of matches) {
                    const tempUrl = match[2];
                    const file = tempFileMap.get(tempUrl);

                    if (file) {
                        filesToUpload.push(file);
                    }
                }

                // 파일 업로드
                if (filesToUpload.length > 0) {
                    const uploadResult = await uploadApi.uploadFiles('posts', filesToUpload, {
                        att_target_type: 'POST',
                        att_target: '0', // 임시저장이므로 게시글 ID는 0
                    });

                    // 임시 URL과 서버 URL 매핑
                    matches.forEach((match, index) => {
                        const tempUrl = match[2];
                        if (uploadResult.files[index]) {
                            const serverUrl = `${API_BASE_URL}/${uploadResult.files[index].att_path}`;
                            tempUrlToServerUrl.set(tempUrl, serverUrl);
                        }
                    });

                    // content에서 임시 URL을 서버 URL로 교체
                    let newContent = content;
                    tempUrlToServerUrl.forEach((serverUrl, tempUrl) => {
                        // 정규식으로 정확히 매칭하여 교체
                        const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\))`, 'g');
                        newContent = newContent.replace(regex, `$1${serverUrl}$2`);

                        // Map에서 제거 및 URL 해제
                        setTempFileMap((prev) => {
                            const newMap = new Map(prev);
                            newMap.delete(tempUrl);
                            URL.revokeObjectURL(tempUrl);
                            return newMap;
                        });
                    });

                    setContent(newContent);
                }
            }

            // TODO: 임시저장 API 호출 (제목, 내용 저장)
            alert('임시저장되었습니다.');
        } catch (error) {
            console.error('파일 업로드 실패:', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        if (isUploading) return;

        setIsUploading(true);
        try {
            // content에서 임시 URL 찾기 (blob:로 시작하는 URL)
            const tempUrlRegex = /!\[([^\]]*)\]\((blob:[^\)]+)\)/g;
            const matches = Array.from(content.matchAll(tempUrlRegex));

            if (matches.length > 0) {
                // 임시 URL에 해당하는 File 객체들 수집
                const filesToUpload: File[] = [];
                const tempUrlToServerUrl: Map<string, string> = new Map();

                for (const match of matches) {
                    const tempUrl = match[2];
                    const file = tempFileMap.get(tempUrl);

                    if (file) {
                        filesToUpload.push(file);
                    }
                }

                // 파일 업로드
                if (filesToUpload.length > 0) {
                    const uploadResult = await uploadApi.uploadFiles('posts', filesToUpload, {
                        att_target_type: 'POST',
                        att_target: '0', // 게시글 ID는 나중에 업데이트될 수 있음
                    });

                    // 임시 URL과 서버 URL 매핑
                    matches.forEach((match, index) => {
                        const tempUrl = match[2];
                        if (uploadResult.files[index]) {
                            const serverUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${uploadResult.files[index].att_path}`;
                            tempUrlToServerUrl.set(tempUrl, serverUrl);
                        }
                    });

                    // content에서 임시 URL을 서버 URL로 교체
                    let newContent = content;
                    tempUrlToServerUrl.forEach((serverUrl, tempUrl) => {
                        // 정규식으로 정확히 매칭하여 교체
                        const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\))`, 'g');
                        newContent = newContent.replace(regex, `$1${serverUrl}$2`);

                        // Map에서 제거 및 URL 해제
                        setTempFileMap((prev) => {
                            const newMap = new Map(prev);
                            newMap.delete(tempUrl);
                            URL.revokeObjectURL(tempUrl);
                            return newMap;
                        });
                    });

                    setContent(newContent);
                }
            }

            // TODO: 출간 API 호출 (제목, 내용 저장)
            alert('등록되었습니다.');
        } catch (error) {
            console.error('파일 업로드 실패:', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col fixed inset-0 bg-white z-40 overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
            {/* 숨겨진 파일 input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* 좌측 에디터 영역 */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col overflow-hidden min-h-0 h-full">
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0 p-6">
                        {/* 제목 입력 */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl font-bold border-none outline-none mb-4 placeholder-gray-400 flex-shrink-0"
                            placeholder="제목을 입력하세요"
                        />


                        {/* 툴바 */}
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
                            {/* 헤딩 */}
                            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                                <button
                                    onClick={() => handleHeading(1)}
                                    className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
                                    title="H1"
                                >
                                    H1
                                </button>
                                <button
                                    onClick={() => handleHeading(2)}
                                    className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
                                    title="H2"
                                >
                                    H2
                                </button>
                                <button
                                    onClick={() => handleHeading(3)}
                                    className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
                                    title="H3"
                                >
                                    H3
                                </button>
                                <button
                                    onClick={() => handleHeading(4)}
                                    className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
                                    title="H4"
                                >
                                    H4
                                </button>
                            </div>

                            {/* 텍스트 스타일 */}
                            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                                <button
                                    onClick={handleBold}
                                    className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
                                    title="Bold"
                                >
                                    B
                                </button>
                                <button
                                    onClick={handleStrikethrough}
                                    className="px-2 py-1 text-sm line-through hover:bg-gray-100 rounded"
                                    title="Strikethrough"
                                >
                                    T
                                </button>
                            </div>

                            {/* 기타 기능 */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleQuote}
                                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                                    title="Quote"
                                >
                                    "
                                </button>
                                <button
                                    onClick={handleLink}
                                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                                    title="Link"
                                >
                                    🔗
                                </button>
                                <button
                                    onClick={handleImage}
                                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                                    title="Image"
                                >
                                    🖼️
                                </button>
                                <button
                                    onClick={handleCode}
                                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                                    title="Code"
                                >
                                    &lt;&gt;
                                </button>
                            </div>
                        </div>

                        {/* 에디터 */}
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border-none outline-none resize-none text-base leading-relaxed flex-1 min-h-0"
                            placeholder="여기에 글을 작성하세요"
                        />
                    </div>
                </div>

                {/* 우측 미리보기 영역 */}
                <div ref={previewRef} className="w-1/2 overflow-y-auto p-6 bg-gray-50 h-full">
                    <div className="max-w-none text-left">
                        <h1 className="text-3xl font-bold mb-6 text-gray-900 text-left">{title}</h1>
                        <div className="markdown-preview text-left">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={{
                                    br: () => <br />,
                                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 text-left">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 text-left">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 text-left">{children}</h3>,
                                    h4: ({ children }) => <h4 className="text-base font-bold mt-3 mb-2 text-gray-900 text-left">{children}</h4>,
                                    p: (props: any) => {
                                        // 이미지만 포함된 paragraph는 div로 렌더링 (HTML 구조 오류 방지)
                                        const children = props.children;
                                        // children이 배열이고 첫 번째 요소가 img인지 확인
                                        if (Array.isArray(children) && children.length === 1) {
                                            const firstChild = children[0];
                                            if (firstChild && typeof firstChild === 'object' && 'type' in firstChild && firstChild.type === 'img') {
                                                return <div className="my-4 flex justify-center">{children}</div>;
                                            }
                                        }
                                        // 단일 img 요소인 경우
                                        if (children && typeof children === 'object' && 'type' in children && children.type === 'img') {
                                            return <div className="my-4 flex justify-center">{children}</div>;
                                        }
                                        return <p className="mb-4 text-gray-700 leading-relaxed text-left">{children}</p>;
                                    },
                                    strong: ({ children }) => <strong className="font-bold text-gray-900 text-left">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-left">{children}</em>,
                                    del: ({ children }) => <del className="line-through text-left">{children}</del>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-green-300 pl-4 italic my-4 text-gray-600 text-left">
                                            {children}
                                        </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                        <a href={href} className="text-blue-600 hover:underline text-left" target="_blank" rel="noopener noreferrer">
                                            {children}
                                        </a>
                                    ),
                                    code: (props: any) => {
                                        const { children, className } = props;
                                        const isInline = !className;
                                        if (isInline) {
                                            return <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-left">{children}</code>;
                                        }
                                        return (
                                            <code className="block bg-gray-200 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono text-left">
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ children }) => <pre className="my-4 text-left">{children}</pre>,
                                    img: (props: any) => {
                                        const nodeProps = props.node?.properties || {};
                                        const alt = nodeProps.alt || props.alt || '';
                                        let src = nodeProps.src || props.src || '';

                                        // src가 비어있으면 imageList에서 순서대로 찾기
                                        if (!src || src === '') {
                                            const currentIndex = imageIndexRef.current;
                                            if (currentIndex < imageList.length) {
                                                // alt가 일치하는지 확인
                                                const image = imageList[currentIndex];
                                                // alt가 일치하거나, alt가 비어있으면 순서대로 사용
                                                if (!alt || image.alt === alt || !image.alt) {
                                                    src = image.url;
                                                } else {
                                                    // alt가 일치하지 않으면 imageList에서 alt로 찾기
                                                    const found = imageList.find(img => img.alt === alt);
                                                    if (found) {
                                                        src = found.url;
                                                    } else {
                                                        // 찾지 못하면 순서대로 사용
                                                        src = image.url;
                                                    }
                                                }
                                                imageIndexRef.current = currentIndex + 1;
                                            } else {
                                                // 인덱스가 범위를 벗어나면 content에서 직접 찾기
                                                if (alt) {
                                                    const imageRegex = new RegExp(`!\\[${alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\((blob:[^\)]+|https?://[^\)]+)\\)`, 'g');
                                                    const match = imageRegex.exec(content);
                                                    if (match) {
                                                        src = match[1];
                                                    }
                                                }
                                                // 여전히 없으면 첫 번째 이미지 사용
                                                if (!src && imageList.length > 0) {
                                                    src = imageList[0].url;
                                                }
                                            }
                                        } else {
                                            // src가 있으면 다음 인덱스로 이동
                                            imageIndexRef.current = Math.min(imageIndexRef.current + 1, imageList.length);
                                        }

                                        if (!src || src === '') {
                                            return null;
                                        }

                                        return (
                                            <img
                                                src={src}
                                                alt={alt}
                                                className="max-w-full h-auto my-4 mx-auto block"
                                            />
                                        );
                                    },
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 text-left">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 text-left">{children}</ol>,
                                    li: ({ children }) => <li className="ml-4 text-left">{children}</li>,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
                <button
                    onClick={handleExit}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                    <span>←</span>
                    <span>나가기</span>
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className="px-4 py-2 text-green-600 bg-white border border-green-600 rounded-lg hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? '업로드 중...' : '임시저장'}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isUploading}
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? '업로드 중...' : '등록하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
