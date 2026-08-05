import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, LogOut, RefreshCw, ShieldX } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import {
  getVerificationStatus,
  isOrganizationApproved,
  isOrganizationRole,
  orgTypeLabel,
  roleHome
} from '../../utils/orgAccess';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { user, logout, fetchUser, loading } = useAuth();
  const status = getVerificationStatus(user);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isOrganizationRole(user.role)) {
      navigate(roleHome(user.role), { replace: true });
      return;
    }
    if (isOrganizationApproved(user)) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleRefresh = async () => {
    const next = await fetchUser();
    if (next && isOrganizationApproved(next)) {
      navigate(roleHome(next.role), { replace: true });
    }
  };

  const orgName =
    user?.organizationProfile?.organizationName ||
    user?.clinicProfile?.clinicName ||
    'your organization';

  const isRejected = status === 'rejected';

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-ink-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fa] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(11,116,255,0.08),_transparent_50%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_45%)]" />

      <div className="relative w-full max-w-lg rounded-3xl border border-ink-200/70 bg-white p-8 text-center shadow-card animate-fade-up">
        <div className="flex justify-center">
          <BrandLogo to={null} size="xl" stacked />
        </div>

        <div
          className={`mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isRejected ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {isRejected ? <ShieldX size={26} /> : <Clock3 size={26} />}
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          {isRejected ? 'Registration not approved' : 'Account under review'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {isRejected ? (
            <>
              <span className="font-semibold text-ink-700">{orgName}</span> (
              {orgTypeLabel(user.role)}) was not approved for platform access.
              {user.organizationProfile?.verificationNotes
                ? ` Note from review: ${user.organizationProfile.verificationNotes}`
                : ' Please contact Alive Health support if you believe this is a mistake.'}
            </>
          ) : (
            <>
              Thanks for registering <span className="font-semibold text-ink-700">{orgName}</span> as a{' '}
              {orgTypeLabel(user.role).toLowerCase()}. Our super admin team is reviewing your documents.
              You will be able to open your dashboard once approved.
            </>
          )}
        </p>

        <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-100/50 px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Application</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{orgName}</p>
          <p className="text-xs text-ink-500">
            {user.email} · Status:{' '}
            <span className="font-semibold capitalize text-ink-700">{status}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!isRejected ? (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600"
            >
              <RefreshCw size={16} />
              Check approval status
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
