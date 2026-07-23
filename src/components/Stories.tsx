import { useState, useEffect, useRef } from 'react';
import { supabase, type Story, type Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

type StoryViewerProps = {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
};

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const current = stories[index];

  useEffect(() => {
    if (!current) return;
    setProgress(0);
    // Record view
    supabase.from('story_views').insert({ story_id: current.id }).then(() => {});

    const start = Date.now();
    const duration = 5000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (index < stories.length - 1) {
          setIndex(index + 1);
        } else {
          onClose();
        }
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [index, stories.length, onClose, current]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X size={24} />
      </button>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex(index - 1); }}
          className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next */}
      {index < stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex(index + 1); }}
          className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Story content */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-6 left-4 z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#3a3d5c] overflow-hidden">
            {current.profiles?.avatar_url && (
              <img src={current.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-white text-sm font-semibold">
            {current.profiles?.username || 'Bilinmeyen'}
          </span>
          <span className="text-gray-400 text-xs">
            {new Date(current.created_at).toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4 pt-16">
          <img src={current.image_url} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      </div>
    </div>
  );
}

type StoryBarProps = {
  stories: Story[];
  onView: (index: number) => void;
  onAdd: () => void;
};

export function StoryBar({ stories, onView, onAdd }: StoryBarProps) {
  const { profile } = useAuth();

  // Group stories by user
  const userStories = stories.reduce((acc, s) => {
    if (!acc[s.user_id]) acc[s.user_id] = [];
    acc[s.user_id].push(s);
    return acc;
  }, {} as Record<string, Story[]>);

  const userIds = Object.keys(userStories);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
      {/* Add story */}
      <button
        onClick={onAdd}
        className="shrink-0 flex flex-col items-center gap-1.5 group"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 group-hover:border-[#E1306C] flex items-center justify-center transition-colors">
          <Plus size={22} className="text-white/40 group-hover:text-[#E1306C] transition-colors" />
        </div>
        <span className="text-xs text-gray-400">Hikaye Ekle</span>
      </button>

      {/* User stories */}
      {userIds.map((uid) => {
        const userStory = userStories[uid][0];
        const p = userStory.profiles;
        const isOwn = uid === profile?.id;
        return (
          <button
            key={uid}
            onClick={() => onView(stories.indexOf(userStories[uid][0]))}
            className="shrink-0 flex flex-col items-center gap-1.5 group"
          >
            <div className="ig-story-ring group-hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-full bg-[#2f3148] border-2 border-[#1a1b2e] overflow-hidden">
                {p?.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {p?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 max-w-[64px] truncate">
              {isOwn ? 'Sen' : p?.username || 'Bilinmeyen'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
