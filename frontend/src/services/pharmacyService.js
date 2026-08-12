import api from './apiClient';

export const pharmacyService = {
  async listPharmacies(params = {}) {
    const response = await api.get('/api/pharmacies', { params });
    return response.data;
  },

  async getPharmacy(id) {
    const response = await api.get(`/api/pharmacies/${id}`);
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/api/pharmacies/orders/mine');
    return response.data;
  },

  async createOrder(payload) {
    const response = await api.post('/api/pharmacies/orders', payload);
    return response.data;
  },

  async payOrder(id, payload = {}) {
    const response = await api.post(`/api/pharmacies/orders/${id}/pay`, payload);
    return response.data;
  },

  async getMyProfile() {
    const response = await api.get('/api/pharmacies/me');
    return response.data;
  },

  async updateMyProfile(payload) {
    const response = await api.patch('/api/pharmacies/me', payload);
    return response.data;
  },

  async getAccount() {
    const response = await api.get('/api/pharmacies/me/account');
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/pharmacies/me/settings', payload);
    return response.data;
  },

  async submitSupport(payload) {
    const response = await api.post('/api/pharmacies/me/support', payload);
    return response.data;
  },

  async getNotifications() {
    const response = await api.get('/api/notifications/my-notifications');
    return response.data;
  },

  async markNotificationRead(id) {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  async getOverview() {
    const response = await api.get('/api/pharmacies/me/overview');
    return response.data;
  },

  async listMedicines(params = {}) {
    const response = await api.get('/api/pharmacies/me/medicines', { params });
    return response.data;
  },

  async createMedicine(formData) {
    const response = await api.post('/api/pharmacies/me/medicines', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updateMedicine(id, formData) {
    const response = await api.put(`/api/pharmacies/me/medicines/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async deleteMedicine(id) {
    const response = await api.delete(`/api/pharmacies/me/medicines/${id}`);
    return response.data;
  },

  async adjustStock(id, payload) {
    const response = await api.patch(`/api/pharmacies/me/medicines/${id}/stock`, payload);
    return response.data;
  },

  async updateOrderStatus(id, payload) {
    const response = await api.patch(`/api/pharmacies/me/orders/${id}/status`, payload);
    return response.data;
  }
};

export default pharmacyService;
