import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import VideoConsultation from '../../components/consult/VideoConsultation';
import { useAuth } from '../../context/AuthContext';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import { doctorService } from '../../services/doctorService';
import { patientService } from '../../services/patientService';
import { getDoctorName, getPatientName } from '../../utils/appointmentCalendar';

const userIdOf = (user) => user?._id || user?.id || null;

const VideoConsultPage = ({ role = 'patient' }) => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const userId = userIdOf(user);

  useEffect(() => {
    if (authLoading || !userId) return undefined;

    let mounted = true;
    const load = async () => {
      try {
        if (role === 'doctor') {
          try {
            await appointmentConsultService.startVideoCall(appointmentId);
          } catch (error) {
            const message = error?.response?.data?.message || '';
            if (!/already|progress|started/i.test(message)) {
              throw error;
            }
          }
        }

        const res =
          role === 'doctor'
            ? await doctorService.getAppointment(appointmentId)
            : await patientService.getAppointment(appointmentId);
        if (!mounted) return;

        const appt = res?.data || null;
        setAppointment(appt);

        if (
          role === 'patient' &&
          appt &&
          ['confirmed', 'in_waiting_room'].includes(appt.status)
        ) {
          navigate(`/patient/waiting/${appointmentId}`, { replace: true });
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load consultation');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appointmentId, role, navigate, authLoading, userId]);

  const backPath = role === 'doctor' ? '/doctor/appointments' : '/patient/appointments';
  const counterpartName =
    role === 'doctor' ? getPatientName(appointment || {}) : getDoctorName(appointment || {});

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    (role === 'doctor' ? 'Doctor' : 'Patient');

  const handleEnded = useCallback(() => {
    if (role === 'doctor') {
      navigate(`/doctor/appointments/${appointmentId}/care-plan`);
      return;
    }
    navigate(backPath);
  }, [navigate, backPath, role, appointmentId]);

  if (authLoading || loading || !userId) {
    return <p className="py-20 text-center text-sm text-ink-500">Loading consultation…</p>;
  }

  if (
    role === 'patient' &&
    appointment &&
    ['confirmed', 'in_waiting_room'].includes(appointment.status)
  ) {
    return <p className="py-20 text-center text-sm text-ink-500">Opening waiting room…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <Link to={backPath} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Back to appointments
      </Link>

      <div className="mt-4">
        <VideoConsultation
          appointmentId={appointmentId}
          userId={userId}
          role={role}
          userName={userName}
          counterpartName={counterpartName}
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
};

export default VideoConsultPage;
