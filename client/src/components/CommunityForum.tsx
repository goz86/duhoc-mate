import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Send,
  Plus,
  Search,
  ArrowLeft,
  Clock,
  User,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  X,
  MessageCircle,
  Eye,
  Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CommunityPost {
  id: string
  user_id: string
  title: string
  content: string
  category: 'free' | 'topik' | 'life' | 'job'
  is_anonymous: boolean
  display_name: string
  likes_count: number
  dislikes_count: number
  comments_count: number
  views_count: number
  image_urls: string[]
  created_at: string
  updated_at: string
}

interface CommunityComment {
  id: string
  post_id: string
  parent_id: string | null
  user_id: string
  content: string
  is_anonymous: boolean
  display_name: string
  is_author: boolean
  likes_count: number
  expires_at: string | null
  created_at: string
}

interface Props {
  currentUserId: string
  username: string
  isAdmin: boolean
  onBackToLobby: () => void
}

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'topik', label: 'Học TOPIK' },
  { value: 'life', label: 'Đời sống Hàn' },
  { value: 'job', label: 'Việc làm thêm' },
  { value: 'free', label: 'Tự do' }
]

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return date.toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtCountdownHMS(ms: number): string {
  if (ms <= 0) return '0:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CommunityForum({
  currentUserId,
  username,
  isAdmin,
  onBackToLobby
}: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [dislikedPosts, setDislikedPosts] = useState<Set<string>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  // Filters & Writing
  const [catFilter, setCatFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeCat, setWriteCat] = useState<'free' | 'topik' | 'life' | 'job'>('free')
  const [isAnon, setIsAnon] = useState(true)
  const [submittingPost, setSubmittingPost] = useState(false)

  // Comments
  const [newComment, setNewComment] = useState('')
  const [isAnonComment, setIsAnonComment] = useState(true)
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
    fetchUserReactions()
  }, [catFilter])

  const fetchPosts = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      let query = supabase.from('community_posts').select('*')
      if (catFilter !== 'all') {
        query = query.eq('category', catFilter)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserReactions = async () => {
    if (!supabase || !currentUserId) return
    try {
      // Fetch likes
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id, comment_id, is_like')
        .eq('user_id', currentUserId)

      if (likes) {
        const lPosts = new Set<string>()
        const dlPosts = new Set<string>()
        const lComms = new Set<string>()

        likes.forEach(item => {
          if (item.post_id) {
            if (item.is_like) lPosts.add(item.post_id)
            else dlPosts.add(item.post_id)
          } else if (item.comment_id && item.is_like) {
            lComms.add(item.comment_id)
          }
        })
        setLikedPosts(lPosts)
        setDislikedPosts(dlPosts)
        setLikedComments(lComms)
      }

      // Fetch bookmarks
      const { data: bookmarks } = await supabase
        .from('community_bookmarks')
        .select('post_id')
        .eq('user_id', currentUserId)

      if (bookmarks) {
        setBookmarkedPosts(new Set(bookmarks.map(b => b.post_id)))
      }
    } catch (err) {
      console.error('Error fetching user reactions:', err)
    }
  }

  const handlePostClick = async (post: CommunityPost) => {
    setSelectedPost(post)
    fetchComments(post.id)
    // Increment view count
    if (supabase) {
      try {
        await supabase
          .from('community_posts')
          .update({ views_count: post.views_count + 1 })
          .eq('id', post.id)
        
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views_count: p.views_count + 1 } : p))
      } catch (err) {
        console.error('Error updating views count:', err)
      }
    }
  }

  const fetchComments = async (postId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !writeTitle.trim() || !writeContent.trim() || submittingPost) return

    setSubmittingPost(true)
    try {
      const newPostData = {
        user_id: currentUserId,
        title: writeTitle.trim(),
        content: writeContent.trim(),
        category: writeCat,
        is_anonymous: isAnon,
        display_name: isAnon ? 'Ẩn danh' : username
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert([newPostData])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setPosts([data[0], ...posts])
      }
      
      // Reset forms
      setWriteTitle('')
      setWriteContent('')
      setWriteCat('free')
      setIsAnon(true)
      setIsWriting(false)
    } catch (err) {
      console.error('Error creating post:', err)
    } finally {
      setSubmittingPost(false)
    }
  }

  const handleLikePost = async (postId: string, isLike: boolean) => {
    if (!supabase || !currentUserId) return

    const targetSet = isLike ? likedPosts : dislikedPosts
    const oppositeSet = isLike ? dislikedPosts : likedPosts
    const setTarget = isLike ? setLikedPosts : setDislikedPosts
    const setOpposite = isLike ? setDislikedPosts : setLikedPosts
    const countField = isLike ? 'likes_count' : 'dislikes_count'
    const oppositeField = isLike ? 'dislikes_count' : 'likes_count'

    const post = posts.find(p => p.id === postId)
    if (!post) return

    try {
      if (targetSet.has(postId)) {
        // Remove reaction
        await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId)

        setTarget(prev => { const s = new Set(prev); s.delete(postId); return s })
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, [countField]: Math.max(0, p[countField] - 1) } : p))
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, [countField]: Math.max(0, prev[countField] - 1) } : null)
        }
      } else {
        // Toggle opposite reaction if exists
        let oppositeDecreased = 0
        if (oppositeSet.has(postId)) {
          await supabase
            .from('community_likes')
            .delete()
            .eq('user_id', currentUserId)
            .eq('post_id', postId)
          setOpposite(prev => { const s = new Set(prev); s.delete(postId); return s })
          oppositeDecreased = 1
        }

        // Add reaction
        await supabase
          .from('community_likes')
          .insert([{ user_id: currentUserId, post_id: postId, is_like: isLike }])

        setTarget(prev => new Set([...prev, postId]))
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              [countField]: p[countField] + 1,
              [oppositeField]: Math.max(0, p[oppositeField] - oppositeDecreased)
            }
          }
          return p
        }))
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            [countField]: prev[countField] + 1,
            [oppositeField]: Math.max(0, prev[oppositeField] - oppositeDecreased)
          } : null)
        }
      }
    } catch (err) {
      console.error('Error toggling post reaction:', err)
    }
  }

  const handleBookmarkPost = async (postId: string) => {
    if (!supabase || !currentUserId) return

    try {
      if (bookmarkedPosts.has(postId)) {
        await supabase
          .from('community_bookmarks')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId)

        setBookmarkedPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
      } else {
        await supabase
          .from('community_bookmarks')
          .insert([{ user_id: currentUserId, post_id: postId }])

        setBookmarkedPosts(prev => new Set([...prev, postId]))
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    }
  }

  const handleSharePost = (postId: string) => {
    const shareUrl = `${window.location.origin}/#forum/post/${postId}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(postId)
    setTimeout(() => setCopiedPostId(null), 2500)
  }

  const handleDeletePost = async (postId: string) => {
    if (!supabase || (!isAdmin && posts.find(p => p.id === postId)?.user_id !== currentUserId)) return
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(p => p.id !== postId))
      if (selectedPost?.id === postId) {
        setSelectedPost(null)
      }
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!supabase || !currentUserId) return

    const hasLiked = likedComments.has(commentId)
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    try {
      if (hasLiked) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('comment_id', commentId)

        setLikedComments(prev => { const s = new Set(prev); s.delete(commentId); return s })
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c))
      } else {
        await supabase
          .from('community_likes')
          .insert([{ user_id: currentUserId, comment_id: commentId, is_like: true }])

        setLikedComments(prev => new Set([...prev, commentId]))
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c))
      }
    } catch (err) {
      console.error('Error toggling comment like:', err)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !newComment.trim() || submittingComment || !selectedPost) return

    setSubmittingComment(true)
    try {
      // Calculate self-destruct expiration if anonymous comment
      const expiresAt = (!currentUserId || isAnonComment) 
        ? new Date(Date.now() + 3 * 3600 * 1000).toISOString() // 3 Hours expiration
        : null

      // If anonymous comment, assess standard name display "Ẩn danh X"
      // Generate a consistent pseudo-random index per comment session
      const anonName = (!currentUserId || isAnonComment)
        ? (currentUserId ? `Ẩn danh ${Math.floor(Math.random() * 100) + 1}` : `Ẩn danh (Khách) ${Math.floor(Math.random() * 100) + 1}`)
        : username

      const commentPayload = {
        post_id: selectedPost.id,
        parent_id: replyToCommentId,
        user_id: currentUserId || null,
        content: newComment.trim(),
        is_anonymous: !currentUserId ? true : isAnonComment,
        display_name: anonName,
        is_author: currentUserId ? (selectedPost.user_id === currentUserId) : false,
        expires_at: expiresAt
      }

      const { data, error } = await supabase
        .from('community_comments')
        .insert([commentPayload])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setComments([...comments, data[0]])
        // Increment comment counts locally in selected post
        setSelectedPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      }

      setNewComment('')
      setReplyToCommentId(null)
    } catch (err) {
      console.error('Error creating comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!supabase || !selectedPost) return
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return

    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      setSelectedPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null)
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p))
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  // Group comments: Root comments and their lồng nhau replies
  const rootComments = comments.filter(c => c.parent_id === null)
  const commentReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 w-full max-w-[1240px] px-3 sm:px-6 py-4 flex flex-col min-h-0">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          {selectedPost ? (
            <button
              onClick={() => { setSelectedPost(null); setComments([]); }}
              className="p-2.5 rounded-full border border-brand-terracotta-light/10 bg-white/80 hover:bg-white text-brand-brown-dark shadow-sm transition active:scale-95 cursor-pointer dark:bg-brand-panel"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              onClick={onBackToLobby}
              className="p-2.5 rounded-full border border-brand-terracotta-light/10 bg-white/80 hover:bg-white text-brand-brown-dark shadow-sm transition active:scale-95 cursor-pointer dark:bg-brand-panel"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="font-display text-2xl font-black text-brand-brown-dark leading-tight">
              {selectedPost ? 'Chi tiết bài viết' : 'Diễn đàn học tập'}
            </h2>
            <p className="text-xs text-brand-brown-light mt-0.5">
              {selectedPost ? 'Xem bình luận và thảo luận cùng cộng đồng' : 'Chia sẻ kinh nghiệm và kết nối ẩn danh an toàn'}
            </p>
          </div>
        </div>

        {!selectedPost && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-terracotta px-4 py-2.5 text-xs font-black text-white hover:bg-brand-brown-dark transition active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            Viết bài
          </button>
        )}
      </div>

      {/* DETAILED POST READ PANEL */}
      {selectedPost ? (
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* LEFT COLUMN: THE POST DETAIL CARD */}
          <section className="flex-1 rounded-[28px] border border-brand-terracotta-light/20 bg-white/85 p-5 shadow-sm overflow-y-auto custom-scrollbar flex flex-col dark:bg-brand-panel/85">
            <div className="flex items-center justify-between mb-3.5">
              <span className="rounded-full border border-brand-terracotta/25 bg-brand-cream/80 px-2.5 py-1 text-[10px] font-black text-brand-terracotta dark:bg-brand-light">
                {CATEGORIES.find(c => c.value === selectedPost.category)?.label || 'Tự do'}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-brand-brown-light">
                <Eye size={12} />
                <span>{selectedPost.views_count} lượt xem</span>
              </div>
            </div>

            <h3 className="font-display text-lg sm:text-xl font-black text-brand-brown-dark leading-tight mb-2">
              {selectedPost.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-brand-brown-light mb-4 pb-3 border-b border-brand-terracotta-light/10">
              <span className="inline-flex items-center gap-1 font-bold text-brand-brown-dark">
                {selectedPost.is_anonymous ? <ShieldCheck size={13} className="text-emerald-500" /> : <User size={13} />}
                {selectedPost.display_name}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {timeAgo(selectedPost.created_at)}
              </span>
            </div>

            <div className="text-sm leading-relaxed text-brand-brown-dark/90 whitespace-pre-wrap flex-1 mb-6">
              {selectedPost.content}
            </div>

            {/* INTERACTION ROW: LIKE, BOOKMARK, SHARE */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-terracotta-light/10 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLikePost(selectedPost.id, true)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    likedPosts.has(selectedPost.id)
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                      : 'border-brand-terracotta-light/15 bg-white/70 text-brand-brown-light hover:text-brand-brown-dark hover:border-brand-terracotta/35 dark:bg-brand-light'
                  }`}
                  title="Thích"
                >
                  <ThumbsUp size={13} />
                  <span>{selectedPost.likes_count}</span>
                </button>
                <button
                  onClick={() => handleLikePost(selectedPost.id, false)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    dislikedPosts.has(selectedPost.id)
                      ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                      : 'border-brand-terracotta-light/15 bg-white/70 text-brand-brown-light hover:text-brand-brown-dark hover:border-brand-terracotta/35 dark:bg-brand-light'
                  }`}
                  title="Không thích"
                >
                  <ThumbsDown size={13} />
                  <span>{selectedPost.dislikes_count}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBookmarkPost(selectedPost.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    bookmarkedPosts.has(selectedPost.id)
                      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      : 'border-brand-terracotta-light/15 bg-white/70 text-brand-brown-light hover:text-brand-brown-dark hover:border-brand-terracotta/35 dark:bg-brand-light'
                  }`}
                  title="Lưu"
                >
                  <Bookmark size={13} fill={bookmarkedPosts.has(selectedPost.id) ? 'currentColor' : 'none'} />
                  <span>Lưu</span>
                </button>
                <button
                  onClick={() => handleSharePost(selectedPost.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-terracotta-light/15 bg-white/70 px-3 py-2 text-xs font-black text-brand-brown-light hover:text-brand-brown-dark hover:border-brand-terracotta/35 transition cursor-pointer active:scale-95 dark:bg-brand-light"
                  title="Chia sẻ"
                >
                  {copiedPostId === selectedPost.id ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                  <span>{copiedPostId === selectedPost.id ? 'Đã sao chép' : 'Chia sẻ'}</span>
                </button>

                {(isAdmin || selectedPost.user_id === currentUserId) && (
                  <button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer active:scale-95 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                    title="Xóa bài viết"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: COMMENTS TIMELINE & INPUT BAR */}
          <aside className="w-full md:w-[380px] lg:w-[420px] rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm flex flex-col min-h-0 dark:bg-brand-panel/88">
            <h4 className="font-display font-black text-sm text-brand-brown-dark mb-3 shrink-0 flex items-center gap-1.5">
              <MessageCircle size={16} className="text-brand-terracotta" />
              Bình luận ({selectedPost.comments_count})
            </h4>

            {/* COMMENTS DISPLAY LIST */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 custom-scrollbar min-h-0">
              {rootComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare size={26} className="text-brand-terracotta/40 mb-2" />
                  <p className="text-xs font-bold text-brand-brown-light">Chưa có bình luận nào</p>
                  <p className="text-[10px] text-brand-brown-light/75">Gửi bình luận ẩn danh đầu tiên để bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                rootComments.map(comment => {
                  const replies = commentReplies(comment.id)
                  return (
                    <div key={comment.id} className="space-y-2">
                      <CommentItem
                        comment={comment}
                        liked={likedComments.has(comment.id)}
                        onLike={() => handleLikeComment(comment.id)}
                        onReply={() => {
                          setReplyToCommentId(comment.id)
                          setNewComment(`@${comment.display_name} `)
                        }}
                        onDelete={() => handleDeleteComment(comment.id)}
                        isAdminOrOwner={isAdmin || comment.user_id === currentUserId}
                      />
                      
                      {/* Nested Replies with Gray Indent Line */}
                      {replies.map(reply => (
                        <div key={reply.id} className="pl-6 relative flex gap-2">
                          <span className="absolute left-2.5 top-0 bottom-4 w-[1.5px] border-l border-b border-brand-terracotta-light/30 rounded-bl-md pointer-events-none" />
                          <div className="flex-1">
                            <CommentItem
                              comment={reply}
                              liked={likedComments.has(reply.id)}
                              onLike={() => handleLikeComment(reply.id)}
                              onReply={() => {
                                setReplyToCommentId(comment.id)
                                setNewComment(`@${reply.display_name} `)
                              }}
                              onDelete={() => handleDeleteComment(reply.id)}
                              isAdminOrOwner={isAdmin || reply.user_id === currentUserId}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>

            {/* COMMENT INPUT BAR */}
            <form onSubmit={handleSubmitComment} className="border-t border-brand-terracotta-light/10 pt-3 shrink-0">
              {replyToCommentId && (
                <div className="flex items-center justify-between bg-brand-cream/80 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-brand-terracotta mb-2 dark:bg-brand-light">
                  <span>Đang phản hồi bình luận...</span>
                  <button type="button" onClick={() => { setReplyToCommentId(null); setNewComment(''); }}>
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* ANONYMOUS TOGGLE BUTTON SWITCH */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUserId) return // disable toggle switch if guest
                    setIsAnonComment(prev => !prev)
                  }}
                  className={`cm-comment-anon-toggle inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold border transition cursor-pointer select-none ${
                    !currentUserId || isAnonComment
                      ? 'cm-comment-anon-toggle active'
                      : 'border-brand-terracotta-light/15 bg-white/70 text-brand-brown-light dark:bg-brand-panel'
                  }`}
                  disabled={!currentUserId}
                >
                  <span className="cm-comment-switch" />
                  <span className="cm-comment-anon-text flex items-center gap-1">
                    {!currentUserId 
                      ? (
                        <>
                          <ShieldCheck size={12} className="text-blue-500 shrink-0 stroke-[2.2]" />
                          <span>Ẩn danh (Khách)</span>
                        </>
                      ) 
                      : (isAnonComment ? (
                        <>
                          <ShieldCheck size={12} className="text-blue-500 shrink-0 stroke-[2.2]" />
                          <span>Ẩn danh</span>
                        </>
                      ) : `👤 Trạng thái công khai (${username})`)
                    }
                  </span>
                </button>
              </div>

              {/* Text Input Row */}
              <div className="relative flex items-center rounded-2xl border border-brand-terracotta-light/20 bg-brand-cream/70 p-1.5 dark:bg-brand-panel">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/60"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="inline-flex h-8 w-8 shrink-0 place-items-center justify-center rounded-xl bg-brand-terracotta text-white hover:bg-brand-brown-dark transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <Send size={13} />
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : isWriting ? (
        
        /* WRITE NEW POST FULLSCREEN/OVERLAY SCREEN */
        <section className="flex-1 rounded-[28px] border border-brand-terracotta-light/25 bg-white/85 p-4 sm:p-6 shadow-sm overflow-y-auto custom-scrollbar flex flex-col dark:bg-brand-panel/85">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-base text-brand-brown-dark">Viết bài mới</h3>
            <button
              onClick={() => setIsWriting(false)}
              className="p-1.5 rounded-full hover:bg-brand-light text-brand-brown-light transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitPost} className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase text-brand-brown-light">Chuyên mục bài viết</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setWriteCat(cat.value as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                        writeCat === cat.value
                          ? 'bg-brand-terracotta border-brand-terracotta text-white'
                          : 'border-brand-terracotta-light/15 bg-white text-brand-brown-light hover:text-brand-brown-dark dark:bg-brand-panel'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous Post Toggle */}
              <div className="flex flex-col gap-1.5 justify-center md:items-end">
                <label className="text-[11px] font-black uppercase text-brand-brown-light">Chế độ hiển thị</label>
                <button
                  type="button"
                  onClick={() => setIsAnon(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-black transition cursor-pointer select-none active:scale-95 ${
                    isAnon
                      ? 'border-emerald-100/40 text-emerald-700 bg-emerald-50/20'
                      : 'border-brand-terracotta-light/15 bg-white text-brand-brown-light dark:bg-brand-panel'
                  }`}
                >
                  {isAnon ? <ShieldCheck size={14} className="text-emerald-500" /> : <User size={14} />}
                  <span>{isAnon ? 'Đăng Ẩn danh (Mặc định bảo mật)' : `Đăng công khai (${username})`}</span>
                </button>
              </div>
            </div>

            {/* Post Title input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-brand-brown-light">Tiêu đề bài viết</label>
              <input
                type="text"
                value={writeTitle}
                onChange={e => setWriteTitle(e.target.value)}
                placeholder="Tóm tắt trải nghiệm của bạn (ví dụ: Chia sẻ bí quyết thi TOPIK II)..."
                className="rounded-xl border border-brand-terracotta-light/20 bg-brand-cream/60 px-4 py-3.5 text-xs font-bold text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 dark:bg-brand-panel"
                required
                maxLength={100}
              />
            </div>

            {/* Post Content Input */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[220px]">
              <label className="text-[11px] font-black uppercase text-brand-brown-light">Nội dung chi tiết</label>
              <textarea
                value={writeContent}
                onChange={e => setWriteContent(e.target.value)}
                placeholder="Chia sẻ chi tiết trải nghiệm thực tế, lời khuyên học tập, sinh sống, hoặc cơ hội việc làm tại Hàn Quốc..."
                className="flex-1 rounded-xl border border-brand-terracotta-light/20 bg-brand-cream/60 px-4 py-3.5 text-xs font-medium text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 resize-none custom-scrollbar dark:bg-brand-panel"
                required
                maxLength={4000}
              />
              <div className="text-[10px] text-brand-brown-light text-right">
                {writeContent.length}/4000 ký tự
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setIsWriting(false); setWriteTitle(''); setWriteContent(''); }}
                className="px-4 py-2.5 rounded-xl border border-brand-terracotta-light/20 bg-white text-xs font-black text-brand-brown-light hover:text-brand-brown-dark transition cursor-pointer active:scale-95 dark:bg-brand-panel"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!writeTitle.trim() || !writeContent.trim() || submittingPost}
                className="px-5 py-2.5 rounded-xl bg-brand-terracotta text-xs font-black text-white hover:bg-brand-brown-dark transition cursor-pointer active:scale-95 disabled:opacity-40"
              >
                {submittingPost ? 'Đang gửi...' : 'Đăng bài viết'}
              </button>
            </div>
          </form>
        </section>
      ) : (

        /* FORUM POSTS FEED CONTAINER */
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* LEFT SIDEBAR: FILTERS AND SEARCH */}
          <aside className="w-full lg:w-[240px] flex flex-col gap-3 shrink-0">
            {/* Search inputs */}
            <div className="relative flex items-center rounded-2xl border border-brand-terracotta-light/20 bg-white/80 px-3.5 py-2.5 shadow-sm dark:bg-brand-panel">
              <Search size={15} className="text-brand-brown-light mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                className="w-full bg-transparent text-xs font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/50"
              />
            </div>

            {/* Category selection */}
            <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/85 p-3.5 shadow-sm dark:bg-brand-panel">
              <h3 className="text-[10px] font-black uppercase text-brand-brown-light mb-2.5 px-1.5">Chuyên mục</h3>
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCatFilter(cat.value)}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                      catFilter === cat.value
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : 'text-brand-brown-light hover:bg-brand-light'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN POSTS TIMELINE TIMELINE FEED */}
          <main className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="animate-spin text-brand-terracotta/40 mb-2" size={32} />
                <p className="text-sm font-bold text-brand-brown-light">Đang tải danh sách bài viết...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/70 p-10 text-center">
                <MessageSquare size={36} className="text-brand-terracotta/30 mx-auto mb-2" />
                <h4 className="font-display font-black text-base text-brand-brown-dark mb-1">Chưa có bài viết nào</h4>
                <p className="text-xs text-brand-brown-light">Hãy là người đầu tiên đăng bài trong chuyên mục này!</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="rounded-[24px] border border-brand-terracotta-light/15 bg-white/86 p-4.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col gap-3 group dark:bg-brand-panel/85"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="rounded-full border border-brand-terracotta/20 bg-brand-cream/80 px-2 py-0.5 text-[9px] font-black text-brand-terracotta dark:bg-brand-light">
                          {CATEGORIES.find(c => c.value === post.category)?.label || 'Tự do'}
                        </span>
                        <span className="text-[10px] font-bold text-brand-brown-light inline-flex items-center gap-1">
                          {post.is_anonymous ? <ShieldCheck size={11} className="text-emerald-500" /> : <User size={11} />}
                          {post.display_name}
                        </span>
                        <span className="text-[10px] text-brand-brown-light">·</span>
                        <span className="text-[10px] text-brand-brown-light">{timeAgo(post.created_at)}</span>
                      </div>
                      <h3 className="font-display text-sm sm:text-base font-black text-brand-brown-dark group-hover:text-brand-terracotta transition leading-snug truncate">
                        {post.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-brand-brown-light line-clamp-2 mt-1 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-brand-terracotta-light/10 pt-2 text-[10px] font-black text-brand-brown-light shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {post.likes_count} thích
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={12} />
                        {post.comments_count} bình luận
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={12} />
                        {post.views_count} xem
                      </span>
                    </div>

                    {(isAdmin || post.user_id === currentUserId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDeletePost(post.id); }}
                        className="p-1.5 rounded-lg border border-red-50 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa bài viết"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </main>
        </div>
      )}
    </div>
  )
}

function CommentItem({
  comment,
  liked,
  onLike,
  onReply,
  onDelete,
  isAdminOrOwner
}: {
  comment: CommunityComment
  liked: boolean
  onLike: () => void
  onReply: () => void
  onDelete: () => void
  isAdminOrOwner: boolean
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(() => {
    if (!comment.expires_at) return null
    return new Date(comment.expires_at).getTime() - Date.now()
  })

  useEffect(() => {
    if (!comment.expires_at) return
    const tick = () => {
      setRemainingMs(new Date(comment.expires_at!).getTime() - Date.now())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [comment.expires_at])

  const showCountdown = remainingMs !== null && remainingMs > 0

  if (comment.expires_at && remainingMs !== null && remainingMs <= 0) {
    return null // Filter out expired guest comments
  }

  return (
    <article className="rounded-2xl border border-brand-terracotta-light/10 bg-brand-cream/45 p-3.5 flex flex-col gap-1.5 relative dark:bg-brand-panel">
      
      {/* Comment Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <strong className={`text-xs font-black text-brand-brown-dark ${comment.is_author ? 'text-brand-terracotta border-b border-brand-terracotta/20 pb-0.5' : ''}`}>
            {comment.display_name}
            {comment.is_author && <span className="text-[9px] font-bold ml-1 text-brand-terracotta uppercase">(Tác giả)</span>}
          </strong>
          <span className="text-[10px] text-brand-brown-light/70">{timeAgo(comment.created_at)}</span>
        </div>

        {isAdminOrOwner && (
          <button
            onClick={onDelete}
            className="p-1 rounded-md text-brand-brown-light hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            title="Xóa bình luận"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Comment Content body */}
      <p className="text-xs text-brand-brown-dark/90 leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Comment Interaction Actions Row matching mockup exactly */}
      <div className="flex items-center gap-3 text-xs mt-1 shrink-0 select-none">
        <button
          type="button"
          onClick={onReply}
          className="text-blue-500 hover:text-blue-700 font-bold transition cursor-pointer"
        >
          Trả lời
        </button>
        <button
          type="button"
          onClick={onLike}
          className={`inline-flex items-center gap-1 transition cursor-pointer ${
            liked 
              ? 'text-brand-terracotta font-bold' 
              : 'text-gray-400 hover:text-brand-brown-dark'
          }`}
        >
          <ThumbsUp size={12} className="stroke-[1.8]" />
          <span className="text-[11px] font-medium">{comment.likes_count}</span>
        </button>
      </div>

      {/* Vivid orange-red divider bar matching the screenshot exactly */}
      {showCountdown && <div className="cm-comment-self-destruct-divider" />}

      {/* Self-Destruct Countdown Text underneath the divider with clock icon */}
      {showCountdown && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 select-none mt-0.5">
          <Clock size={11} className="text-gray-700 dark:text-gray-300 stroke-[2.2]" />
          <span>xóa sau {fmtCountdownHMS(remainingMs!)}</span>
        </div>
      )}
    </article>
  )
}
