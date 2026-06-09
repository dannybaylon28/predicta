import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no esta configurado.");
  }

  const serviceAccount = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export function adminAuth() {
  initAdmin();
  return getAuth();
}

export function adminDb() {
  initAdmin();
  return getFirestore();
}
