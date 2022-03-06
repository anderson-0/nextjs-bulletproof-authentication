import { useRouter } from 'next/router';
import { createContext, useState } from 'react';
import { api } from '../services/api';

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>
  user?: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const router = useRouter();
  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignInCredentials) {
    console.log(email, password);
    try {
      const response = await api.post('sessions', {
        email,
        password,
      });

      const { permissions, roles } = response.data;

      setUser({
        email,
        permissions,
        roles,
      });

      router.push('/dashboard');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthContext = createContext({} as AuthContextData);
