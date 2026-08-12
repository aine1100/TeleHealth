import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import api, { setAuthToken } from '../services/apiClient';
import { resolveHomePath, roleHome } from '../utils/orgAccess';
import LogoutConfirmModal from '../components/auth/LogoutConfirmModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const logoutAfterRef = useRef(null);

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
    // Commit user before callers navigate so ProtectedRoute does not bounce to /login.
    if (data.user) {
      flushSync(() => {
        setUser(data.user);
      });
    }
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

  const appendOrgForm = (payload, files = []) => {
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
    return form;
  };

  const registerClinic = async (payload, files = []) => {
    const res = await api.post('/api/auth/register/clinic', appendOrgForm(payload, files), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const registerLab = async (payload, files = []) => {
    const res = await api.post('/api/auth/register/lab', appendOrgForm(payload, files), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const registerInsurance = async (payload, files = []) => {
    const res = await api.post('/api/auth/register/insurance', appendOrgForm(payload, files), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const registerPharmacy = async (payload, files = []) => {
    const res = await api.post('/api/auth/register/pharmacy', appendOrgForm(payload, files), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await api.post('/api/auth/verify-email', { email, otp });
    return res.data;
  };

  const resendVerificationOtp = async (email) => {
    const res = await api.post('/api/auth/resend-otp', { email });
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
    const res = await api.post('/api/clinics/doctors/setup', payload);
    return applySession(res.data);
  };

  const getDoctorInvite = useCallback(async (inviteToken) => {
    const res = await api.get(`/api/clinics/doctors/invite/${inviteToken}`);
    return res.data;
  }, []);

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const requestLogout = (afterLogout) => {
    logoutAfterRef.current = typeof afterLogout === 'function' ? afterLogout : null;
    setLogoutOpen(true);
  };

  const cancelLogout = () => {
    logoutAfterRef.current = null;
    setLogoutOpen(false);
  };

  const confirmLogout = () => {
    const after = logoutAfterRef.current;
    logoutAfterRef.current = null;
    setLogoutOpen(false);
    logout();
    after?.();
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
        registerPharmacy,
        verifyEmail,
        resendVerificationOtp,
        forgotPassword,
        resetPassword,
        setupDoctor,
        getDoctorInvite,
        logout,
        requestLogout,
        fetchUser,
        roleHome,
        resolveHomePath
      }}
    >
      {children}
      <LogoutConfirmModal open={logoutOpen} onCancel={cancelLogout} onConfirm={confirmLogout} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
