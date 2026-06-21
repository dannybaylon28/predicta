import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isSuperAdmin } from "../../utils/superAdmin";

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <section className="auth-page">
        <p className="auth-loading">Cargando sesion...</p>
      </section>
    );
  }

  if (!user || !isSuperAdmin(user.uid)) {
    return <Navigate to="/mis-ligas" replace />;
  }

  return children;
}
