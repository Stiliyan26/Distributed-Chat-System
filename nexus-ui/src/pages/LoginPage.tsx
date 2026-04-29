import { AuthErrorAlert } from "@/features/auth/components/AuthErrorAlert";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RevealablePasswordField } from "@/features/auth/components/RevealablePasswordField";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";
import { ROUTES } from "@/shared/constants/routes";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LOGIN_FIELD_IDS = {
  email: "login-email",
  password: "login-password",
} as const;

const LOGIN_FORM_ERROR_ID = "login-form-error";

function LoginTerminalFooter() {
  return (
    <div className="z-10 mt-8 flex items-center gap-3 text-[10px] uppercase tracking-widest text-outline-var/60">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/60" />
      <span>Encrypted_Channel_01</span>
      <span>-</span>
      <span>Global_Resilience_Protocols</span>
    </div>
  );
}

export function LoginPage() {
  const { state, setEmail, setPassword, togglePassword, submit } = useLoginForm();
  const hasError = Boolean(state.error);

  return (
    <AuthShell title="Nexus" subtitle="Secure Node Authentication" footer={<LoginTerminalFooter />}>
      <div className="shadow-modal z-10 w-full max-w-sm rounded-xl bg-surface-low p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor={LOGIN_FIELD_IDS.email} className="label-sm mb-2 block">
              Email
            </label>

            <input
              id={LOGIN_FIELD_IDS.email}
              type="email"
              className="input-field"
              placeholder="admin@nexus.sys"
              value={state.email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
              autoComplete="username"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? LOGIN_FORM_ERROR_ID : undefined}
            />
            {Boolean(state.email) && (
              <p className="mt-1.5 text-[11px] text-emerald-400/80">
                Encryption verified: AES-256 standard
              </p>
            )}
          </div>

          <div>
            <RevealablePasswordField
              id={LOGIN_FIELD_IDS.password}
              label="Password"
              placeholder="••••••••••••"
              value={state.password}
              showPassword={state.showPassword}
              onValueChange={setPassword}
              onToggleVisibility={togglePassword}
              invalid={hasError}
              describedById={hasError ? LOGIN_FORM_ERROR_ID : undefined}
            />
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                className="text-[11px] text-outline-var transition-colors hover:text-primary"
              >
                Forgot credentials?
              </button>
            </div>
          </div>

          <AuthErrorAlert id={LOGIN_FORM_ERROR_ID} message={state.error} />

          <button
            type="submit"
            disabled={state.loading}
            aria-busy={state.loading}
            className="btn-primary mt-2 flex w-full items-center justify-center gap-2"
          >
            {state.loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
            ) : (
              <>
                Log in <ArrowRight size={16} aria-hidden />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Don&apos;t have an account?{" "}
          <Link to={ROUTES.register} className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
