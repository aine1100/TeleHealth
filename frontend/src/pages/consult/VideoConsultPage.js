import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import VideoConsultation from '../../components/consult/VideoConsultation';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { patientService } from '../../services/patientService';
import { getDoctorName, getPatientName } from '../../utils/appointmentCalendar';

const VideoConsultPage = ({ role = 'patient' }) => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res =
          role === 'doctor'
            ? await doctorService.getAppointment(appointmentId)
            : await patientService.getAppointment(appointmentId);
        if (!mounted) return;

        const appt = res?.data || null;
        setAppointment(appt);

        // Patients who arrive before the doctor starts stay in the waiting room
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
  }, [appointmentId, role, navigate]);

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

  if (loading || !user?._id) {
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
          userId={user?._id}
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
