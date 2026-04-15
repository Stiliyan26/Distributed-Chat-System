import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";

export default function AppRoot() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
