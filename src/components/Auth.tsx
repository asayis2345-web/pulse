import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PulseLogo } from '@/components/PulseLogo';
import { Zap, Loader2 } from 'lucide-react';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ username })
            .eq('id', data.user.id);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#E1306C] opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#F77737] opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#833AB4] opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-[#232540]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <PulseLogo size={72} className="animate-pulse-glow mb-4" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Pulse</h1>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'signin' ? 'Hesabına giriş yap' : 'Aramıza katıl'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#1a1b2e] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] focus:ring-1 focus:ring-[#E1306C] transition-all"
                  placeholder="kullanici_adi"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1a1b2e] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] focus:ring-1 focus:ring-[#E1306C] transition-all"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#1a1b2e] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C] focus:ring-1 focus:ring-[#E1306C] transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full ig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Zap size={18} fill="white" />
                  {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {mode === 'signin'
                ? 'Hesabın yok mu? Kayıt ol'
                : 'Zaten hesabın var mı? Giriş yap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
