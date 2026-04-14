import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Terminal } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow-bg pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center mb-8 z-10">
        <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 shadow-glow">
          <Terminal size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-primary tracking-wide">Nexus</h1>
        <p className="label-sm mt-1">Secure Node Authentication</p>
      </div>

      {/* Card */}
      <div className="z-10 w-full max-w-sm bg-surface-low rounded-xl p-8 shadow-modal">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-sm block mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@nexus.sys"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            {email && (
              <p className="text-emerald-400/80 text-[11px] mt-1.5">Encryption verified: AES-256 standard</p>
            )}
          </div>

          <div>
            <label className="label-sm block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-var hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <button type="button" className="text-[11px] text-outline-var hover:text-primary transition-colors">
                Forgot credentials?
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-md px-3 py-2 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
            ) : (
              <>
                Log in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="z-10 mt-8 flex items-center gap-3 text-[10px] text-outline-var/60 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
        <span>Encrypted_Channel_01</span>
        <span>•</span>
        <span>Global_Resilience_Protocols</span>
      </div>
    </div>
  );
}
