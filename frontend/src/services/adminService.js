import api from './apiClient';

const unwrap = (response) => response.data;

export const adminService = {
  getOverview: async () => unwrap(await api.get('/api/admin/overview')),

  getOrganizations: async (params = {}) =>
    unwrap(await api.get('/api/admin/organizations', { params })),

  getPendingOrganizations: async (params = {}) =>
    unwrap(await api.get('/api/admin/organizations/pending', { params })),

  getOrganization: async (id) => unwrap(await api.get(`/api/admin/organizations/${id}`)),

  reviewOrganization: async (id, payload) =>
    unwrap(await api.patch(`/api/admin/organizations/${id}/review`, payload)),

  getClinics: async (params = {}) => unwrap(await api.get('/api/admin/clinics', { params })),

  getLabs: async (params = {}) => unwrap(await api.get('/api/admin/labs', { params })),

  getPatients: async (params = {}) => unwrap(await api.get('/api/admin/patients', { params })),

  getPatient: async (id) => unwrap(await api.get(`/api/admin/patients/${id}`)),

  submitSupport: async (payload) => unwrap(await api.post('/api/admin/support', payload))
};

export default adminService;
