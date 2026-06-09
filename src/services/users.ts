import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import type { UserProfile } from "../types";

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }

  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName?.trim() || user.email?.split("@")[0] || "Jugador",
    email: user.email ?? "",
    photoURL: user.photoURL ?? undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function updateUserDisplayName(displayName: string): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesion.");

  const name = displayName.trim();
  if (!name) throw new Error("El nombre no puede estar vacio.");

  await updateProfile(user, { displayName: name });
  await updateDoc(doc(db, "users", user.uid), {
    displayName: name,
    updatedAt: serverTimestamp(),
  });

  const snapshot = await getDoc(doc(db, "users", user.uid));
  return snapshot.data() as UserProfile;
}
