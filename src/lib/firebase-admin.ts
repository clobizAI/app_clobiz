import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

if (!getApps().length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

export const verifyIdToken = async (idToken: string) => {
  try {
    const decoded = await auth.verifyIdToken(idToken);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired ID token');
  }
};

export default auth; 