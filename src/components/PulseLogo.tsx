import { Zap } from 'lucide-react';

export function PulseLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`ig-gradient rounded-2xl flex items-center justify-center shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <Zap
        size={size * 0.55}
        className="text-white drop-shadow-md"
        fill="white"
        strokeWidth={2.5}
      />
    </div>
  );
}

export function PulseWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      Pulse
    </span>
  );
}
