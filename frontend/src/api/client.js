import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (!err.response) {
      // 네트워크 에러 (서버 다운, CORS 등)
      err.userMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      return Promise.reject(err);
    }

    const status = err.response.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      err.userMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
    } else if (status === 403) {
      err.userMessage = '이 작업을 수행할 권한이 없습니다.';
    } else if (status === 404) {
      err.userMessage = '요청한 데이터를 찾을 수 없습니다.';
    } else if (status === 429) {
      err.userMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    } else if (status >= 500) {
      err.userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else {
      err.userMessage = err.response.data?.error || '오류가 발생했습니다.';
    }

    return Promise.reject(err);
  }
);

export default client;
