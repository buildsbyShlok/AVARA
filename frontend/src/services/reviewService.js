import api from './api';

export const reviewService = {
  create: (listingId, reviewData) => api.post(`/listings/${listingId}/reviews`, reviewData),
  delete: (listingId, reviewId) => api.delete(`/listings/${listingId}/reviews/${reviewId}`),
};

export default reviewService;
