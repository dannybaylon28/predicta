import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./context/AuthContext";
import { LeagueProvider } from "./context/LeagueContext";
import { MatchesProvider } from "./context/MatchesContext";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MatchesProvider>
          <LeagueProvider>
            <RouterProvider router={router} />
          </LeagueProvider>
        </MatchesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
