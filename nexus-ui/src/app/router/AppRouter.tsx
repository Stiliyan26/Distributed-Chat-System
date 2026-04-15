import { Route, Routes } from "react-router-dom";
import { appRouteConfig } from "./routeConfig";

export function AppRouter() {
  return (
    <Routes>
      {appRouteConfig.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  );
}
