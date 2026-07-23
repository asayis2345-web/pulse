import { useState, useEffect, useRef } from 'react';
import { supabase, type Message, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Hash, Send, ArrowLeft, Loader2 } from 'lucide-react';

type ChannelViewProps = {
  serverId: string;
  channelId: string;
  channelName: string;
  onBack: () => void;
};

export function ChannelView({ serverId, channelId, channelName, onBack }: ChannelViewProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_user_id_fkey(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as Message[]) || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    await supabase.from('messages').insert({ channel_id: channelId, text: msgText });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/5 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={onBack} className="text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <Hash size={20} className="text-gray-500" />
        <span className="text-white font-semibold flex-1">{channelName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-500" size={28} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Hash size={48} className="mx-auto mb-4 opacity-30" />
            <p>Bu kanalda henüz mesaj yok</p>
            <p className="text-sm mt-1">İlk mesajı sen at!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showHeader = !prev || prev.user_id !== msg.user_id ||
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000);
              const isOwn = msg.user_id === profile?.id;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${showHeader ? 'mt-3' : 'mt-0.5'}`}>
                  <div className="w-9 shrink-0">
                    {showHeader && (
                      <div className="w-9 h-9 rounded-full bg-[#2f3148] overflow-hidden">
                        {msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                            {msg.profiles?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {showHeader && (
                      <div className="flex items-baseline gap-2">
                        <span className={`font-semibold text-sm ${isOwn ? 'ig-gradient-text' : 'text-white'}`}>
                          {msg.profiles?.username || 'Bilinmeyen'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(msg.created_at).toLocaleString('tr', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    <div className="text-gray-300 text-sm break-words">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shrink-0">
        <div className="bg-[#1a1b2e] rounded-2xl flex items-center px-3 py-2 border border-white/5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={`#${channelName} kanalına yaz`}
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="text-[#E1306C] active:scale-90 transition-transform disabled:opacity-30 ml-2"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
