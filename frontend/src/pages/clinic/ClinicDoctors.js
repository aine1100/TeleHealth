import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Mail, Plus, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InviteDoctorModal from '../../components/clinic/InviteDoctorModal';
import StatusFilter from '../../components/clinic/StatusFilter';
import { doctorStatusOptions } from '../../data/clinicDashboard';
import { clinicService } from '../../services/clinicService';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  expired: 'bg-rose-50 text-rose-700',
  accepted: 'bg-sky-50 text-sky-700',
  cancelled: 'bg-ink-100 text-ink-500',
  inactive: 'bg-ink-100 text-ink-500'
};

const emptyInvite = {
  firstName: '',
  lastName: '',
  email: '',
  specialty: ''
};

const mapDoctor = (doctor) => ({
  id: doctor._id || doctor.id,
  kind: 'doctor',
  firstName: doctor.firstName || 'Doctor',
  lastName: doctor.lastName || '',
  email: doctor.email,
  phone: doctor.phone || '—',
  specialty: doctor.doctorProfile?.specialty || 'General Practice',
  licenseNumber: doctor.doctorProfile?.licenseNumber || '—',
  experience: doctor.doctorProfile?.experience || 0,
  bio: doctor.doctorProfile?.bio || '',
  consultationFee: doctor.doctorProfile?.consultationFee || 25000,
  consultationTypes: doctor.doctorProfile?.consultationTypes || ['video', 'chat'],
  availableDays: doctor.doctorProfile?.availableDays || [],
  availableHours: doctor.doctorProfile?.availableHours || { start: '09:00', end: '17:00' },
  status: doctor.isActive === false ? 'inactive' : 'active',
  consultations: 0,
  rating: doctor.doctorProfile?.rating || null,
  reviewCount: doctor.doctorProfile?.reviewCount || 0,
  joined: doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : '—',
  isAvailable: doctor.doctorProfile?.isAvailable !== false
});

const mapInvite = (invite) => ({
  id: invite._id || invite.id,
  kind: 'invite',
  firstName: invite.firstName || 'Invited',
  lastName: invite.lastName || 'Doctor',
  email: invite.email,
  phone: '—',
  specialty: invite.specialty || 'General Practice',
  licenseNumber: '—',
  experience: null,
  bio: '',
  consultationFee: null,
  consultationTypes: [],
  availableDays: [],
  availableHours: null,
  status: invite.status || 'pending',
  consultations: 0,
  rating: null,
  reviewCount: 0,
  joined: invite.createdAt ? `Invited ${new Date(invite.createdAt).toLocaleDateString()}` : 'Invite sent',
  expiresAt: invite.expiresAt,
  inviteId: invite._id || invite.id
});

const ClinicDoctors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [form, setForm] = useState(emptyInvite);

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clinicService.getDoctors();
      const doctors = (response?.data || []).map(mapDoctor);
      const invites = (response?.invites || [])
        .filter((invite) => invite.status === 'pending' || invite.status === 'expired')
        .map(mapInvite);
      // Pending invites first, then doctors
      setRows([...invites, ...doctors]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load doctors');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setQuery(q);
  }, [searchParams]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((d) => d.status === 'active').length,
      pending: rows.filter((d) => d.status === 'pending').length,
      inactive: rows.filter((d) => d.status === 'inactive' || d.status === 'expired').length
    }),
    [rows]
  );

  const filtered = rows.filter((doctor) => {
    const haystack = `${doctor.firstName} ${doctor.lastName} ${doctor.email} ${doctor.specialty}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      doctor.status === statusFilter ||
      (statusFilter === 'inactive' && doctor.status === 'expired');
    return matchesQuery && matchesStatus;
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyInvite);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) {
      toast.error('Email is required');
      return;
    }

    setSubmitting(true);
    try {
      await clinicService.inviteDoctor({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        specialty: form.specialty || 'General Practice'
      });
      closeModal();
      toast.success('Invite sent');
      await loadTeam();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send invite');
    } finally {
      setSubmitting(false);
    }
  };

  const resendInvite = async (inviteId) => {
    setActingId(inviteId);
    try {
      await clinicService.resendInvite(inviteId);
      toast.success('Invite resent');
      await loadTeam();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to resend invite');
    } finally {
      setActingId(null);
    }
  };

  const cancelInvite = async (inviteId) => {
    setActingId(inviteId);
    try {
      await clinicService.cancelInvite(inviteId);
      toast.success('Invite cancelled');
      await loadTeam();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to cancel invite');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Doctors</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage your care team, track pending invites, and open doctor profiles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadTeam}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
          >
            <Plus size={16} />
            Invite doctor
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Team total', value: counts.all },
          { label: 'Active doctors', value: counts.active },
          { label: 'Pending invites', value: counts.pending },
          { label: 'Inactive / expired', value: counts.inactive }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-card">
            <p className="text-xs font-medium text-ink-500">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label className="auth-label">Search</label>
            <Search className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, specialty..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={doctorStatusOptions}
              label="Status"
            />
            <p className="pb-3 text-sm text-ink-500 sm:whitespace-nowrap">
              Showing <span className="font-semibold text-ink-900">{filtered.length}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Specialty</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Consults</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading your care team…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((doctor) => (
                  <tr
                    key={`${doctor.kind}-${doctor.id}`}
                    className={`border-t border-ink-100 hover:bg-ink-100/40 ${
                      doctor.kind === 'doctor' ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (doctor.kind === 'doctor') navigate(`/clinic/doctors/${doctor.id}`);
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                          {(doctor.firstName?.[0] || 'D').toUpperCase()}
                          {(doctor.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">
                            {doctor.kind === 'invite' ? '' : 'Dr. '}
                            {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="text-xs text-ink-500">{doctor.email}</p>
                          {doctor.kind === 'invite' ? (
                            <p className="mt-0.5 text-[11px] font-medium text-amber-600">
                              Awaiting signup
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{doctor.specialty}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          statusStyles[doctor.status] || statusStyles.inactive
                        }`}
                      >
                        {doctor.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">
                      {doctor.kind === 'invite' ? '—' : doctor.consultations}
                    </td>
                    <td className="px-4 py-3.5">
                      {doctor.rating ? (
                        <span className="inline-flex items-center gap-1 font-medium text-ink-800">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {doctor.rating}
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink-500">{doctor.joined}</td>
                    <td className="px-4 py-3.5">
                      {doctor.kind === 'doctor' ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clinic/doctors/${doctor.id}`);
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={actingId === doctor.inviteId}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              resendInvite(doctor.inviteId);
                            }}
                          >
                            <Mail size={13} />
                            Resend
                          </button>
                          <button
                            type="button"
                            disabled={actingId === doctor.inviteId}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelInvite(doctor.inviteId);
                            }}
                          >
                            <Trash2 size={13} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm font-semibold text-ink-900">No doctors on your team yet</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Invite a doctor by email — they will appear here while the invite is pending.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      <Plus size={16} />
                      Invite doctor
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteDoctorModal
        open={modalOpen}
        onClose={closeModal}
        form={form}
        onChange={onChange}
        onSpecialtyChange={(value) => setForm((prev) => ({ ...prev, specialty: value }))}
        onSubmit={onSubmit}
        loading={submitting}
      />
    </div>
  );
};

export default ClinicDoctors;
