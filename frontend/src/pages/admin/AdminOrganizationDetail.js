import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentViewer from '../../components/ui/DocumentViewer';
import { adminService } from '../../services/adminService';
import { orgTypeLabel } from '../../utils/orgAccess';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const AdminOrganizationDetail = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getOrganization(orgId);
        if (mounted) {
          setOrg(res.data);
          setNotes(res.data?.verificationNotes || '');
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Organization not found');
        navigate('/admin/organizations');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [orgId, navigate]);

  const review = async (status) => {
    setActing(true);
    try {
      const res = await adminService.reviewOrganization(orgId, { status, notes });
      setOrg(res.data);
      toast.success(status === 'approved' ? 'Organization approved' : 'Organization rejected');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update organization');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading organization…
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="mx-auto max-w-[900px] animate-fade-up">
      <button
        type="button"
        onClick={() => navigate('/admin/organizations')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to organizations
      </button>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              {orgTypeLabel(org.type)}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink-900">{org.organizationName}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {org.contactPerson} · {org.email} · {org.phone}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusStyles[org.verificationStatus] || statusStyles.pending
                }`}
              >
                Approval: {org.verificationStatus}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  org.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {org.isEmailVerified ? 'Email verified' : 'Email not verified'}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  org.isActive ? 'bg-sky-50 text-sky-700' : 'bg-ink-100 text-ink-500'
                }`}
              >
                {org.isActive ? 'Account active' : 'Account inactive'}
              </span>
            </div>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              statusStyles[org.verificationStatus] || statusStyles.pending
            }`}
          >
            {org.verificationStatus}
          </span>
        </div>

        {!org.isEmailVerified ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This organization has not completed email OTP verification. Approving them will activate
            the account and allow login without waiting for the email OTP.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Registration number', value: org.registrationNumber || '—' },
            { label: 'Organization type', value: org.organizationType || '—' },
            { label: 'City', value: org.city || '—' },
            { label: 'District', value: org.district || '—' },
            { label: 'Address', value: org.address || '—' },
            {
              label: 'Website',
              value: org.website || '—',
              isLink: Boolean(org.website)
            },
            {
              label: 'Registered',
              value: org.createdAt ? new Date(org.createdAt).toLocaleString() : '—'
            },
            { label: 'Admin name', value: `${org.firstName} ${org.lastName}` },
            {
              label: 'Email verification',
              value: org.isEmailVerified ? 'Verified' : 'Not verified'
            },
            {
              label: 'Can operate (invite staff)',
              value: org.canOperate ? 'Yes — approved' : 'No — pending admin approval'
            }
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-ink-100 bg-ink-100/40 px-4 py-3">
              <p className="text-xs font-medium text-ink-500">{field.label}</p>
              {field.isLink ? (
                <a
                  href={field.value.startsWith('http') ? field.value : `https://${field.value}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
                >
                  {field.value}
                  <ExternalLink size={13} />
                </a>
              ) : (
                <p className="mt-1 text-sm font-semibold text-ink-900">{field.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold text-ink-900">Verification documents</p>
          <div className="mt-3">
            <DocumentViewer documents={org.verificationDocuments} emptyText="No documents uploaded." />
          </div>
        </div>

        <div className="mt-6">
          <label className="auth-label" htmlFor="notes">
            Review notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for the organization team..."
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={acting || org.verificationStatus === 'approved'}
            onClick={() => review('approved')}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {org.isEmailVerified ? 'Approve organization' : 'Approve & activate (email too)'}
          </button>
          <button
            type="button"
            disabled={acting || org.verificationStatus === 'rejected'}
            onClick={() => review('rejected')}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Reject organization
          </button>
          <Link
            to="/admin/organizations"
            className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganizationDetail;
