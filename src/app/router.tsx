import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";
import { CreateLeaguePage } from "../pages/CreateLeaguePage";
import { DashboardPage } from "../pages/DashboardPage";
import { JoinLeaguePage } from "../pages/JoinLeaguePage";
import { LandingPage } from "../pages/LandingPage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { LoginPage } from "../pages/LoginPage";
import { PredictionsPage } from "../pages/PredictionsPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { RulesPage } from "../pages/RulesPage";
import { PremiumPage } from "../pages/PremiumPage";
import { PremiumSuccessPage } from "../pages/PremiumSuccessPage";
import { ProfilePage } from "../pages/ProfilePage";
import { TermsPage } from "../pages/TermsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "entrar", element: <LoginPage /> },
      { path: "terminos", element: <TermsPage /> },
      { path: "privacidad", element: <PrivacyPage /> },
      { path: "premium", element: <PremiumPage /> },
      {
        path: "premium/exito",
        element: (
          <ProtectedRoute>
            <PremiumSuccessPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "unirse",
        element: (
          <ProtectedRoute>
            <JoinLeaguePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "unirse/:code",
        element: (
          <ProtectedRoute>
            <JoinLeaguePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "mis-ligas",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "crear",
        element: (
          <ProtectedRoute>
            <CreateLeaguePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "predicciones",
        element: (
          <ProtectedRoute>
            <PredictionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "clasificacion",
        element: (
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "reglas",
        element: (
          <ProtectedRoute>
            <RulesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "perfil",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
