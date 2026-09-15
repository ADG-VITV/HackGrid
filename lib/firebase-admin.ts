import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// ---------------------------------------------------------------------------
// Server-side Firebase identity.
//
// The browser signs in with the client SDK and sends its ID token; this module
// verifies that token's signature, audience and expiry against Google's
// public keys and returns the claims. Nothing identity-related should ever be
// read from a form field or a plain uid string sent by the client.
//
// Verification only needs the project id (the public keys are fetched from
// googleapis.com without credentials). A service account is optional and only
// unlocks privileged Admin APIs, which the app does not use today:
//   FIREBASE_SERVICE_ACCOUNT_KEY   — the full service-account JSON, or
//   FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
// ---------------------------------------------------------------------------

export type VerifiedIdentity = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

function projectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    null
  );
}

function serviceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (json) {
    try {
      return cert(JSON.parse(json));
    } catch {
      console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON; ignoring.");
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const id = projectId();
  if (clientEmail && privateKey && id) {
    return cert({ projectId: id, clientEmail, privateKey });
  }

  return null;
}

function adminApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const id = projectId();
  if (!id) {
    console.error("[firebase-admin] No Firebase project id configured; ID tokens cannot be verified.");
    return null;
  }

  const credential = serviceAccount();
  return initializeApp(credential ? { credential, projectId: id } : { projectId: id });
}

/**
 * Verifies a Firebase ID token and returns its identity claims, or null when
 * the token is missing, malformed, expired, or issued for another project.
 */
export async function verifyIdToken(idToken: string | null | undefined): Promise<VerifiedIdentity | null> {
  if (!idToken) return null;

  const app = adminApp();
  if (!app) return null;

  try {
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: decoded.email_verified ?? false,
      name: typeof decoded.name === "string" ? decoded.name : null,
    };
  } catch {
    return null;
  }
}
