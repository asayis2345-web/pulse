import { useState, useEffect } from 'react';
import { supabase, type Server, type Channel } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Hash, Plus, X, Users, ChevronRight, Loader2 } from 'lucide-react';
import { PulseLogo } from '@/components/PulseLogo';

type ServersScreenProps = {
  servers: Server[];
  channels: Channel[];
  onRefresh: () => void;
  onOpenChannel: (serverId: string, channelId: string) => void;
};

export function ServersScreen({ servers, channels, onRefresh, onOpenChannel }: ServersScreenProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [serverName, setServerName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleServer = (id: string) => {
    setExpandedServers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!serverName.trim()) return;
    setLoading(true);
    const { data: server } = await supabase
      .from('servers')
      .insert({ name: serverName.trim() })
      .select()
      .single();
    if (server) {
      await supabase.from('server_members').insert({ server_id: server.id });
      await supabase.from('channels').insert({ server_id: server.id, name: 'genel' });
      setServerName('');
      setShowCreate(false);
      onRefresh();
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('server_members').insert({ server_id: joinId.trim() });
    if (error) {
      alert('Sunucu bulunamadı veya zaten üyesiniz');
    } else {
      setJoinId('');
      setShowJoin(false);
      onRefresh();
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">Sunucular</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="w-9 h-9 rounded-full bg-[#1a1b2e] flex items-center justify-center text-blue-400"
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full ig-gradient flex items-center justify-center text-white"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Server list */}
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8">
            <PulseLogo size={56} className="mb-4 opacity-50" />
            <p className="text-lg mb-2">Sunucun yok</p>
            <p className="text-sm text-center">Bir sunucu oluştur veya arkadaşının sunucusuna katıl!</p>
          </div>
        ) : (
          <div className="py-2">
            {servers.map((s) => {
              const expanded = expandedServers.has(s.id);
              const serverChannels = channels.filter((c) => c.server_id === s.id);
              return (
                <div key={s.id} className="mb-1">
                  <button
                    onClick={() => toggleServer(s.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-2xl ig-gradient flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                      {s.icon_url ? (
                        <img src={s.icon_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        s.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{s.name}</div>
                      <div className="text-gray-500 text-xs">{serverChannels.length} kanal</div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="ml-4 border-l border-white/5 pl-2 animate-fade-in">
                      {serverChannels.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500 text-sm">Kanal yok</div>
                      ) : (
                        serverChannels.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => onOpenChannel(s.id, ch.id)}
                            className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <Hash size={16} className="text-gray-500" />
                            <span className="text-gray-300 text-sm">{ch.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create server modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Sunucu Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Sunucu adı"
              className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] mb-4"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={loading || !serverName.trim()}
              className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Join server modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowJoin(false)}>
          <div className="bg-[#1a1b2e] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Sunucuya Katıl</h2>
              <button onClick={() => setShowJoin(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-gray-400 text-sm mb-3">Sunucu ID'sini girin:</p>
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Sunucu ID"
              className="w-full bg-[#0a0b14] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] mb-4"
              autoFocus
            />
            <button
              onClick={handleJoin}
              disabled={loading || !joinId.trim()}
              className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Katıl'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
