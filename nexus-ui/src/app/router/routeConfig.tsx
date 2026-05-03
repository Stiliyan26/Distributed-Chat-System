import type { ReactNode } from "react";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ChatPage } from "@/features/chat/pages/ChatPage";
import { SocketProvider } from "@/realtime/SocketProvider";
import { ROUTES } from "@/shared/constants/routes";

import { ProtectedRoute, PublicAuthRoute } from "./RouteGuards";

export type AppRoute = {
  path: string;
  element: ReactNode;
};

export const appRouteConfig: AppRoute[] = [
  {
    path: ROUTES.login,
    element: (
      <PublicAuthRoute>
        <LoginPage />
      </PublicAuthRoute>
    ),
  },
  {
    path: ROUTES.register,
    element: (
      <PublicAuthRoute>
        <RegisterPage />
      </PublicAuthRoute>
    ),
  },
  {
    path: ROUTES.chatWildcard,
    element: (
      <ProtectedRoute>
        <SocketProvider>
          <div className="h-screen flex flex-col overflow-hidden">
            <ChatPage />
          </div>
        </SocketProvider>
      </ProtectedRoute>
    ),
  },
];
