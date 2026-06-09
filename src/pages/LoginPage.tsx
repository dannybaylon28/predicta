import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { PasswordField } from "../components/auth/PasswordField";
import { useAuth } from "../context/AuthContext";
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../services/auth";

type AuthMode = "login" | "register" | "reset";

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/mis-ligas";

  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    if (nextMode !== "register") {
      setConfirmPassword("");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        navigate(from, { replace: true });
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }
        await signUpWithEmail(email, password, displayName);
        navigate(from, { replace: true });
      } else {
        await sendPasswordReset(email);
        setSuccess("Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="overline">Acceso</p>
        <h2>
          {mode === "reset" ? "Recuperar contraseña" : "Entra a Predicta"}
        </h2>
        <p className="auth-copy">
          {mode === "reset"
            ? "Te enviaremos un enlace a tu correo para crear una nueva contraseña."
            : "Inicia sesion para crear ligas, marcar predicciones y ver la clasificacion con tu grupo."}
        </p>

        {mode !== "reset" && (
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => switchMode("login")}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => switchMode("register")}
            >
              Crear cuenta
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Nombre
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Como te conocen en la liga"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />
          </label>

          {mode !== "reset" && (
            <PasswordField
              label="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
            />
          )}

          {mode === "register" && (
            <PasswordField
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              minLength={6}
            />
          )}

          {mode === "login" && (
            <button
              className="auth-inline-link"
              type="button"
              onClick={() => switchMode("reset")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button className="primary-button full" type="submit" disabled={submitting}>
            {submitting
              ? "Procesando..."
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Crear cuenta"
                  : "Enviar enlace"}
            <ArrowRight size={18} />
          </button>
        </form>

        {mode === "reset" && (
          <p className="auth-footer">
            <button className="auth-inline-link" type="button" onClick={() => switchMode("login")}>
              Volver a iniciar sesion
            </button>
          </p>
        )}

        {mode !== "reset" && (
          <>
            <div className="auth-divider">
              <span>o</span>
            </div>

            <GoogleSignInButton onClick={handleGoogle} disabled={submitting} />
          </>
        )}

        {mode === "register" && (
          <p className="auth-legal">
            Al crear una cuenta aceptas los{" "}
            <Link to="/terminos">Terminos de uso</Link> y la{" "}
            <Link to="/privacidad">Politica de privacidad</Link>.
          </p>
        )}

        <p className="auth-footer">
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </section>
  );
}
