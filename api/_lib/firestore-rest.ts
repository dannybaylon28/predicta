import { importPKCS8, SignJWT } from "jose";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no esta configurado.");
  }

  return JSON.parse(raw) as ServiceAccount;
}

async function getAccessToken(): Promise<string> {
  const serviceAccount = getServiceAccount();
  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  const key = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/datastore",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error("No pudimos autenticar con Firebase Admin.");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Firebase Admin no devolvio access token.");
  }

  return payload.access_token;
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { timestampValue: string };

export async function upsertFirestoreDocument(
  documentPath: string,
  fields: Record<string, FirestoreValue>,
): Promise<void> {
  const serviceAccount = getServiceAccount();
  const token = await getAccessToken();
  const fieldPaths = Object.keys(fields);
  const mask = fieldPaths.map((path) => `updateMask.fieldPaths=${path}`).join("&");
  const url =
    `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}` +
    `/databases/(default)/documents/${documentPath}?${mask}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firestore write failed: ${response.status} ${error}`);
  }
}
