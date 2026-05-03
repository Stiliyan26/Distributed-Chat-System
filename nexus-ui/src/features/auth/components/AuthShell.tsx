import { Terminal } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-bg pointer-events-none" />

      <div className="flex flex-col items-center mb-8 z-10">
        <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 shadow-glow">
          <Terminal size={26} className="text-white" />
        </div>

        <h1 className="text-2xl font-semibold text-primary tracking-wide">{title}</h1>

        <p className="label-sm mt-1">{subtitle}</p>
      </div>

      {children}

      {footer}
    </div>
  );
}
