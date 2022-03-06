import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';

let cookies = parseCookies();

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['<my_app_name_token>']}`,
  },
});

// Intercepts any response with a 401 status code and redirects to the login page
api.interceptors.response.use((response) => response, (error: AxiosError) => {
  if (error.response?.status === 401) {
    // if token expired then try to refresh it
    if (error.response?.data?.code === 'token.expired') {
      // Retrieves from the browser the current values for both token and refresh token
      cookies = parseCookies();

      // Extracts the refresh token from the cookies
      const { '<my_app_name_refresh_token>': refreshToken } = cookies;

      api.post('/refresh', {
        refreshToken,
      }).then((response) => {
        const { token } = response.data;

        // Save JWT token in cookie
        setCookie(undefined, '<my_app_name_token>', token, {
          maxAge: 60 * 60 * 24 * 30, // 30 days,
          path: '/',
        });

        // Save refresh token in cookie
        setCookie(undefined, '<my_app_name_refresh_token>', response.data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30, // 30 days,
          path: '/',
        });

        // Since our default token being sent to all requests changed because it had expired,
        // we need to update the default headers with the new token
        // Obs: it has to be default.headers.common and not .defaults.headers on new axios version
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }).catch((error) => {});
    } else {
      // log out the user
    }
  }
});
