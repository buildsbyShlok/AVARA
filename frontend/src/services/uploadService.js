import api from './api';

export const uploadService = {
  // Upload multiple listing images (accepts array of { dataUrl, filename, isCover })
  uploadListingImages: (images) => api.post('/upload/listing-images', { images }),

  // Upload avatar image ({ dataUrl, filename })
  uploadAvatar: (dataUrl, filename) => api.post('/upload/avatar', { dataUrl, filename }),
};

export default uploadService;
