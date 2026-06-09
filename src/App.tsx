import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./context/AuthContext";
import { LeagueProvider } from "./context/LeagueContext";
import { MatchesProvider } from "./context/MatchesContext";
import { ToastProvider } from "./context/ToastContext";
import { UpgradeProvider } from "./context/UpgradeContext";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MatchesProvider>
          <LeagueProvider>
            <UpgradeProvider>
              <RouterProvider router={router} />
            </UpgradeProvider>
          </LeagueProvider>
        </MatchesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
