import api from './api';

export const userService = {
  getMyProfile: () => api.get('/users/profile'),
  getUserProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  changeUsername: (username) => api.put('/users/username', { username }),
};

export default userService;
