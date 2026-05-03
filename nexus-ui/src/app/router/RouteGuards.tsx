import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/auth/useAuth";
import { ROUTES } from "@/shared/constants/routes";

function SessionBootstrapScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
      Restoring session...
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, sessionReady } = useAuth();

  if (user && !sessionReady) {
    return <SessionBootstrapScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <>{children}</>;
}

export function PublicAuthRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, sessionReady } = useAuth();

  if (user && !sessionReady) {
    return <SessionBootstrapScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}
