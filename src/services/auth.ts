import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserProfile } from "./users";

const googleProvider = new GoogleAuthProvider();

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Ese correo ya tiene una cuenta registrada.";
    case "auth/invalid-email":
      return "El correo no es valido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/popup-closed-by-user":
      return "Cerraste la ventana de Google antes de terminar.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No pudimos completar la accion. Intenta de nuevo.";
  }
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    throw new Error(mapAuthError(code));
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    throw new Error(mapAuthError(code));
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const name = displayName.trim() || email.split("@")[0];

    if (name) {
      await updateProfile(result.user, { displayName: name });
    }

    await ensureUserProfile(result.user);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    throw new Error(mapAuthError(code));
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}
