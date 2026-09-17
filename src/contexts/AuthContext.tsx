import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, role?: 'admin' | 'tecnico' | 'gerente') => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role?: 'admin' | 'tecnico') => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'admin-master',
  name: 'Administrador (Admin)',
  email: 'admin@arsolucoes.com.br',
  role: 'admin',
  phone: '(61) 99284-8993',
  createdAt: new Date().toISOString()
};

const LOCAL_DEMO_USER_KEY = 'ar_solucoes_admin_user';
const LEGACY_LOCAL_DEMO_USER_KEY = 'refrigera_certo_admin_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_DEMO_USER_KEY) || localStorage.getItem(LEGACY_LOCAL_DEMO_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.email.includes('refrigera')) {
          parsed.email = 'admin@arsolucoes.com.br';
        }
        return { ...parsed, role: 'admin' };
      }
      return DEFAULT_ADMIN_PROFILE;
    } catch {
      return DEFAULT_ADMIN_PROFILE;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync profile from Firestore when user changes
  const fetchOrCreateUserProfile = async (firebaseUser: User, overrideName?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile({ ...data, role: 'admin' });
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name: overrideName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador',
          email: firebaseUser.email || 'admin@arsolucoes.com.br',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, newProfile);
        } catch {
          // Keep in local state
        }
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Fallback para perfil admin local:', err);
      setUserProfile(DEFAULT_ADMIN_PROFILE);
    }
  };

  useEffect(() => {
    // Escuta estado do Firebase sem travar o aplicativo se não houver login
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          await fetchOrCreateUserProfile(firebaseUser);
        } else {
          setCurrentUser(null);
          // Permanece com perfil de Administrador com controle total
          const saved = localStorage.getItem(LOCAL_DEMO_USER_KEY);
          if (saved) {
            try {
              setUserProfile({ ...JSON.parse(saved), role: 'admin' });
            } catch {
              setUserProfile(DEFAULT_ADMIN_PROFILE);
            }
          } else {
            setUserProfile(DEFAULT_ADMIN_PROFILE);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const translateAuthError = (err: unknown): string => {
    if (!err || typeof err !== 'object') return 'Ocorreu um erro inesperado ao autenticar.';
    const code = (err as { code?: string }).code || '';

    switch (code) {
      case 'auth/invalid-email':
        return 'O endereço de e-mail digitado é inválido.';
      case 'auth/user-not-found':
        return 'Nenhum usuário encontrado com este e-mail. Verifique a digitação ou cadastre-se.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos. Por favor verifique suas credenciais.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado no sistema. Faça login ou use "Esqueci minha senha".';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Utilize no mínimo 6 caracteres com letras e números.';
      case 'auth/unauthorized-domain':
        return 'Este domínio não está autorizado no Firebase deste projeto. Conecte seu próprio projeto Firebase nas variáveis da Hostinger ou utilize os botões do "Ambiente de Testes / Modo Rápido" abaixo para entrar imediatamente.';
      case 'auth/operation-not-allowed':
        return 'O método de login por e-mail/senha precisa ser habilitado no Firebase Console. Você também pode entrar via Google.';
      case 'auth/popup-closed-by-user':
        return 'A janela de autenticação foi fechada antes de concluir.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.';
      case 'auth/network-request-failed':
        return 'Falha de conexão com os servidores de autenticação. Verifique sua rede.';
      default:
        return (err as Error).message || 'Não foi possível completar a autenticação.';
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await fetchOrCreateUserProfile(res.user);
    } catch (err) {
      const msg = translateAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    role: 'admin' | 'tecnico' | 'gerente' = 'tecnico'
  ) => {
    setError(null);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name.trim() });
        const userDocRef = doc(db, 'users', res.user.uid);
        const profileData: UserProfile = {
          id: res.user.uid,
          name: name.trim(),
          email: email.trim(),
          role,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, profileData);
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${res.user.uid}`);
        }
        setUserProfile(profileData);
      }
    } catch (err) {
      const msg = translateAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await fetchOrCreateUserProfile(res.user);
    } catch (err) {
      const msg = translateAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (role: 'admin' | 'tecnico' = 'tecnico') => {
    const demoProfile: UserProfile = {
      id: 'demo-user-123',
      name: role === 'admin' ? 'Carlos Silva (Administrador)' : 'Roberto Mendes (Técnico HVAC)',
      email: role === 'admin' ? 'admin@arsolucoes.com.br' : 'tecnico@arsolucoes.com.br',
      role,
      phone: '(61) 99284-8993',
      createdAt: new Date().toISOString()
    };
    setUserProfile(demoProfile);
    localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(demoProfile));
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Ignora erro de signOut caso offline
    } finally {
      setCurrentUser(null);
      setUserProfile(DEFAULT_ADMIN_PROFILE);
      localStorage.removeItem(LOCAL_DEMO_USER_KEY);
      localStorage.removeItem(LEGACY_LOCAL_DEMO_USER_KEY);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const msg = translateAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!currentUser || !!userProfile;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemo,
        logout,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
