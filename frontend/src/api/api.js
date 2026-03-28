import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/register', data);
export const googleAuth = (data) => api.post('/auth/google', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getDocs = () => api.get('/docs');
export const createDoc = (data) => api.post('/docs', data);
export const getDoc = (id) => api.get(`/docs/${id}`);
export const updateDoc = (id, data) => api.put(`/docs/${id}`, data);
export const deleteDoc = (id) => api.delete(`/docs/${id}`);
export const shareDoc = (id, data) => api.post(`/docs/${id}/share`, data);
export const getVersions = (id) => api.get(`/docs/${id}/versions`);
export const saveVersion = (id) => api.post(`/docs/${id}/version`);
export const aiSummarize = (data) => api.post('/ai/summarize', data);
export const aiImprove = (data) => api.post('/ai/improve', data);
export const aiFix = (data) => api.post('/ai/fix', data);

export default api;
