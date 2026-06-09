import { LogOut, Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { APP_DOMAIN, APP_NAME, APP_TAGLINE } from "../../constants/brand";
import { InstallPwaBanner } from "../pwa/InstallPwaBanner";
import { useAuth } from "../../context/AuthContext";
import { logOut } from "../../services/auth";

const navItems: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Inicio", end: true },
  { to: "/mis-ligas", label: "Mis ligas" },
  { to: "/unirse", label: "Unirse" },
  { to: "/crear", label: "Crear liga" },
  { to: "/predicciones", label: "Predicciones" },
  { to: "/clasificacion", label: "Clasificacion" },
  { to: "/reglas", label: "Reglas" },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    await logOut();
    closeMenu();
    navigate("/");
  };

  const displayName =
    profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Jugador";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/")} aria-label="Ir al inicio">
          <img className="brand-mark" src="/logo.png" alt="" width={40} height={40} />
          <span>
            <strong>{APP_NAME}</strong>
            <small>{APP_TAGLINE}</small>
          </span>
        </button>

        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Navegacion principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="top-actions">
          {!loading && user ? (
            <>
              <Link className="user-chip" to="/perfil" title={user.email ?? undefined}>
                {displayName}
              </Link>
              <button className="ghost-button" onClick={handleSignOut} type="button">
                <LogOut size={16} />
                Salir
              </button>
              <button
                className="primary-button compact"
                onClick={() => navigate("/crear")}
                type="button"
              >
                <Plus size={18} />
                Nueva liga
              </button>
            </>
          ) : (
            <>
              <button className="ghost-button" onClick={() => navigate("/entrar")} type="button">
                Entrar
              </button>
              <button
                className="primary-button compact"
                onClick={() => navigate("/entrar")}
                type="button"
              >
                <Plus size={18} />
                Nueva liga
              </button>
            </>
          )}
          <button
            className="icon-button menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            type="button"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <InstallPwaBanner />

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {APP_NAME} · {APP_DOMAIN}
        </span>
        <nav aria-label="Enlaces legales">
          <Link to="/terminos">Terminos</Link>
          <Link to="/privacidad">Privacidad</Link>
        </nav>
      </footer>
    </div>
  );
}
