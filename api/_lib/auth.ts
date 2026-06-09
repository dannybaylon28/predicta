import { createRemoteJWKSet, jwtVerify } from "jose";
import type { VercelRequest } from "@vercel/node";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function getFirebaseProjectId(): string {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim();

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID no esta configurado.");
  }

  return projectId;
}

export async function requireUser(req: VercelRequest): Promise<{ uid: string; email?: string }> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = header.slice("Bearer ".length);
  const projectId = getFirebaseProjectId();

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.sub) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
