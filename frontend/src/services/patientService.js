import api from './apiClient';

export const patientService = {
  async getAccount() {
    const response = await api.get('/api/patients/me');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.patch('/api/patients/me/profile', payload);
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/patients/me/settings', payload);
    return response.data;
  },

  async submitSupport(payload) {
    const response = await api.post('/api/patients/me/support', payload);
    return response.data;
  },

  async getAppointments() {
    const response = await api.get('/api/appointments/my-appointments');
    return response.data;
  },

  async getAppointment(id) {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },

  async getCareRecords() {
    const response = await api.get('/api/appointments/care-records');
    return response.data;
  },

  async createAppointment(payload) {
    const response = await api.post('/api/appointments', payload);
    return response.data;
  },

  async mockPay(appointmentId, payload = {}) {
    const response = await api.post('/api/payments/mock', { appointmentId, ...payload });
    return response.data;
  },

  async cancelAppointment(id) {
    const response = await api.patch(`/api/appointments/${id}/status`, { status: 'cancelled' });
    return response.data;
  },

  async searchDoctors(params = {}) {
    const response = await api.get('/api/doctors/search', { params });
    return response.data;
  },

  async getDoctor(id) {
    const response = await api.get(`/api/doctors/${id}`);
    return response.data;
  },

  async getDoctorAvailability(doctorId, params = {}) {
    const response = await api.get(`/api/doctors/${doctorId}/availability`, { params });
    return response.data;
  },

  async getReminders(params = {}) {
    const response = await api.get('/api/medicines/my-reminders', { params });
    return response.data;
  },

  async createReminder(payload) {
    const response = await api.post('/api/medicines', payload);
    return response.data;
  },

  async logDose(id, payload) {
    const response = await api.post(`/api/medicines/${id}/log`, payload);
    return response.data;
  },

  async updateReminderStatus(id, status) {
    const response = await api.patch(`/api/medicines/${id}/status`, { status });
    return response.data;
  },

  async deleteReminder(id) {
    const response = await api.delete(`/api/medicines/${id}`);
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

export default patientService;
