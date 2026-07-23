import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase, type Server, type Channel, type DmConversation, type Profile, type Story } from '@/lib/supabase';
import { Auth } from '@/components/Auth';
import { Feed } from '@/components/Feed';
import { ChannelView } from '@/components/ChannelView';
import { DmView } from '@/components/DmView';
import { ServersScreen } from '@/components/ServersScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { BottomNav } from '@/components/BottomNav';
import { AdminPanel } from '@/components/AdminPanel';
import { Loader2 } from 'lucide-react';

export type Tab = 'feed' | 'servers' | 'dms' | 'profile';

export type View =
  | { type: 'feed' }
  | { type: 'channel'; serverId: string; channelId: string }
  | { type: 'dm'; conversationId: string };

function AppContent() {
  const { session, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('feed');
  const [view, setView] = useState<View>({ type: 'feed' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);
  const [dmPartners, setDmPartners] = useState<Record<string, Profile>>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [bootLoading, setBootLoading] = useState(true);

  const loadServers = useCallback(async () => {
    const { data: memberRows } = await supabase
      .from('server_members')
      .select('server_id')
      .eq('user_id', session!.user.id);
    if (!memberRows || memberRows.length === 0) { setServers([]); return; }
    const serverIds = memberRows.map((m) => m.server_id);
    const { data: serverRows } = await supabase
      .from('servers')
      .select('*')
      .in('id', serverIds);
    setServers((serverRows as Server[]) || []);
  }, [session]);

  const loadChannels = useCallback(async () => {
    if (servers.length === 0) { setChannels([]); return; }
    const serverIds = servers.map((s) => s.id);
    const { data: channelRows } = await supabase
      .from('channels')
      .select('*')
      .in('server_id', serverIds);
    setChannels((channelRows as Channel[]) || []);
  }, [servers]);

  const loadDMs = useCallback(async () => {
    const { data: dmMemberRows } = await supabase
      .from('dm_members')
      .select('conversation_id')
      .eq('user_id', session!.user.id);
    if (!dmMemberRows || dmMemberRows.length === 0) { setDmConversations([]); return; }
    const convIds = dmMemberRows.map((m) => m.conversation_id);
    const { data: convRows } = await supabase
      .from('dm_conversations')
      .select('*')
      .in('id', convIds);
    setDmConversations((convRows as DmConversation[]) || []);

    const partnersMap: Record<string, Profile> = {};
    for (const convId of convIds) {
      const { data: otherMembers } = await supabase
        .from('dm_members')
        .select('user_id')
        .eq('conversation_id', convId)
        .neq('user_id', session!.user.id);
      if (otherMembers && otherMembers.length > 0) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherMembers[0].user_id)
          .maybeSingle();
        if (p) partnersMap[convId] = p as Profile;
      }
    }
    setDmPartners(partnersMap);
  }, [session]);

  const loadStories = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: storyRows } = await supabase
      .from('stories')
      .select('*, profiles!stories_user_id_fkey(*)')
      .gt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });
    setStories((storyRows as Story[]) || []);
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setBootLoading(true);
      await Promise.all([loadServers(), loadDMs(), loadStories()]);
      setBootLoading(false);
    })();
  }, [session]);

  useEffect(() => {
    if (session) loadChannels();
  }, [session, servers, loadChannels]);

  const navigateToChannel = (serverId: string, channelId: string) => {
    setView({ type: 'channel', serverId, channelId });
  };

  const navigateToDM = (conversationId: string) => {
    setView({ type: 'dm', conversationId });
  };

  const goBack = () => {
    setView({ type: 'feed' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0b14] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E1306C]" size={40} />
      </div>
    );
  }

  if (!session) return <Auth />;

  if (bootLoading) {
    return (
      <div className="h-screen bg-[#0a0b14] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E1306C]" size={40} />
      </div>
    );
  }

  const currentChannel = view.type === 'channel' ? channels.find((c) => c.id === view.channelId) : null;
  const currentDmPartner = view.type === 'dm' ? dmPartners[view.conversationId] : null;

  // Full-screen chat views (no bottom nav)
  if (view.type === 'channel' && currentChannel) {
    return (
      <div className="h-screen bg-[#0a0b14] overflow-hidden">
        <ChannelView
          serverId={view.serverId}
          channelId={view.channelId}
          channelName={currentChannel.name}
          onBack={goBack}
        />
      </div>
    );
  }

  if (view.type === 'dm') {
    return (
      <div className="h-screen bg-[#0a0b14] overflow-hidden">
        <DmView conversationId={view.conversationId} partner={currentDmPartner || null} onBack={goBack} />
      </div>
    );
  }

  // Tab views with bottom nav
  return (
    <div className="h-screen bg-[#0a0b14] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {tab === 'feed' && <Feed stories={stories} onStoriesChanged={loadStories} />}
        {tab === 'servers' && (
          <ServersScreen
            servers={servers}
            channels={channels}
            onRefresh={loadServers}
            onOpenChannel={navigateToChannel}
          />
        )}
        {tab === 'dms' && (
          <DmListScreen
            dmConversations={dmConversations}
            dmPartners={dmPartners}
            onRefresh={loadDMs}
            onOpenDM={navigateToDM}
          />
        )}
        {tab === 'profile' && <ProfileScreen onOpenAdmin={() => setShowAdmin(true)} />}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

// DM list screen for mobile
function DmListScreen({
  dmConversations,
  dmPartners,
  onRefresh,
  onOpenDM,
}: {
  dmConversations: DmConversation[];
  dmPartners: Record<string, Profile>;
  onRefresh: () => void;
  onOpenDM: (id: string) => void;
}) {
  const { profile } = useAuth();
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchUsername.trim()}%`)
      .neq('id', profile!.id)
      .limit(10);
    setSearchResults((data as Profile[]) || []);
  };

  const handleStartDM = async (otherUser: Profile) => {
    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from('dm_members')
      .select('conversation_id')
      .eq('user_id', profile!.id);
    if (myConvs) {
      for (const mc of myConvs) {
        const { data: other } = await supabase
          .from('dm_members')
          .select('user_id')
          .eq('conversation_id', mc.conversation_id)
          .neq('user_id', profile!.id);
        if (other && other[0]?.user_id === otherUser.id) {
          onOpenDM(mc.conversation_id);
          setShowNewDM(false);
          setSearchUsername('');
          setSearchResults([]);
          return;
        }
      }
    }
    // Create new
    const { data: conv } = await supabase
      .from('dm_conversations')
      .insert({})
      .select()
      .single();
    if (conv) {
      await supabase.from('dm_members').insert([
        { conversation_id: conv.id, user_id: profile!.id },
        { conversation_id: conv.id, user_id: otherUser.id },
      ]);
      await onRefresh();
      onOpenDM(conv.id);
      setShowNewDM(false);
      setSearchUsername('');
      setSearchResults([]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">Mesajlar</h1>
        <button
          onClick={() => setShowNewDM(true)}
          className="text-[#E1306C]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {dmConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8">
            <p className="text-lg mb-2">Henüz mesajın yok</p>
            <p className="text-sm">Yeni bir sohbet başlat!</p>
          </div>
        ) : (
          dmConversations.map((conv) => {
            const partner = dmPartners[conv.id];
            return (
              <button
                key={conv.id}
                onClick={() => onOpenDM(conv.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-[#2f3148] overflow-hidden shrink-0">
                  {partner?.avatar_url ? (
                    <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {partner?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{partner?.username || 'Bilinmeyen'}</div>
                  <div className="text-gray-500 text-sm truncate">Sohbete başla</div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {showNewDM && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowNewDM(false)}>
          <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Yeni Sohbet</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Kullanıcı adı ara..."
                className="flex-1 bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]"
                autoFocus
              />
              <button onClick={handleSearch} className="ig-gradient text-white px-4 rounded-xl">Ara</button>
            </div>
            <div className="space-y-2">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStartDM(p)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2f3148] overflow-hidden shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {p.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white">{p.username}</span>
                </button>
              ))}
              {searchResults.length === 0 && searchUsername && (
                <p className="text-gray-500 text-sm text-center py-4">Sonuç yok</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div
      style={{
        color: 'white',
        background: '#0a0b14',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
      }}
    >
      Pulse çalışıyor 🚀
    </div>
  );
}
