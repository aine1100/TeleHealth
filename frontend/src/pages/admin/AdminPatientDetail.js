import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const AdminPatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getPatient(patientId);
        if (mounted) setPatient(res.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Patient not found');
        navigate('/admin/patients');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [patientId, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading patient…
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="mx-auto max-w-[900px] animate-fade-up">
      <button
        type="button"
        onClick={() => navigate('/admin/patients')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to patients
      </button>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-600">
            {patient.firstName?.[0]}
            {patient.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-ink-500">
              {patient.email} · {patient.phone}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Status', value: patient.status },
            { label: 'Age', value: patient.age ?? '—' },
            { label: 'Gender', value: patient.gender || '—' },
            { label: 'Blood type', value: patient.bloodType || '—' },
            { label: 'City', value: patient.city || '—' },
            { label: 'District', value: patient.district || '—' },
            { label: 'Address', value: patient.address || '—' },
            { label: 'Visits', value: patient.visits },
            {
              label: 'Last visit',
              value: patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : '—'
            },
            {
              label: 'Joined',
              value: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'
            }
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-ink-100 bg-ink-100/40 px-4 py-3">
              <p className="text-xs font-medium text-ink-500">{field.label}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-ink-900">{field.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-100 bg-ink-100/40 px-4 py-3">
            <p className="text-xs font-medium text-ink-500">Allergies</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}
            </p>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-100/40 px-4 py-3">
            <p className="text-xs font-medium text-ink-500">Chronic conditions</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {patient.chronicConditions?.length
                ? patient.chronicConditions.join(', ')
                : 'None recorded'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPatientDetail;
