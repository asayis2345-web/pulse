import { useState, useEffect, useCallback } from 'react';
import { supabase, type Profile, type Post, type Server } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { X, Trash2, Users, Image, Server as ServerIcon, Shield, Loader2, Search } from 'lucide-react';

type AdminPanelProps = {
  onClose: () => void;
};

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'posts' | 'servers'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, postsRes, serversRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*, profiles!posts_user_id_fkey(*)').order('created_at', { ascending: false }).limit(100),
      supabase.from('servers').select('*').order('created_at', { ascending: false }),
    ]);
    setUsers((usersRes.data as Profile[]) || []);
    setPosts((postsRes.data as Post[]) || []);
    setServers((serversRes.data as Server[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeletePost = async (id: string) => {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Bu sunucuyu silmek istediğine emin misin?')) return;
    await supabase.from('servers').delete().eq('id', id);
    setServers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleAdmin = async (user: Profile) => {
    const newAdmin = !user.is_admin;
    await supabase.from('profiles').update({ is_admin: newAdmin }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: newAdmin } : u));
  };

  const handleDeleteUser = async (user: Profile) => {
    if (!confirm(`${user.username} kullanıcısını silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.admin.deleteUser(user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#0a0b14] z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="text-gray-400 active:scale-90 transition-transform">
          <X size={22} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Shield size={20} className="text-[#E1306C]" />
          <h1 className="text-xl font-bold text-white">Yönetim Paneli</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {[
          { id: 'users' as const, label: 'Kullanıcılar', icon: Users, count: users.length },
          { id: 'posts' as const, label: 'Gönderiler', icon: Image, count: posts.length },
          { id: 'servers' as const, label: 'Sunucular', icon: ServerIcon, count: servers.length },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                tab === t.id ? 'text-[#E1306C] border-b-2 border-[#E1306C]' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{t.label}</span>
              <span className="text-[10px] opacity-60">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-500" size={28} />
          </div>
        ) : tab === 'users' ? (
          <div>
            {/* Search */}
            <div className="px-4 py-3 sticky top-0 bg-[#0a0b14] border-b border-white/5">
              <div className="bg-[#1a1b2e] rounded-xl flex items-center px-3 py-2 border border-white/5">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm ml-2"
                />
              </div>
            </div>
            {filteredUsers.map((u) => (
              <div key={u.id} className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2f3148] overflow-hidden shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {u.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{u.username}</span>
                    {u.is_admin && (
                      <span className="text-[10px] ig-gradient text-white px-1.5 py-0.5 rounded font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('tr')}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleAdmin(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    u.is_admin
                      ? 'bg-[#1a1b2e] text-gray-400 border border-white/5'
                      : 'ig-gradient text-white'
                  }`}
                >
                  {u.is_admin ? 'Yetki Al' : 'Admin Yap'}
                </button>
                <button
                  onClick={() => handleDeleteUser(u)}
                  className="text-red-400 p-1.5 active:scale-90 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-20 text-gray-500">Kullanıcı bulunamadı</div>
            )}
          </div>
        ) : tab === 'posts' ? (
          <div>
            {posts.map((p) => (
              <div key={p.id} className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{p.profiles?.username || 'Bilinmeyen'}</div>
                  <div className="text-gray-500 text-xs truncate">{p.caption || 'Başlıksız'}</div>
                  <div className="text-gray-600 text-[11px]">
                    {new Date(p.created_at).toLocaleDateString('tr')}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="text-red-400 p-2 active:scale-90 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-20 text-gray-500">Gönderi yok</div>
            )}
          </div>
        ) : (
          <div>
            {servers.map((s) => (
              <div key={s.id} className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                  {s.icon_url ? (
                    <img src={s.icon_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    s.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{s.name}</div>
                  <div className="text-gray-500 text-xs">ID: {s.id.slice(0, 8)}...</div>
                </div>
                <button
                  onClick={() => handleDeleteServer(s.id)}
                  className="text-red-400 p-2 active:scale-90 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {servers.length === 0 && (
              <div className="text-center py-20 text-gray-500">Sunucu yok</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
