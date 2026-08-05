import api from './apiClient';

export const doctorService = {
  async getMyAppointments() {
    const response = await api.get('/api/appointments/my-appointments');
    return response.data;
  },

  async getAppointment(id) {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },

  async updateAppointmentStatus(id, status) {
    const response = await api.patch(`/api/appointments/${id}/status`, { status });
    return response.data;
  },

  async getAccount() {
    const response = await api.get('/api/doctors/me');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.patch('/api/doctors/me/profile', payload);
    return response.data;
  },

  async updateSchedule(payload) {
    const response = await api.patch('/api/doctors/me/schedule', payload);
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/doctors/me/settings', payload);
    return response.data;
  },

  async submitSupport(payload) {
    const response = await api.post('/api/doctors/me/support', payload);
    return response.data;
  }
};

export default doctorService;
