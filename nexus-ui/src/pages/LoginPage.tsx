import { AuthErrorAlert } from "@/features/auth/components/AuthErrorAlert";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";
import { ROUTES } from "@/shared/constants/routes";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

export function LoginPage() {
  const { state, setEmail, setPassword, togglePassword, submit } = useLoginForm();

  return (
    <AuthShell
      title="Nexus"
      subtitle="Secure Node Authentication"
      footer={
        <div className="z-10 mt-8 flex items-center gap-3 text-[10px] text-outline-var/60 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
          <span>Encrypted_Channel_01</span>
          <span>-</span>
          <span>Global_Resilience_Protocols</span>
        </div>
      }
    >
      <div className="z-10 w-full max-w-sm bg-surface-low rounded-xl p-8 shadow-modal">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label-sm block mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@nexus.sys"
              value={state.email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
            />
            {state.email && (
              <p className="text-emerald-400/80 text-[11px] mt-1.5">Encryption verified: AES-256 standard</p>
            )}
          </div>

          <div>
            <label className="label-sm block mb-2">Password</label>
            <div className="relative">
              <input
                type={state.showPassword ? "text" : "password"}
                className="input-field pr-10"
                placeholder="••••••••••••"
                value={state.password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-var hover:text-white transition-colors"
              >
                {state.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <button type="button" className="text-[11px] text-outline-var hover:text-primary transition-colors">
                Forgot credentials?
              </button>
            </div>
          </div>

          <AuthErrorAlert message={state.error} />

          <button
            type="submit"
            disabled={state.loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {state.loading ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
            ) : (
              <>
                Log in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Don't have an account?{" "}
          <Link to={ROUTES.register} className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
