import type { VercelRequest } from "@vercel/node";
import { adminAuth } from "./firebase-admin.js";

export async function requireUser(req: VercelRequest): Promise<{ uid: string; email?: string }> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = header.slice("Bearer ".length);
  const decoded = await adminAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}
