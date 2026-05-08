import { Link } from "react-router-dom";

import { AuthErrorAlert } from "@/features/auth/components/AuthErrorAlert";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { useRegisterForm } from "@/features/auth/hooks/useRegisterForm";
import { ROUTES } from "@/shared/constants/routes";

export function RegisterPage() {
  const {
    state,
    strength,
    setUsername,
    setEmail,
    setPassword,
    setConfirm,
    submit,
  } = useRegisterForm();

  return (
    <AuthShell
      title="Nexus System"
      subtitle="Initialize your node within the distributed network."
      footer={
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
      }
    >
      <div className="z-10 w-full max-w-md bg-surface-low rounded-xl p-8 shadow-modal">
        <h2 className="text-lg font-semibold text-white mb-6">Create Account</h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label-sm block mb-2">Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. node_explorer_01"
              value={state.username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-sm block mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="identity@nexus.network"
              value={state.email}
              onChange={(event) => setEmail(event.target.value)}
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
                value={state.password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-sm block mb-2">Repeat Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={state.confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
            </div>
          </div>

          {state.password && <PasswordStrength strength={strength} />}

          <AuthErrorAlert message={state.error} />

          <button
            type="submit"
            disabled={state.loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {state.loading ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-5">
          Already authenticated?{" "}
          <Link to={ROUTES.login} className="text-primary font-medium hover:underline">
            Connect Node
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
