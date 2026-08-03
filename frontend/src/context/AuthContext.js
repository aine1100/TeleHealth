import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, { setAuthToken } from '../lib/api';

const AuthContext = createContext();

const roleHome = (role) => {
  switch (role) {
    case 'doctor':
      return '/doctor/home';
    case 'clinic_admin':
      return '/clinic/home';
    case 'lab_tech':
      return '/lab/home';
    case 'insurance':
      return '/insurance/home';
    case 'admin':
      return '/admin/home';
    default:
      return '/patient/home';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      setAuthToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const applySession = (data) => {
    const token = data.accessToken || data.token;
    if (token) setAuthToken(token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) setUser(data.user);
    return data;
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    return applySession(res.data);
  };

  const registerPatient = async (payload) => {
    const res = await api.post('/api/auth/register/patient', payload);
    return res.data;
  };

  const registerClinic = async (payload, files = []) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });
    files.forEach((file) => form.append('documents', file));

    const res = await api.post('/api/auth/register/clinic', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const registerLab = async (payload, files = []) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });
    files.forEach((file) => form.append('documents', file));

    const res = await api.post('/api/auth/register/lab', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const registerInsurance = async (payload, files = []) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });
    files.forEach((file) => form.append('documents', file));

    const res = await api.post('/api/auth/register/insurance', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await api.post('/api/auth/verify-email', { email, otp });
    return res.data;
  };

  const forgotPassword = async (identifier, channel = 'email') => {
    const res = await api.post('/api/auth/forgot-password', { identifier, channel });
    return res.data;
  };

  const resetPassword = async (identifier, otp, newPassword) => {
    const res = await api.post('/api/auth/reset-password', { identifier, otp, newPassword });
    return res.data;
  };

  const setupDoctor = async (payload) => {
    const res = await api.post('/api/clinic/doctors/setup', payload);
    return applySession(res.data);
  };

  const getDoctorInvite = async (token) => {
    const res = await api.get(`/api/clinic/doctors/invite/${token}`);
    return res.data;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerPatient,
        registerClinic,
        registerLab,
        registerInsurance,
        verifyEmail,
        forgotPassword,
        resetPassword,
        setupDoctor,
        getDoctorInvite,
        logout,
        fetchUser,
        roleHome
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
