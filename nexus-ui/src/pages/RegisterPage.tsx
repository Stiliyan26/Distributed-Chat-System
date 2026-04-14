import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

type Strength = 'WEAK' | 'FAIR' | 'STRONG' | 'VERY STRONG';

function getStrength(password: string): { label: Strength; color: string; width: string; checks: Record<string, boolean> } {
  const checks = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numSymbol: /[\d!@#$%^&*]/.test(password),
    length: password.length >= 8,
  };
  const count = Object.values(checks).filter(Boolean).length;
  const map: Record<number, { label: Strength; color: string; width: string }> = {
    0: { label: 'WEAK', color: 'bg-red-500', width: 'w-1/4' },
    1: { label: 'WEAK', color: 'bg-red-500', width: 'w-1/4' },
    2: { label: 'FAIR', color: 'bg-amber-500', width: 'w-2/4' },
    3: { label: 'STRONG', color: 'bg-emerald-500', width: 'w-3/4' },
    4: { label: 'VERY STRONG', color: 'bg-indigo-500', width: 'w-full' },
  };
  return { ...map[count], checks };
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Access keys do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-bg pointer-events-none" />

      <div className="z-10 mb-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 shadow-glow mx-auto">
          <Terminal size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-primary">Nexus System</h1>
        <p className="text-white/40 text-sm mt-1">Initialize your node within the distributed network.</p>
      </div>

      <div className="z-10 w-full max-w-md bg-surface-low rounded-xl p-8 shadow-modal">
        <h2 className="text-lg font-semibold text-white mb-6">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-sm block mb-2">Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. node_explorer_01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-sm block mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="identity@nexus.network"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm block mb-2">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-sm block mb-2">Repeat Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          {password && (
            <div className="bg-surface rounded-md p-3 space-y-2 border border-outline-var/20">
              <div className="flex items-center justify-between">
                <span className="label-sm">Entropy Strength</span>
                <span className={`text-[11px] font-semibold ${
                  strength.label === 'WEAK' ? 'text-red-400' :
                  strength.label === 'FAIR' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>{strength.label}</span>
              </div>
              <div className="h-0.5 bg-surface-high rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {[
                  { key: 'uppercase', label: 'Uppercase' },
                  { key: 'lowercase', label: 'Lowercase' },
                  { key: 'numSymbol', label: 'Num/Symbol' },
                  { key: 'length', label: '8+ Chars' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      strength.checks[key]
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                        : 'border-outline-var/40 text-transparent'
                    }`}>
                      {strength.checks[key] && <span className="text-[8px] font-bold">✓</span>}
                    </div>
                    <span className={strength.checks[key] ? 'text-white/70' : 'text-outline-var/60'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-5">
          Already authenticated?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Connect Node
          </Link>
        </p>
      </div>

      <div className="z-10 mt-6 flex items-center justify-between w-full max-w-md text-[10px] text-outline-var/50 uppercase tracking-widest px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          Network Secure
        </span>
        <span className="flex gap-3">
          <span className="hover:text-outline-var cursor-pointer">Legal</span>
          <span className="hover:text-outline-var cursor-pointer">Privacy</span>
        </span>
      </div>
    </div>
  );
}
