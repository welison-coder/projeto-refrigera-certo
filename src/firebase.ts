import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultConfig from '../firebase-applet-config.json';

// Resolves Firebase configuration prioritizing environment variables (for Hostinger / custom hosting)
// and seamlessly falling back to the bundled firebase-applet-config.json (for AI Studio development)
const resolvedConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string | undefined) || defaultConfig.apiKey,
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || defaultConfig.authDomain,
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string | undefined) || defaultConfig.projectId,
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || defaultConfig.storageBucket,
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || defaultConfig.messagingSenderId,
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string | undefined) || defaultConfig.appId,
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) || defaultConfig.measurementId || undefined,
};

const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();

// Database initialization: supports custom database ID or default Firestore instance
const customDatabaseId = (import.meta.env?.VITE_FIRESTORE_DATABASE_ID as string | undefined) || defaultConfig.firestoreDatabaseId;

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
