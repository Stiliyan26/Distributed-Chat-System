import { SocketProvider } from "@/context/SocketProvider";
import { ChatPage } from "@/pages/ChatPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ROUTES } from "@/shared/constants/routes";
import type { ReactNode } from "react";
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
