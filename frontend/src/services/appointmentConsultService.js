import api from './apiClient';

export const appointmentConsultService = {
  async joinWaitingRoom(appointmentId) {
    const response = await api.post(`/api/appointments/${appointmentId}/join-waiting`);
    return response.data;
  },

  async getWaitingRoomStatus(appointmentId) {
    const response = await api.get(`/api/appointments/${appointmentId}/waiting-room`);
    return response.data;
  },

  async getDoctorWaitingQueue() {
    const response = await api.get('/api/appointments/waiting-queue');
    return response.data;
  },

  async startVideoCall(appointmentId) {
    const response = await api.post(`/api/appointments/${appointmentId}/video/start`);
    return response.data;
  },

  async getVideoSession(appointmentId) {
    const response = await api.get(`/api/appointments/${appointmentId}/video/session`);
    return response.data;
  },

  async endVideoCall(appointmentId) {
    const response = await api.post(`/api/appointments/${appointmentId}/video/end`);
    return response.data;
  },

  async getChatMessages(appointmentId) {
    const response = await api.get(`/api/appointments/${appointmentId}/chat`);
    return response.data;
  },

  async sendChatMessage(appointmentId, text) {
    const response = await api.post(`/api/appointments/${appointmentId}/chat`, { text });
    return response.data;
  },

  async uploadChatFile(appointmentId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/appointments/${appointmentId}/chat/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default appointmentConsultService;
