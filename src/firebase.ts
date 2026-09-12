import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultConfig from '../firebase-applet-config.json';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
      measurementId?: string;
      firestoreDatabaseId?: string;
    };
  }
}

const runtime = typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : undefined;

// Resolves Firebase configuration prioritizing:
// 1. Runtime config injected by Express server.js from Hostinger environment variables (works immediately without rebuild)
// 2. Vite compile-time environment variables (import.meta.env.VITE_*)
// 3. Fallback to bundled firebase-applet-config.json (for AI Studio development)
const resolvedConfig = {
  apiKey: runtime?.apiKey || (import.meta.env?.VITE_FIREBASE_API_KEY as string | undefined) || defaultConfig.apiKey,
  authDomain: runtime?.authDomain || (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || defaultConfig.authDomain,
  projectId: runtime?.projectId || (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string | undefined) || defaultConfig.projectId,
  storageBucket: runtime?.storageBucket || (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || defaultConfig.storageBucket,
  messagingSenderId: runtime?.messagingSenderId || (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || defaultConfig.messagingSenderId,
  appId: runtime?.appId || (import.meta.env?.VITE_FIREBASE_APP_ID as string | undefined) || defaultConfig.appId,
  measurementId: runtime?.measurementId || (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) || defaultConfig.measurementId || undefined,
};

const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();

// Database initialization: supports custom database ID or default Firestore instance
const customDatabaseId = runtime?.firestoreDatabaseId || (import.meta.env?.VITE_FIRESTORE_DATABASE_ID as string | undefined) || defaultConfig.firestoreDatabaseId;

export const db = customDatabaseId && customDatabaseId !== '(default)'
  ? getFirestore(app, customDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
