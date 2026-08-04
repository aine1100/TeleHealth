import api from './apiClient';

export const clinicService = {
  async getOverview() {
    const response = await api.get('/api/clinics/overview');
    return response.data;
  },

  async getDoctors() {
    const response = await api.get('/api/clinics/doctors');
    return response.data;
  },

  async inviteDoctor(payload) {
    const response = await api.post('/api/clinics/doctors/invite', payload);
    return response.data;
  },

  async getAppointments() {
    const response = await api.get('/api/clinics/appointments');
    return response.data;
  },

  async getSeatUsage() {
    const response = await api.get('/api/clinics/doctors/seats');
    return response.data;
  },

  async getPatients() {
    const response = await api.get('/api/clinics/patients');
    return response.data;
  }
};

export default clinicService;
