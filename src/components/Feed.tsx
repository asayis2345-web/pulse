import { useState, useEffect } from 'react';
import { supabase, type Post, type Profile, type Like, type Comment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Heart, MessageCircle, Send, MoreHorizontal, Bookmark, Plus, X, Loader2 } from 'lucide-react';
import { StoryBar, StoryViewer } from '@/components/Stories';
import { PulseLogo } from '@/components/PulseLogo';

type FeedProps = {
  stories: import('@/lib/supabase').Story[];
  onStoriesChanged: () => void;
};

export function Feed({ stories, onStoriesChanged }: FeedProps) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, Like[]>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!postsData) { setLoading(false); return; }
    setPosts(postsData as Post[]);

    const likesMap: Record<string, Like[]> = {};
    const commentsMap: Record<string, Comment[]> = {};
    for (const post of postsData) {
      const { data: l } = await supabase.from('likes').select('*').eq('post_id', post.id);
      likesMap[post.id] = l || [];
      const { data: c } = await supabase
        .from('comments')
        .select('*, profiles!comments_user_id_fkey(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      commentsMap[post.id] = (c as Comment[]) || [];
    }
    setLikes(likesMap);
    setComments(commentsMap);
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!profile) return;
    const existing = likes[postId]?.find((l) => l.user_id === profile.id);
    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      setLikes((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((l) => l.id !== existing.id),
      }));
    } else {
      const { data } = await supabase.from('likes').insert({ post_id: postId }).select('*').single();
      if (data) {
        setLikes((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data as Like],
        }));
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!profile || !commentText[postId]?.trim()) return;
    const text = commentText[postId].trim();
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, text })
      .select('*, profiles!comments_user_id_fkey(*)')
      .single();
    if (data) {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data as Comment],
      }));
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <PulseLogo size={32} />
          <h1 className="text-xl font-bold ig-gradient-text">Pulse</h1>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="ig-gradient text-white p-2 rounded-xl shadow-lg"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stories */}
        <div className="px-4 pt-3 pb-2">
          <StoryBar
            stories={stories}
            onView={(i) => { setStoryViewerIndex(i); setShowStoryViewer(true); }}
            onAdd={() => setShowCreateStory(true)}
          />
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">Henüz gönderi yok</p>
            <p className="text-sm">İlk gönderini oluştur!</p>
          </div>
        ) : (
          <div className="pb-4">
            {posts.map((post) => {
              const postLikes = likes[post.id] || [];
              const postComments = comments[post.id] || [];
              const liked = postLikes.some((l) => l.user_id === profile?.id);
              const showAll = expandedComments.has(post.id);
              const visibleComments = showAll ? postComments : postComments.slice(0, 2);

              return (
                <div key={post.id} className="border-b border-white/5 animate-fade-in">
                  {/* Post header */}
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="ig-story-ring">
                        <div className="w-8 h-8 rounded-full bg-[#2f3148] border-2 border-[#0a0b14] overflow-hidden">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">{post.profiles?.username || 'Bilinmeyen'}</div>
                        <div className="text-gray-500 text-[11px]">
                          {new Date(post.created_at).toLocaleDateString('tr', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-500">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  {/* Image */}
                  <div className="relative w-full aspect-square bg-black" onClick={() => handleLike(post.id)}>
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Actions */}
                  <div className="px-4 pt-2.5">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-gray-300 active:scale-90 transition-transform"
                      >
                        <Heart
                          size={24}
                          className={liked ? 'fill-[#E1306C] text-[#E1306C]' : ''}
                        />
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="text-gray-300 active:scale-90 transition-transform"
                      >
                        <MessageCircle size={24} />
                      </button>
                      <button className="text-gray-300 active:scale-90 transition-transform">
                        <Send size={24} />
                      </button>
                      <div className="flex-1" />
                      <button className="text-gray-300 active:scale-90 transition-transform">
                        <Bookmark size={24} />
                      </button>
                    </div>

                    {/* Likes count */}
                    <div className="mt-1.5 text-white text-sm font-semibold">
                      {postLikes.length} beğeni
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <div className="mt-1 text-sm text-gray-300">
                        <span className="font-semibold text-white">{post.profiles?.username}</span>{' '}
                        {post.caption}
                      </div>
                    )}

                    {/* Comments */}
                    {postComments.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {visibleComments.map((c) => (
                          <div key={c.id} className="text-sm text-gray-300">
                            <span className="font-semibold text-white">{c.profiles?.username}</span>{' '}
                            {c.text}
                          </div>
                        ))}
                        {postComments.length > 2 && !showAll && (
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="text-gray-500 text-xs"
                          >
                            {postComments.length - 2} yorumun tümünü gör
                          </button>
                        )}
                      </div>
                    )}

                    {/* Comment input */}
                    <div className="mt-2 flex items-center gap-2 pb-2.5">
                      <input
                        type="text"
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleComment(post.id); }}
                        placeholder="Yorum ekle..."
                        className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none py-1"
                      />
                      {commentText[post.id]?.trim() && (
                        <button
                          onClick={() => handleComment(post.id)}
                          className="text-[#E1306C] text-sm font-semibold active:scale-90 transition-transform"
                        >
                          Gönder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create post modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} onCreated={() => { loadPosts(); setShowCreatePost(false); }} />
      )}

      {/* Create story modal */}
      {showCreateStory && (
        <CreateStoryModal onClose={() => setShowCreateStory(false)} onCreated={() => { onStoriesChanged(); setShowCreateStory(false); }} />
      )}

      {/* Story viewer */}
      {showStoryViewer && (
        <StoryViewer
          stories={stories}
          initialIndex={storyViewerIndex}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </div>
  );
}

function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!imageUrl.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      image_url: imageUrl.trim(),
      caption: caption.trim() || null,
    });
    setLoading(false);
    if (!error) onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Gönderi Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {imageUrl && (
            <div className="aspect-square rounded-xl overflow-hidden bg-black">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Görsel URL'si"
            className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Başlık ekle..."
            rows={3}
            className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] resize-none"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !imageUrl.trim()}
            className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Paylaş'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!imageUrl.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('stories').insert({ image_url: imageUrl.trim() });
    setLoading(false);
    if (!error) onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Hikaye Ekle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        {imageUrl && (
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black mb-4 max-h-64 mx-auto">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Görsel URL'si"
          className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] mb-4"
          autoFocus
        />
        <button
          onClick={handleCreate}
          disabled={loading || !imageUrl.trim()}
          className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Paylaş'}
        </button>
      </div>
    </div>
  );
}
