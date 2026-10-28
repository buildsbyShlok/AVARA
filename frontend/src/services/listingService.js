import api from './api';

export const listingService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.country) query.set('country', params.country);
    const qs = query.toString();
    return api.get(`/listings${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/listings/${id}`),
  create: (listingData) => api.post('/listings', listingData),
  update: (id, listingData) => api.put(`/listings/${id}`, listingData),
  delete: (id) => api.delete(`/listings/${id}`),
};

export default listingService;
