import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost/THESIS/OJT-Test/backend/web',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const updateProfile = (payload) => api.post('/auth/update-profile', payload);
export const confirmAccount = (token) => api.get(`/confirm/${token}`);
export const resendConfirmationEmail = (email) => api.post('/auth/resend-confirmation', { email });
export const requestPasswordReset = (identifier) => api.post('/auth/forgot-password', { identifier });
export const requestPasswordChange = (payload) => api.post('/auth/request-password-change', payload);
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const sendContactMessage = (payload) => api.post('/contact/send-message', payload);
export const fetchProfileBySlug = (slug) => api.get(`/auth/profile/${encodeURIComponent(slug)}`);
export const fetchPost = (id) => api.get(`/post/${id}`);
export const fetchPosts = () => api.get('/post');
export const createPost = (payload) => api.post('/post', payload);
export const updatePost = (id, payload) => api.put(`/post/${id}`, payload);
export const deletePostApi = (id, authKey) => api.delete(`/post/${id}`, { data: { authKey } });
export const createComment = (payload) => api.post('/comment', payload);
export const fetchComments = (postId) => api.get('/comment', { params: { post_id: postId } });

export default api;
