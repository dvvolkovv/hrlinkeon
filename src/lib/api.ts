/**
 * API клиент с автоматическим обновлением токенов
 */

import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  refreshTokens,
  clearAuth,
} from './auth';

const getBaseUrl = (): string => {
  const hrLinkeonUrl = import.meta.env.VITE_HR_LINKEON_URL;
  if (!hrLinkeonUrl) {
    throw new Error('HR Linkeon URL не настроен');
  }
  return `${hrLinkeonUrl}/webhook`;
};

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipTokenRefresh?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Выполняет запрос к API с автоматическим обновлением токенов
 */
export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, skipTokenRefresh = false, ...fetchOptions } = options;
  
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  // Подготовка заголовков
  const headers: HeadersInit = {
    ...fetchOptions.headers,
  };

  // Добавляем Content-Type только если это не FormData
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Добавляем токен авторизации, если не пропущена авторизация
  if (!skipAuth) {
    const accessToken = getAccessToken();
    
    // Проверяем, истек ли токен и нужно ли обновить
    if (accessToken && isTokenExpired(accessToken) && !skipTokenRefresh) {
      // Обновляем токен перед запросом
      const refreshed = await ensureTokensRefreshed();
      if (!refreshed) {
        // Если не удалось обновить, возможно нужна повторная авторизация
        throw new Error('Сессия истекла. Необходима повторная авторизация.');
      }
    }
    
    const currentAccessToken = getAccessToken();
    if (currentAccessToken) {
      headers['Authorization'] = `Bearer ${currentAccessToken}`;
    }
  }

  // Выполняем запрос
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Если получили 401 и есть refresh token, пытаемся обновить токены
  if (response.status === 401 && !skipAuth && !skipTokenRefresh) {
    const refreshed = await ensureTokensRefreshed();
    
    if (refreshed) {
      // Повторяем запрос с новым токеном
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
      }
      
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    } else {
      // Если не удалось обновить, очищаем авторизацию
      clearAuth();
      // Перенаправляем на страницу входа через глобальный обработчик
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
  }

  return response;
}

/**
 * Обеспечивает обновление токенов (защита от параллельных запросов)
 */
async function ensureTokensRefreshed(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshTokens().then((success) => {
    isRefreshing = false;
    refreshPromise = null;
    return success;
  });

  return refreshPromise;
}

/**
 * Обертка для JSON запросов
 */
export async function apiJson<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Обертка для POST запросов
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiJson<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Обертка для GET запросов
 */
export async function apiGet<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  return apiJson<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * Обертка для PATCH запросов
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiJson<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Обертка для DELETE запросов
 */
export async function apiDelete<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiJson<T>(endpoint, {
    ...options,
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  });
}
