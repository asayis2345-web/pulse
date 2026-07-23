import type { Tab } from '@/App';
import { Home, Users, MessageCircle, User } from 'lucide-react';

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'feed', label: 'Akış', icon: Home },
    { id: 'servers', label: 'Sunucular', icon: Users },
    { id: 'dms', label: 'Mesajlar', icon: MessageCircle },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="shrink-0 bg-[#12131f] border-t border-white/5 flex items-center justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {items.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all"
          >
            <Icon
              size={24}
              className={active ? 'text-[#E1306C]' : 'text-gray-500'}
              strokeWidth={active ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium ${active ? 'text-[#E1306C]' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
