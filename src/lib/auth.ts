/**
 * Утилиты для работы с JWT токенами (access и refresh)
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';
const RECRUITER_PHONE_KEY = 'recruiter_phone';

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
}

/**
 * Сохраняет пару токенов в localStorage
 */
export function saveTokens(data: TokenResponse): void {
  if (data.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  if (data.user_id) {
    localStorage.setItem(USER_ID_KEY, data.user_id);
  }
}

/**
 * Получает access token из localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Получает refresh token из localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Получает user_id из localStorage
 */
export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * Проверяет, авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

/**
 * Очищает все токены и данные пользователя из localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(RECRUITER_PHONE_KEY);
}

/**
 * Сохраняет номер телефона рекрутера
 */
export function saveRecruiterPhone(phone: string): void {
  localStorage.setItem(RECRUITER_PHONE_KEY, phone);
}

/**
 * Получает номер телефона рекрутера
 */
export function getRecruiterPhone(): string | null {
  return localStorage.getItem(RECRUITER_PHONE_KEY);
}

/**
 * Обновляет пару токенов через API
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error('[AUTH] Refresh token отсутствует');
    return false;
  }

  const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;
  if (!hrLinkeonUrl) {
    console.error('[AUTH] HR Linkeon URL не настроен');
    return false;
  }

  try {
    // Передаем refresh_token в заголовке Authorization
    const response = await fetch(`${hrLinkeonUrl}/webhook/api/v2/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('[AUTH] Ошибка обновления токенов:', errorData);
      
      // Если refresh token невалиден, очищаем авторизацию
      if (response.status === 401 || response.status === 403) {
        clearAuth();
      }
      
      return false;
    }

    const data = await response.json();
    
    // Формат 1: { success: true, data: { access_token, refresh_token, user_id } }
    if (data.success && data.data) {
      const tokenData = data.data;
      saveTokens({
        access_token: tokenData.access_token || tokenData['access-token'],
        refresh_token: tokenData.refresh_token || tokenData['refresh-token'],
        user_id: tokenData.user_id || getUserId() || undefined,
      });
      
      console.log('[AUTH] Токены успешно обновлены');
      return true;
    }

    // Формат 2: { "access-token": "...", "refresh-token": "..." } (с дефисами)
    if (data['access-token'] && data['refresh-token']) {
      const accessToken = data['access-token'];
      const refreshToken = data['refresh-token'];
      
      // Извлекаем user_id из access token если не пришел в ответе
      let userId: string | undefined;
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        userId = tokenPayload.user_id;
      } catch (e) {
        console.warn('[AUTH] Не удалось извлечь user_id из токена:', e);
        userId = getUserId() || undefined;
      }
      
      saveTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: userId,
      });
      
      console.log('[AUTH] Токены успешно обновлены');
      return true;
    }

    // Формат 3: { access_token: "...", refresh_token: "..." } (с подчеркиваниями)
    if (data.access_token && data.refresh_token) {
      let userId = data.user_id;
      if (!userId) {
        try {
          const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
          userId = tokenPayload.user_id;
        } catch (e) {
          console.warn('[AUTH] Не удалось извлечь user_id из токена:', e);
          userId = getUserId() || undefined;
        }
      }
      
      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: userId,
      });
      
      console.log('[AUTH] Токены успешно обновлены');
      return true;
    }

    console.error('[AUTH] Неожиданный формат ответа при обновлении токенов:', data);
    return false;
  } catch (error) {
    console.error('[AUTH] Ошибка при обновлении токенов:', error);
    return false;
  }
}

/**
 * Декодирует JWT токен (без проверки подписи)
 */
export function decodeJWT(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AUTH] Ошибка декодирования JWT:', error);
    return null;
  }
}

/**
 * Проверяет, истек ли токен
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // конвертируем в миллисекунды
  const currentTime = Date.now();
  
  // Проверяем с запасом в 5 минут
  return expirationTime < (currentTime + 5 * 60 * 1000);
}
