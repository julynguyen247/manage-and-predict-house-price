import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ConfigUrl } from '../base';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';

function CommentItem({
  comment,
  expandedMap,
  toggleExpand,
  replyOpenMap,
  toggleReply,
  replyTexts,
  setReplyText,
  maxPreview = 2,
  isAuthenticated = false,
  user = null,
  setShowLoginModal,
  setShowRegisterModal,
  onSubmitReply,
  replySubmittingMap,
  
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {comment.author_avatar ? (
            <img src={ConfigUrl(comment.author_avatar)} alt={comment.author_username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        <div className="flex-1">
          <div className="inline-block bg-gray-100 rounded-2xl px-3 py-2" value={comment.id}>
            <div className="flex items-center gap-2 text-sm">
              <Link to={`/my-properties/?username=${comment.author_username}`} className="font-semibold text-gray-900 hover:underline">
                {comment.author_username}
              </Link>
              <span className="text-gray-500">• {comment.time}</span>
            </div>
            {comment.content && (
              <div className="mt-1 text-gray-800 whitespace-pre-wrap text-[15px] leading-relaxed">
                {comment.content}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
            <button type="button" className="hover:underline">Thích</button>
            <button type="button" className="hover:underline" onClick={() => toggleReply(comment.id)}>
              Trả lời
            </button>
          </div>

          {/* Reply box for this comment */}
          {replyOpenMap[comment.id] && (
            <div className="mt-2">
              {isAuthenticated ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {user?.avatar ? (
                      <img src={ConfigUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-medium">
                          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                      <textarea
                        value={replyTexts[comment.id] || ''}
                        onChange={(e) => setReplyText(comment.id, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 outline-none resize-y"
                        placeholder="Viết trả lời..."
                      />
                      <div className="flex justify-end px-3 py-2 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => onSubmitReply && onSubmitReply(comment.id)}
                          disabled={!((replyTexts[comment.id] || '').trim()) || !!(replySubmittingMap && replySubmittingMap[comment.id])}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 disabled:bg-gray-300 disabled:text-gray-600"
                        >
                          {replySubmittingMap && replySubmittingMap[comment.id] ? 'Đang gửi...' : 'Gửi'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">Đăng nhập để trả lời</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Đăng nhập
                      </button>
                      <button
                        onClick={() => setShowRegisterModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Đăng ký
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 md:pl-10 border-l border-gray-200 space-y-4">
          {(() => {
            const isExpanded = !!expandedMap[comment.id];
            return (
              <>
                {isExpanded && comment.replies.map(child => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    expandedMap={expandedMap}
                    toggleExpand={toggleExpand}
                    replyOpenMap={replyOpenMap}
                    toggleReply={toggleReply}
                    replyTexts={replyTexts}
                    setReplyText={setReplyText}
                    maxPreview={maxPreview}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    setShowLoginModal={setShowLoginModal}
                    setShowRegisterModal={setShowRegisterModal}
                    onSubmitReply={onSubmitReply}
                    replySubmittingMap={replySubmittingMap}
                  />
                ))}
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:underline"
                  onClick={() => toggleExpand(comment.id)}
                >
                  {isExpanded ? 'Ẩn bớt trả lời' : `Xem thêm trả lời (${comment.replies.length})`}
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function Comments({ articleId }) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [rootSubmitting, setRootSubmitting] = useState(false);
  const [expandedMap, setExpandedMap] = useState({});
  const [replyOpenMap, setReplyOpenMap] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [replySubmittingMap, setReplySubmittingMap] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const params = useMemo(() => ({ article_id: articleId }), [articleId]);

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('comments/', params, false);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Lỗi tải bình luận');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchComments();
    return () => {
      cancelled = true;
    };
  }, [articleId, params]);

  const toggleExpand = (commentId) => {
    setExpandedMap(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleReply = (commentId) => {
    setReplyOpenMap(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const setReplyText = (commentId, text) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  };

  const loadMoreRoot = async () => {
    if (!data?.next) return;
    try {
      setLoading(true);
      const response = await fetch(data.next);
      if (!response.ok) throw new Error('Không thể tải thêm bình luận');
      const nextData = await response.json();
      setData(prev => ({
        ...nextData,
        results: [...(prev?.results || []), ...(nextData?.results || [])]
      }));
    } catch (e) {
      setError(e.message || 'Lỗi tải thêm bình luận');
    } finally {
      setLoading(false);
    }
  };

  const buildOptimisticComment = ({ id, content, authorId, authorUsername, authorAvatar, article, answer = null }) => ({
    id: id ?? Date.now(),
    article,
    time: '0 giây trước',
    author: authorId,
    answer,
    author_username: authorUsername,
    content,
    author_avatar: authorAvatar || null,
    replies: []
  });

  const handleSubmitNewComment = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const content = (newComment || '').trim();
    if (!content || !articleId) return;
    try {
      setRootSubmitting(true);
      const payload = { article: Number(articleId), content };
      const res = await api.authenticatedPost('comments/', payload);
      const created = res?.data || res;
      const optimistic = buildOptimisticComment({
        id: created?.id,
        content,
        authorId: user?.id,
        authorUsername: user?.username,
        authorAvatar: user?.avatar,
        article: Number(articleId),
        answer: null
      });
      setData(prev => {
        const prevResults = Array.isArray(prev?.results) ? prev.results : [];
        return {
          ...(prev || { count: 0, next: null, previous: null }),
          count: (prev?.count ?? prevResults.length) + 1,
          results: [optimistic, ...prevResults]
        };
      });
      setNewComment('');
    } catch (e) {
      console.error('Submit comment failed', e);
      alert('Gửi bình luận thất bại');
    } finally {
      setRootSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const content = (replyTexts[parentId] || '').trim();
    if (!content || !articleId) return;
    try {
      setReplySubmittingMap(prev => ({ ...prev, [parentId]: true }));
      const payload = { article: Number(articleId), content, answer: Number(parentId) };
      const res = await api.authenticatedPost('comments/', payload);
      const created = res?.data || res;
      const optimistic = buildOptimisticComment({
        id: created?.id,
        content,
        authorId: user?.id,
        authorUsername: user?.username,
        authorAvatar: user?.avatar,
        article: Number(articleId),
        answer: Number(parentId)
      });
      setData(prev => {
        if (!prev || !Array.isArray(prev.results)) return prev;

        const addReplyRecursively = (nodes) => {
          return nodes.map(node => {
            if (node.id === parentId) {
              const isExpanded = !!expandedMap[parentId];
              const newReplies = [...(node.replies || []), optimistic];
              if (!isExpanded) {
                setExpandedMap(m => ({ ...m, [parentId]: true }));
              }
              return { ...node, replies: newReplies };
            }
            if (node.replies && node.replies.length > 0) {
              return { ...node, replies: addReplyRecursively(node.replies) };
            }
            return node;
          });
        };

        const results = addReplyRecursively(prev.results);
        return { ...prev, results };
      });
      setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
    } catch (e) {
      console.error('Submit reply failed', e);
      alert('Gửi trả lời thất bại');
    } finally {
      setReplySubmittingMap(prev => ({ ...prev, [parentId]: false }));
    }
  };

  if (!articleId) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Bình luận</h3>
      
      {/* Comment input section */}
      {isAuthenticated ? (
        <div className="flex items-start gap-3 mb-6">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {user?.avatar ? (
              <img src={ConfigUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 outline-none resize-y"
                placeholder="Viết bình luận..."
              />
              <div className="flex justify-end px-3 py-2 bg-gray-50">
                <button
                  type="button"
                  onClick={handleSubmitNewComment}
                  disabled={!newComment.trim() || rootSubmitting}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 disabled:bg-gray-300 disabled:text-gray-600"
                >
                  {rootSubmitting ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 mb-3">Đăng nhập để bình luận</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="text-gray-600">Đang tải bình luận...</div>
      )}
      {error && (
        <div className="text-red-600">{error}</div>
      )}
      {!loading && !error && data && Array.isArray(data.results) && data.results.length === 0 && (
        <div className="text-gray-600">Chưa có bình luận nào.</div>
      )}
      {!loading && !error && data && Array.isArray(data.results) && data.results.length > 0 && (
        <>
          <div className="space-y-6">
            {data.results.map(item => (
              <div key={item.id} className="p-2">
                <CommentItem
                  comment={item}
                  expandedMap={expandedMap}
                  toggleExpand={toggleExpand}
                  replyOpenMap={replyOpenMap}
                  toggleReply={toggleReply}
                  replyTexts={replyTexts}
                  setReplyText={setReplyText}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  setShowLoginModal={setShowLoginModal}
                  setShowRegisterModal={setShowRegisterModal}
                  onSubmitReply={handleSubmitReply}
                  replySubmittingMap={replySubmittingMap}
                />
              </div>
            ))}
          </div>

          {data.next && (
            <div className="mt-6">
              <button
                type="button"
                onClick={loadMoreRoot}
                className="w-full py-3 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-md font-medium border border-pink-200"
              >
                Xem thêm ý kiến
              </button>
            </div>
          )}
        </>
      )}

      {/* Login and Register Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}


