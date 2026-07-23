import { useState, useEffect } from 'react';
import { supabase, type Post, type Like, type Comment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Heart, MessageCircle, Send, MoreHorizontal, Plus, X, Loader2, LogOut, Zap, Shield } from 'lucide-react';
import { PulseLogo } from '@/components/PulseLogo';

export function ProfileScreen({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { profile, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, Like[]>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || '');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    if (!profile) return;
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (!postsData) { setLoading(false); return; }
    setPosts(postsData as Post[]);

    const likesMap: Record<string, Like[]> = {};
    const commentsMap: Record<string, Comment[]> = {};
    for (const post of postsData) {
      const { data: l } = await supabase.from('likes').select('*').eq('post_id', post.id);
      likesMap[post.id] = l || [];
      const { data: c } = await supabase.from('comments').select('*, profiles!comments_user_id_fkey(*)').eq('post_id', post.id);
      commentsMap[post.id] = (c as Comment[]) || [];
    }
    setLikes(likesMap);
    setComments(commentsMap);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({ username: editUsername, bio: editBio, avatar_url: editAvatar || null })
      .eq('id', profile.id);
    setShowEdit(false);
    window.location.reload();
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">Profil</h1>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <button
              onClick={onOpenAdmin}
              className="ig-gradient text-white p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold"
            >
              <Shield size={16} />
              Yönetim
            </button>
          )}
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="ig-story-ring">
              <div className="w-20 h-20 rounded-full bg-[#2f3148] border-2 border-[#0a0b14] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-white text-xl font-bold">{profile?.username}</div>
              <div className="text-gray-500 text-sm">{posts.length} gönderi</div>
            </div>
            <button
              onClick={() => {
                setEditUsername(profile?.username || '');
                setEditBio(profile?.bio || '');
                setEditAvatar(profile?.avatar_url || '');
                setShowEdit(true);
              }}
              className="px-4 py-2 bg-[#1a1b2e] text-white text-sm rounded-lg border border-white/5"
            >
              Düzenle
            </button>
          </div>
          {profile?.bio && (
            <p className="text-gray-300 text-sm">{profile.bio}</p>
          )}
        </div>

        {/* Posts grid */}
        <div className="border-t border-white/5 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-gray-500" size={28} />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Plus size={48} className="mb-3 opacity-30" />
              <p>Henüz gönderin yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => {
                const likeCount = (likes[post.id] || []).length;
                const commentCount = (comments[post.id] || []).length;
                return (
                  <div key={post.id} className="aspect-square relative group">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-4">
                      <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Heart size={16} fill="white" /> {likeCount}
                      </span>
                      <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <MessageCircle size={16} fill="white" /> {commentCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit profile modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowEdit(false)}>
          <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Profili Düzenle</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {editAvatar && (
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2">
                  <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Avatar URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Avatar görseli URL"
                  className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Biyografi</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Hakkında"
                  className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] resize-none"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Zap size={18} fill="white" /> Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
