import api from './apiClient';

export const insuranceService = {
  async listProviders(params = {}) {
    const response = await api.get('/api/insurance/providers', { params });
    return response.data;
  },

  async getOverview() {
    const response = await api.get('/api/insurance/me/overview');
    return response.data;
  },

  async getAccount() {
    const response = await api.get('/api/insurance/me/account');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.patch('/api/insurance/me/profile', payload);
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/insurance/me/settings', payload);
    return response.data;
  },

  async listPlans() {
    const response = await api.get('/api/insurance/me/plans');
    return response.data;
  },

  async createPlan(payload) {
    const response = await api.post('/api/insurance/me/plans', payload);
    return response.data;
  },

  async updatePlan(id, payload) {
    const response = await api.patch(`/api/insurance/me/plans/${id}`, payload);
    return response.data;
  },

  async listPolicies(params = {}) {
    const response = await api.get('/api/insurance/me/policies', { params });
    return response.data;
  },

  async updatePolicyStatus(id, payload) {
    const response = await api.patch(`/api/insurance/me/policies/${id}/status`, payload);
    return response.data;
  },

  async listClaims(params = {}) {
    const response = await api.get('/api/insurance/me/claims', { params });
    return response.data;
  },

  async updateClaim(id, payload) {
    const response = await api.patch(`/api/insurance/me/claims/${id}`, payload);
    return response.data;
  },

  async getMyPolicies(params = {}) {
    const response = await api.get('/api/insurance/my-policies', { params });
    return response.data;
  },

  async getMyClaims(params = {}) {
    const response = await api.get('/api/insurance/my-claims', { params });
    return response.data;
  },

  async submitMyPolicy(formData) {
    const response = await api.post('/api/insurance/my-policies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async cancelMyPolicy(id) {
    const response = await api.delete(`/api/insurance/my-policies/${id}`);
    return response.data;
  },

  async quote(params = {}) {
    const response = await api.get('/api/insurance/quote', { params });
    return response.data;
  },

  async getNotifications(params = {}) {
    const response = await api.get('/api/notifications/my-notifications', { params });
    return response.data;
  },

  async markNotificationRead(id) {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  }
};

export default insuranceService;
