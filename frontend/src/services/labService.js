import api from './apiClient';

export const labService = {
  async listLabs(params = {}) {
    const response = await api.get('/api/labs', { params });
    return response.data;
  },

  async getOverview() {
    const response = await api.get('/api/labs/me/overview');
    return response.data;
  },

  async listOrders(params = {}) {
    const response = await api.get('/api/labs/me/orders', { params });
    return response.data;
  },

  async acceptOrder(id) {
    const response = await api.post(`/api/labs/me/orders/${id}/accept`);
    return response.data;
  },

  async updateOrder(id, { status, results }, file) {
    const formData = new FormData();
    if (status) formData.append('status', status);
    if (results) formData.append('results', JSON.stringify(results));
    if (file) formData.append('report', file);
    const response = await api.patch(`/api/labs/me/orders/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async getAccount() {
    const response = await api.get('/api/labs/me/account');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.patch('/api/labs/me/profile', payload);
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/labs/me/settings', payload);
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

export default labService;
