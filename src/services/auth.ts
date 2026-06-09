import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
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

export function usesPasswordProvider(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "password");
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("Debes iniciar sesion con correo y contraseña.");
  }

  if (!usesPasswordProvider(user)) {
    throw new Error("Tu cuenta usa Google. Cambia la contraseña desde tu cuenta de Google.");
  }

  if (newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
      throw new Error("La contraseña actual no es correcta.");
    }
    if (code === "auth/weak-password") {
      throw new Error("La nueva contraseña es demasiado debil.");
    }
    throw new Error(mapAuthError(code));
  }
}
