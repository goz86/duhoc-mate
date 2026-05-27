import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  Check,
  Layers,
  BookOpen,
  MapPin,
  Briefcase,
  Globe2,
  Flame,
  Loader2
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
  { value: 'all', labelKey: 'forum.cat.all', Icon: Layers, color: '#8B7A6E', bg: 'rgba(139,122,110,0.10)' },
  { value: 'topik', labelKey: 'forum.cat.topik', Icon: BookOpen, color: '#0369a1', bg: 'rgba(14,165,233,0.10)' },
  { value: 'life', labelKey: 'forum.cat.life', labelOverride: 'Tin tức', Icon: MapPin, color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  { value: 'job', labelKey: 'forum.cat.job', Icon: Briefcase, color: '#b45309', bg: 'rgba(245,158,11,0.10)' },
  { value: 'free', labelKey: 'forum.cat.free', Icon: Globe2, color: '#C17C63', bg: 'rgba(193,124,99,0.10)' }
]

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}p`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
}

function fmtCountdownHMS(ms: number): string {
  if (ms <= 0) return '0:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[0]
}

export default function CommunityForum({
  currentUserId,
  username,
  isAdmin,
  onBackToLobby
}: Props) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [dislikedPosts, setDislikedPosts] = useState<Set<string>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  // Guest ID: UUID duy nhất cho mỗi browser, lưu localStorage, dùng để ghi reaction vào DB
  const guestId = useMemo<string>(() => {
    if (currentUserId) return ''
    try {
      let id = localStorage.getItem('forum_guest_id')
      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('forum_guest_id', id)
      }
      return id
    } catch { return '' }
  }, [currentUserId])

  // Filters & Writing
  const [catFilter, setCatFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeCat, setWriteCat] = useState<'free' | 'topik' | 'life' | 'job'>('free')
  const [isAnon, setIsAnon] = useState(true)
  const [submittingPost, setSubmittingPost] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  // Comments
  const [newComment, setNewComment] = useState('')
  const [isAnonComment, setIsAnonComment] = useState(true)
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [replyToDisplayName, setReplyToDisplayName] = useState<string>('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
    if (currentUserId) {
      fetchUserReactions()
    } else {
      fetchGuestReactions()
    }
  }, [catFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Increment views when post is selected (atomic via RPC)
  useEffect(() => {
    if (!selectedPost || !supabase) return
    const incrementViews = async () => {
      try {
        const { error } = await supabase.rpc('increment_post_views', { post_id: selectedPost.id })
        if (error) throw error
        setSelectedPost(prev => prev ? { ...prev, views_count: prev.views_count + 1 } : null)
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, views_count: p.views_count + 1 } : p))
      } catch (err) {
        console.error('Error incrementing views:', err)
      }
    }
    const timer = setTimeout(incrementViews, 500)
    return () => clearTimeout(timer)
  }, [selectedPost?.id])

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

  // Load reactions from DB for guest users using their persistent guest_id
  const fetchGuestReactions = async () => {
    if (!supabase || !guestId) return
    try {
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id, comment_id, is_like')
        .eq('guest_id', guestId)
        .is('user_id', null)
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
    } catch (err) {
      console.error('Error fetching guest reactions:', err)
    }
  }

  const handlePostClick = (post: CommunityPost) => {
    setSelectedPost(post)
    fetchComments(post.id)
    // View counting handled by the useEffect watching selectedPost?.id
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
    if (!supabase) return

    // Allow local state change for guests (optimistic update)
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
        // Unlike/undislike
        setTarget(prev => { const s = new Set(prev); s.delete(postId); return s })
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, [countField]: Math.max(0, p[countField] - 1) } : p))
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, [countField]: Math.max(0, prev[countField] - 1) } : null)
        }
        // Sync to DB
        if (currentUserId) {
          await supabase.from('community_likes').delete()
            .eq('user_id', currentUserId).eq('post_id', postId)
        } else if (guestId) {
          await supabase.from('community_likes').delete()
            .eq('guest_id', guestId).eq('post_id', postId).is('user_id', null)
        }
      } else {
        // Like/dislike
        let oppositeDecreased = 0
        if (oppositeSet.has(postId)) {
          setOpposite(prev => { const s = new Set(prev); s.delete(postId); return s })
          oppositeDecreased = 1
        }
        setTarget(prev => new Set([...prev, postId]))
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, [countField]: p[countField] + 1, [oppositeField]: Math.max(0, p[oppositeField] - oppositeDecreased) }
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
        // Sync to DB – delete first to handle like↔dislike switch
        if (currentUserId) {
          await supabase.from('community_likes').delete()
            .eq('user_id', currentUserId).eq('post_id', postId)
          await supabase.from('community_likes').insert([
            { user_id: currentUserId, post_id: postId, is_like: isLike }
          ])
        } else if (guestId) {
          await supabase.from('community_likes').delete()
            .eq('guest_id', guestId).eq('post_id', postId).is('user_id', null)
          await supabase.from('community_likes').insert([
            { guest_id: guestId, post_id: postId, is_like: isLike }
          ])
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
        await supabase.from('community_bookmarks').delete().eq('user_id', currentUserId).eq('post_id', postId)
        setBookmarkedPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
      } else {
        await supabase.from('community_bookmarks').insert([{ user_id: currentUserId, post_id: postId }])
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

  const handleEditPost = async (postId: string) => {
    if (!supabase || (!isAdmin && posts.find(p => p.id === postId)?.user_id !== currentUserId)) return
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung')
      return
    }
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ title: editTitle.trim(), content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', postId)
      if (error) throw error
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, title: editTitle.trim(), content: editContent.trim(), updated_at: new Date().toISOString() } : p))
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, title: editTitle.trim(), content: editContent.trim(), updated_at: new Date().toISOString() })
      }
      setIsEditing(false)
      setEditTitle('')
      setEditContent('')
    } catch (err) {
      console.error('Error editing post:', err)
    }
  }

  const startEditPost = (post: CommunityPost) => {
    setEditTitle(post.title)
    setEditContent(post.content)
    setIsEditing(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (!supabase || (!isAdmin && posts.find(p => p.id === postId)?.user_id !== currentUserId)) return
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return
    try {
      const { error } = await supabase.from('community_posts').delete().eq('id', postId)
      if (error) throw error
      setPosts(prev => prev.filter(p => p.id !== postId))
      if (selectedPost?.id === postId) setSelectedPost(null)
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!supabase) return

    // Allow local state change for guests (optimistic update)
    const hasLiked = likedComments.has(commentId)
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    try {
      if (hasLiked) {
        // Unlike
        setLikedComments(prev => { const s = new Set(prev); s.delete(commentId); return s })
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c))
        if (currentUserId) {
          await supabase.from('community_likes').delete().eq('user_id', currentUserId).eq('comment_id', commentId)
        } else if (guestId) {
          await supabase.from('community_likes').delete()
            .eq('guest_id', guestId).eq('comment_id', commentId).is('user_id', null)
        }
      } else {
        // Like
        setLikedComments(prev => new Set([...prev, commentId]))
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c))
        if (currentUserId) {
          await supabase.from('community_likes').insert([{ user_id: currentUserId, comment_id: commentId, is_like: true }])
        } else if (guestId) {
          await supabase.from('community_likes').insert([{ guest_id: guestId, comment_id: commentId, is_like: true }])
        }
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
      const expiresAt = (!currentUserId || isAnonComment)
        ? new Date(Date.now() + 3 * 3600 * 1000).toISOString()
        : null
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
      const { data, error } = await supabase.from('community_comments').insert([commentPayload]).select()
      if (error) throw error
      if (data && data.length > 0) {
        setComments([...comments, data[0]])
        setSelectedPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      }
      setNewComment('')
      setReplyToCommentId(null)
      setReplyToDisplayName('')
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
      const { error } = await supabase.from('community_comments').delete().eq('id', commentId)
      if (error) throw error
      setComments(prev => prev.filter(c => c.id !== commentId))
      setSelectedPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null)
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p))
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  // Group comments
  const rootComments = comments.filter(c => c.parent_id === null)
  const commentReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const q = searchQuery.toLowerCase()
    return posts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
  }, [posts, searchQuery])

  // Trending post: most likes in last 7 days, or top liked overall
  const trendingPost = useMemo(() => {
    if (posts.length === 0) return null
    const sorted = [...posts].sort((a, b) => (b.likes_count + b.comments_count * 2) - (a.likes_count + a.comments_count * 2))
    return sorted[0]
  }, [posts])

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedPost) {
    return (
      <div className="forum-v2 flex-1 w-full max-w-[760px] mx-auto flex flex-col min-h-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 bg-white/85 backdrop-blur-md border-b border-brand-terracotta-light/15">
          <button
            onClick={() => { setSelectedPost(null); setComments([]); setReplyToCommentId(null); }}
            className="grid h-10 w-10 place-items-center rounded-full text-brand-brown-dark hover:bg-brand-light transition active:scale-95"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-brand-brown-light">
              {getCat(selectedPost.category).labelOverride || t(getCat(selectedPost.category).labelKey)}
            </p>
          </div>
          <button
            onClick={() => handleBookmarkPost(selectedPost.id)}
            className={`grid h-10 w-10 place-items-center rounded-full transition active:scale-95 ${
              bookmarkedPosts.has(selectedPost.id)
                ? 'text-amber-600 bg-amber-50'
                : 'text-brand-brown-light hover:bg-brand-light'
            }`}
            aria-label="Lưu"
          >
            <Bookmark size={17} fill={bookmarkedPosts.has(selectedPost.id) ? 'currentColor' : 'none'} />
          </button>
          {(isAdmin || selectedPost.user_id === currentUserId) && !isEditing && (
            <>
              <button
                onClick={() => startEditPost(selectedPost)}
                className="grid h-10 w-10 place-items-center rounded-full text-brand-terracotta hover:bg-brand-terracotta/10 transition active:scale-95"
                aria-label="Sửa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="grid h-10 w-10 place-items-center rounded-full text-red-500 hover:bg-red-50 transition active:scale-95"
                aria-label="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          <article className="px-4 sm:px-6 pt-5 pb-6">
            {isEditing ? (
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-brand-terracotta-light/25 bg-brand-light/50 text-sm font-black text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                  placeholder="Tiêu đề"
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-brand-terracotta-light/25 bg-brand-light/50 text-sm font-medium text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 resize-none"
                  placeholder="Nội dung"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setIsEditing(false); setEditTitle(''); setEditContent(''); }}
                    className="px-4 py-2 rounded-full bg-brand-light text-xs font-black text-brand-brown-dark hover:bg-brand-terracotta-light/20 transition"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={() => handleEditPost(selectedPost.id)}
                    className="px-4 py-2 rounded-full bg-brand-terracotta text-xs font-black text-white hover:bg-brand-brown-dark transition"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Author row */}
                <div className="flex items-center gap-2 text-xs text-brand-brown-light mb-3">
                  <span className="inline-flex items-center gap-1.5">
                    {selectedPost.is_anonymous
                      ? <ShieldCheck size={13} className="text-emerald-500" />
                      : <User size={13} className="text-brand-brown-light" />}
                    <span className="font-bold text-brand-brown-dark">{selectedPost.display_name}</span>
                  </span>
                  <span>·</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString('vi-VN')}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={11} /> {selectedPost.views_count}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-xl sm:text-2xl font-black text-brand-brown-dark leading-tight mb-4">
                  {selectedPost.title}
                </h1>

                {/* Content */}
                <div className="text-[15px] leading-relaxed text-brand-brown-dark/95 whitespace-pre-wrap mb-6">
                  {selectedPost.content}
                </div>
              </>
            )}

            {/* Action pills */}
            {!isEditing && (
            <div className="flex flex-wrap items-center gap-2 pb-5 border-b border-brand-terracotta-light/20">
              <button
                onClick={() => handleLikePost(selectedPost.id, true)}
                className={`forum-action-pill ${likedPosts.has(selectedPost.id) ? 'is-like' : ''}`}
              >
                <ThumbsUp size={14} fill={likedPosts.has(selectedPost.id) ? 'currentColor' : 'none'} />
                <span>{selectedPost.likes_count}</span>
              </button>
              <button
                onClick={() => handleLikePost(selectedPost.id, false)}
                className={`forum-action-pill ${dislikedPosts.has(selectedPost.id) ? 'is-dislike' : ''}`}
              >
                <ThumbsDown size={14} fill={dislikedPosts.has(selectedPost.id) ? 'currentColor' : 'none'} />
                <span>{selectedPost.dislikes_count}</span>
              </button>
              <button
                onClick={() => handleSharePost(selectedPost.id)}
                className="forum-action-pill ml-auto"
              >
                {copiedPostId === selectedPost.id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                <span>{copiedPostId === selectedPost.id ? 'Đã copy' : 'Chia sẻ'}</span>
              </button>
            </div>
            )}
          </article>

          {/* Comments */}
          <section className="px-4 sm:px-6 pt-5">
            <h2 className="text-sm font-black text-brand-brown-dark mb-4">
              Bình luận <span className="text-brand-brown-light">{selectedPost.comments_count}</span>
            </h2>

            {rootComments.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle size={32} className="text-brand-terracotta/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-brand-brown-light">Chưa có bình luận</p>
                <p className="text-xs text-brand-brown-light/70 mt-1">Hãy là người đầu tiên chia sẻ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rootComments.map(comment => {
                  const replies = commentReplies(comment.id)
                  return (
                    <div key={comment.id}>
                      <CommentItem
                        comment={comment}
                        liked={likedComments.has(comment.id)}
                        onLike={() => handleLikeComment(comment.id)}
                        onReply={() => {
                          setReplyToCommentId(comment.id)
                          setReplyToDisplayName(comment.display_name)
                        }}
                        onDelete={() => handleDeleteComment(comment.id)}
                        isAdminOrOwner={isAdmin || comment.user_id === currentUserId}
                      />
                      {replies.length > 0 && (
                        <div className="forum-reply-thread mt-3 ml-5 space-y-3">
                          {replies.map((reply, idx) => (
                            <div
                              key={reply.id}
                              className={`forum-reply-item ${idx === replies.length - 1 ? 'is-last' : ''}`}
                            >
                              <CommentItem
                                comment={reply}
                                liked={likedComments.has(reply.id)}
                                onLike={() => handleLikeComment(reply.id)}
                                onReply={() => {
                                  setReplyToCommentId(comment.id)
                                  setReplyToDisplayName(reply.display_name)
                                }}
                                onDelete={() => handleDeleteComment(reply.id)}
                                isAdminOrOwner={isAdmin || reply.user_id === currentUserId}
                                isReply
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Fixed bottom comment bar */}
        <form
          onSubmit={handleSubmitComment}
          className="forum-comment-bar sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-terracotta-light/20 px-3 py-2.5 z-20"
        >
          {replyToCommentId && (
            <div className="flex items-center justify-between gap-2 mb-2 px-3 py-1.5 bg-brand-light rounded-lg text-[11px] font-bold text-brand-terracotta">
              <span className="truncate">Đang trả lời <strong>{replyToDisplayName}</strong></span>
              <button
                type="button"
                onClick={() => { setReplyToCommentId(null); setReplyToDisplayName(''); setNewComment(''); }}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-white"
              >
                <X size={11} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!currentUserId}
              onClick={() => setIsAnonComment(v => !v)}
              className={`forum-anon-toggle shrink-0 ${(!currentUserId || isAnonComment) ? 'is-anon' : 'is-public'}`}
              title={!currentUserId ? 'Khách luôn ẩn danh' : (isAnonComment ? 'Đang ẩn danh' : `Đăng với tên ${username}`)}
            >
              <span className="forum-anon-switch" />
              {(!currentUserId || isAnonComment) ? (
                <><ShieldCheck size={12} /><span>Ẩn danh</span></>
              ) : (
                <><User size={12} /><span className="truncate max-w-[60px]">{username}</span></>
              )}
            </button>
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              maxLength={1000}
              className="flex-1 h-10 px-4 rounded-full bg-brand-light text-sm font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/60 focus:ring-2 focus:ring-brand-terracotta/30"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-terracotta text-white hover:bg-brand-brown-dark transition active:scale-95 disabled:opacity-40 shadow-md shadow-brand-terracotta/20"
            >
              {submittingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WRITE COMPOSER (fullscreen overlay)
  // ─────────────────────────────────────────────────────────────────────────
  if (isWriting) {
    return (
      <div className="forum-v2 flex-1 w-full max-w-[760px] mx-auto flex flex-col min-h-0">
        <header className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-brand-terracotta-light/15">
          <button
            onClick={() => setIsWriting(false)}
            className="grid h-10 w-10 place-items-center rounded-full text-brand-brown-dark hover:bg-brand-light transition active:scale-95"
            aria-label="Hủy"
          >
            <X size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-black text-brand-brown-dark">{t('forum.newPost')}</p>
          </div>
          <button
            type="submit"
            form="forum-write-form"
            disabled={!writeTitle.trim() || !writeContent.trim() || submittingPost}
            className="px-4 h-9 rounded-full bg-brand-terracotta text-white text-xs font-black hover:bg-brand-brown-dark transition active:scale-95 disabled:opacity-40"
          >
            {submittingPost ? '...' : 'Đăng'}
          </button>
        </header>

        <form id="forum-write-form" onSubmit={handleSubmitPost} className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Category chips */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1 forum-scrollbar-hide">
              {CATEGORIES.slice(1).map(cat => {
                const CatIcon = cat.Icon
                const active = writeCat === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setWriteCat(cat.value as any)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black border transition active:scale-95 ${
                      active
                        ? 'bg-brand-brown-dark text-white border-brand-brown-dark'
                        : 'bg-white text-brand-brown-light border-brand-terracotta-light/25 hover:border-brand-terracotta/40'
                    }`}
                  >
                    <CatIcon size={13} />
                    {cat.labelOverride || t(cat.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={writeTitle}
            onChange={e => setWriteTitle(e.target.value)}
            placeholder="Tiêu đề bài viết"
            maxLength={100}
            required
            className="mx-4 mt-3 py-3 text-lg font-black text-brand-brown-dark bg-transparent outline-none border-b border-brand-terracotta-light/20 placeholder:text-brand-brown-light/40"
          />

          {/* Content */}
          <textarea
            value={writeContent}
            onChange={e => setWriteContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm, hỏi đáp, lời khuyên..."
            maxLength={4000}
            required
            className="flex-1 mx-4 mt-3 mb-4 py-2 text-sm leading-relaxed text-brand-brown-dark bg-transparent outline-none placeholder:text-brand-brown-light/40 resize-none min-h-[300px]"
          />

          {/* Footer: anonymous toggle */}
          <div className="sticky bottom-0 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-brand-terracotta-light/15 flex items-center justify-between">
            <div className="text-[11px] text-brand-brown-light/70 font-medium">
              {writeContent.length}/4000
            </div>
            <button
              type="button"
              onClick={() => setIsAnon(v => !v)}
              className={`forum-anon-toggle ${isAnon ? 'is-anon' : 'is-public'}`}
            >
              <span className="forum-anon-switch" />
              {isAnon ? (
                <><ShieldCheck size={12} /><span>Ẩn danh</span></>
              ) : (
                <><User size={12} /><span className="truncate max-w-[80px]">{username}</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FEED VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="forum-v2 flex-1 w-full max-w-[760px] mx-auto flex flex-col min-h-0 relative">
      {/* Sticky glassmorphism header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-brand-terracotta-light/15">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={onBackToLobby}
            className="grid h-10 w-10 place-items-center rounded-full text-brand-brown-dark hover:bg-brand-light transition active:scale-95 lg:hidden"
            aria-label="Lobby"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-brand-brown-dark">
              Bảng tin
            </h1>
            <div className="h-[3px] w-12 mt-0.5 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-brown-dark" />
          </div>
          <button
            onClick={() => setShowSearch(v => !v)}
            className={`grid h-10 w-10 place-items-center rounded-full transition active:scale-95 ${
              showSearch ? 'bg-brand-terracotta text-white' : 'text-brand-brown-dark hover:bg-brand-light'
            }`}
            aria-label="Tìm kiếm"
          >
            <Search size={17} />
          </button>
        </div>

        {/* Search bar (expandable) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-brand-light border border-brand-terracotta-light/15">
              <Search size={14} className="text-brand-brown-light shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết..."
                className="flex-1 bg-transparent text-sm font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="grid h-5 w-5 place-items-center rounded-full hover:bg-white"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category pill tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto forum-scrollbar-hide">
            {CATEGORIES.map(cat => {
              const CatIcon = cat.Icon
              const active = catFilter === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setCatFilter(cat.value)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border transition active:scale-95 ${
                    active
                      ? 'bg-brand-brown-dark text-white border-brand-brown-dark'
                      : 'bg-white text-brand-brown-light border-brand-terracotta-light/25 hover:border-brand-terracotta/40'
                  }`}
                >
                  <CatIcon size={12} />
                  {cat.labelOverride || t(cat.labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        {/* Trending card */}
        {trendingPost && catFilter === 'all' && !searchQuery && (
          <button
            onClick={() => handlePostClick(trendingPost)}
            className="forum-trending-card w-full text-left mx-auto mt-4 mb-3 block"
          >
            <div className="mx-4 rounded-2xl border border-brand-terracotta-light/20 bg-gradient-to-br from-white via-white to-brand-light/40 p-4 shadow-[0_8px_24px_rgba(76,55,49,0.06)] hover:shadow-[0_12px_32px_rgba(76,55,49,0.10)] transition group">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-600 mb-2">
                <Flame size={13} className="fill-orange-500 text-orange-500" />
                <span>Đang hot</span>
                <span className="ml-auto text-brand-brown-light/60 font-bold">{timeAgo(trendingPost.created_at)}</span>
              </div>
              <h3 className="font-display font-black text-base text-brand-brown-dark group-hover:text-brand-terracotta transition leading-snug line-clamp-2">
                {trendingPost.title}
              </h3>
              <p className="text-xs text-brand-brown-light line-clamp-1 mt-1.5">
                {trendingPost.content}
              </p>
              <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-brand-brown-light/80">
                <span className="inline-flex items-center gap-1"><ThumbsUp size={11} />{trendingPost.likes_count}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{trendingPost.comments_count}</span>
                <span className="inline-flex items-center gap-1"><Eye size={11} />{trendingPost.views_count}</span>
              </div>
            </div>
          </button>
        )}

        {/* Posts list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="animate-spin text-brand-terracotta/50 mb-2" size={28} />
            <p className="text-sm font-bold text-brand-brown-light">Đang tải bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <MessageSquare size={36} className="text-brand-terracotta/30 mx-auto mb-3" />
            <h4 className="font-display font-black text-base text-brand-brown-dark mb-1">
              {searchQuery ? 'Không tìm thấy' : 'Chưa có bài viết'}
            </h4>
            <p className="text-xs text-brand-brown-light">
              {searchQuery ? 'Thử từ khóa khác hoặc đổi bộ lọc' : 'Hãy là người đầu tiên chia sẻ!'}
            </p>
          </div>
        ) : (
          <div>
            {filteredPosts.map(post => {
              const cat = getCat(post.category)
              return (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="cursor-pointer border-b border-brand-terracotta-light/12 px-4 py-4 hover:bg-brand-light/30 transition active:bg-brand-light/50"
                >
                  <span
                    className="inline-block rounded-md px-2 py-0.5 text-[10px] font-black mb-2"
                    style={{ color: cat.color, background: cat.bg }}
                  >
                    {cat.labelOverride || t(cat.labelKey)}
                  </span>
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-black text-[15px] text-brand-brown-dark leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] text-brand-brown-light line-clamp-1 leading-snug">
                        {post.content}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-brand-brown-light/80">
                        <span className="inline-flex items-center gap-1 font-bold text-brand-brown-dark/80">
                          {post.is_anonymous
                            ? <ShieldCheck size={11} className="text-emerald-500" />
                            : <User size={11} />}
                          {post.display_name}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(post.created_at)}</span>
                        <span className="ml-auto flex items-center gap-2.5 font-bold">
                          <span className="inline-flex items-center gap-1"><ThumbsUp size={11} />{post.likes_count}</span>
                          <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{post.comments_count}</span>
                        </span>
                      </div>
                    </div>
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-brand-light">
                        <img src={post.image_urls[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB Viết bài */}
      <button
        onClick={() => setIsWriting(true)}
        className="forum-fab fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-12 px-5 rounded-full bg-brand-terracotta text-white font-black text-sm shadow-[0_8px_24px_rgba(193,124,99,0.4)] hover:bg-brand-brown-dark transition active:scale-95"
      >
        <Plus size={18} />
        <span>Viết bài</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// COMMENT ITEM COMPONENT
// ─────────────────────────────────────────────────────────────────────────
function CommentItem({
  comment,
  liked,
  onLike,
  onReply,
  onDelete,
  isAdminOrOwner,
  isReply = false
}: {
  comment: CommunityComment
  liked: boolean
  onLike: () => void
  onReply: () => void
  onDelete: () => void
  isAdminOrOwner: boolean
  isReply?: boolean
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(() => {
    if (!comment.expires_at) return null
    return new Date(comment.expires_at).getTime() - Date.now()
  })

  useEffect(() => {
    if (!comment.expires_at) return
    const tick = () => setRemainingMs(new Date(comment.expires_at!).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [comment.expires_at])

  const showCountdown = remainingMs !== null && remainingMs > 0
  const totalDurationMs = 3 * 3600 * 1000
  const progressPct = showCountdown ? Math.max(0, Math.min(100, (remainingMs! / totalDurationMs) * 100)) : 0

  if (comment.expires_at && remainingMs !== null && remainingMs <= 0) {
    return null
  }

  // Initials avatar
  const initial = comment.display_name.charAt(0).toUpperCase()
  const isAnon = comment.is_anonymous

  return (
    <div className={`flex gap-2.5 ${isReply ? '' : ''}`}>
      {/* Avatar */}
      <div className={`shrink-0 grid place-items-center rounded-full font-black text-white text-xs ${
        isAnon ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-brand-terracotta to-brand-brown-dark'
      } ${isReply ? 'h-7 w-7' : 'h-8 w-8'}`}>
        {isAnon ? <ShieldCheck size={isReply ? 12 : 14} /> : initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <strong className={`text-[13px] font-black ${comment.is_author ? 'text-brand-terracotta' : 'text-brand-brown-dark'}`}>
            {comment.display_name}
          </strong>
          {comment.is_author && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-terracotta/10 text-brand-terracotta">
              Tác giả
            </span>
          )}
          <span className="text-[11px] text-brand-brown-light/70 ml-auto">{timeAgo(comment.created_at)}</span>
          {isAdminOrOwner && (
            <button
              onClick={onDelete}
              className="text-brand-brown-light/60 hover:text-red-500 transition"
              title="Xóa"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <p className="text-sm text-brand-brown-dark/90 leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5 text-[12px]">
          <button
            type="button"
            onClick={onReply}
            className="font-bold text-brand-brown-light hover:text-brand-terracotta transition"
          >
            Trả lời
          </button>
          <button
            type="button"
            onClick={onLike}
            className={`inline-flex items-center gap-1 transition ${
              liked ? 'text-brand-terracotta font-bold' : 'text-brand-brown-light hover:text-brand-brown-dark'
            }`}
          >
            <ThumbsUp size={11} fill={liked ? 'currentColor' : 'none'} />
            <span>{comment.likes_count}</span>
          </button>
        </div>

        {/* Countdown bar — 3h self destruct */}
        {showCountdown && (
          <div className="mt-2 flex items-center gap-1.5">
            <Clock size={10} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-700 tabular-nums shrink-0">
                  {fmtCountdownHMS(remainingMs!)}
                </span>
              </div>
              <div className="h-1 rounded-full bg-amber-100 overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
