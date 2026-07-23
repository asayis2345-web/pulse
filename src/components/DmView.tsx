import { useState, useEffect, useRef } from 'react';
import { supabase, type DmMessage, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Send, ArrowLeft, Loader2, User } from 'lucide-react';

type DmViewProps = {
  conversationId: string;
  partner: Profile | null;
  onBack: () => void;
};

export function DmView({ conversationId, partner, onBack }: DmViewProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DmMessage]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as DmMessage[]) || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    await supabase.from('dm_messages').insert({ conversation_id: conversationId, text: msgText });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0b14]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/5 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={onBack} className="text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#2f3148] overflow-hidden shrink-0">
          {partner?.avatar_url ? (
            <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {partner?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <span className="text-white font-semibold flex-1">{partner?.username || 'Bilinmeyen'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-500" size={28} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p>{partner?.username} ile sohbete başla</p>
            <p className="text-sm mt-1">İlk mesajı gönder!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === profile?.id;
              const prev = messages[i - 1];
              const showHeader = !prev || prev.user_id !== msg.user_id ||
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000);
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showHeader ? 'mt-3' : 'mt-0.5'}`}>
                  {!isOwn && showHeader && (
                    <div className="w-8 h-8 rounded-full bg-[#2f3148] overflow-hidden mr-2 shrink-0">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                          {partner?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showHeader && !isOwn && (
                      <span className="text-[11px] text-gray-500 mb-0.5">{partner?.username}</span>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm break-words ${
                      isOwn
                        ? 'ig-gradient text-white rounded-br-md'
                        : 'bg-[#1a1b2e] text-gray-200 rounded-bl-md'
                    }`}>
                      {msg.text}
                    </div>
                    {showHeader && (
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
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
            placeholder="Mesaj yaz..."
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
