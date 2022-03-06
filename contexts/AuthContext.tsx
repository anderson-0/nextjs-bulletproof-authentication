import { useRouter } from 'next/router';
import { setCookie, parseCookies } from 'nookies';
import { createContext, useEffect, useState } from 'react';
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
export const AuthContext = createContext({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>();
  const router = useRouter();
  const isAuthenticated = !!user;

  useEffect(() => {
    const {
      '<my_app_name_token>': token,
      '<my_app_name_refresh_token>': refreshToken,
    } = parseCookies();

    // when we first open the application, if there is a token, let's use it to
    // retrieve the user's info and update the state
    if (token) {
      api.get('/me').then((response) => {
        const { email, permissions, roles } = response.data;
        setUser({ email, permissions, roles });
      });
    }
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    console.log(email, password);

    try {
      // Call the api to sign in the user
      const response = await api.post('sessions', {
        email,
        password,
      });

      // Extract the token, refresh token, roles and permissions from the response
      const {
        token, refreshToken, permissions, roles,
      } = response.data;

      // Save JWT token in cookie
      setCookie(undefined, '<my_app_name_token>', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days,
        path: '/',
      });

      // Save refresh token in cookie
      setCookie(undefined, '<my_app_name_refresh_token>', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days,
        path: '/',
      });

      // Update the state with the user's info
      setUser({
        email,
        permissions,
        roles,
      });

      // Update the default token being used after we authenticate
      // because we just got a new token and refresh token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // After authentication, send the user to the dashboard
      router.push('/dashboard');
    } catch (error) {
      // TODO: handle sign in error
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
};
