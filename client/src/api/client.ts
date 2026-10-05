import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const normalized = new Error(
        error.response?.data?.message ||
          (error.code === 'ECONNABORTED'
            ? 'Сұрау уақыты аяқталды. Қайта көріңіз.'
            : 'Сервермен байланыс орнатылмады. Қайта көріңіз.'),
      );
      Object.assign(normalized, {
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
      return Promise.reject(normalized);
    }
    return Promise.reject(error);
  },
);
export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== '' && value !== null && value !== undefined,
        ),
      )
    : undefined;
  const result = await api.get<{ success: boolean; message: string; data: T }>(url, {
    params: cleanParams,
  });
  return result.data.data;
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Күтпеген қате орын алды.';
}
