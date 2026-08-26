import api from './apiClient';

export const clinicService = {
  async getOverview(params = {}) {
    const response = await api.get('/api/clinics/overview', { params });
    return response.data;
  },

  async getDoctors() {
    const response = await api.get('/api/clinics/doctors');
    return response.data;
  },

  async getDoctorDetail(doctorId) {
    const response = await api.get(`/api/clinics/doctors/${doctorId}`);
    return response.data;
  },

  async getInvites(params = {}) {
    const response = await api.get('/api/clinics/doctors/invites', { params });
    return response.data;
  },

  async inviteDoctor(payload) {
    const response = await api.post('/api/clinics/doctors/invite', payload);
    return response.data;
  },

  async resendInvite(inviteId) {
    const response = await api.post(`/api/clinics/doctors/invites/${inviteId}/resend`);
    return response.data;
  },

  async cancelInvite(inviteId) {
    const response = await api.delete(`/api/clinics/doctors/invites/${inviteId}`);
    return response.data;
  },

  async getAppointments(params = {}) {
    const response = await api.get('/api/clinics/appointments', { params });
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

  async getSeatUsage() {
    const response = await api.get('/api/clinics/doctors/seats');
    return response.data;
  },

  async getPatients() {
    const response = await api.get('/api/clinics/patients');
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/api/clinics/profile');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.patch('/api/clinics/profile', payload);
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch('/api/clinics/settings', payload);
    return response.data;
  },

  async submitSupport(payload) {
    const response = await api.post('/api/clinics/support', payload);
    return response.data;
  }
};

export default clinicService;
