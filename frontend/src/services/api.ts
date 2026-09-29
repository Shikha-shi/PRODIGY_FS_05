import axios from "axios";

export const API_URL = "http://localhost:8000";
export const TOKEN_KEY = "vibe_token";

// sessionStorage is per-tab, so each tab can be logged into a different account
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) =>
  sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const mediaUrl = (path: string | null | undefined) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_URL}${path}`;
};

export const errorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail) && detail[0]?.msg) {
      return String(detail[0].msg).replace("Value error, ", "");
    }
  }

  return fallback;
};

export default api;
