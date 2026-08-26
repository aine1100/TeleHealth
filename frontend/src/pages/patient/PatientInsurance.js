import React, { useCallback, useEffect, useState } from 'react';
import { FileUp, Shield, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { TextInput } from '../../components/auth/FormFields';
import ListPagination from '../../components/ui/ListPagination';
import { insuranceService } from '../../services/insuranceService';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 10;

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  expired: 'bg-ink-100 text-ink-500',
  cancelled: 'bg-ink-100 text-ink-500'
};

const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const PatientInsurance = () => {
  const { fetchUser } = useAuth();
  const [providers, setProviders] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [policyTotal, setPolicyTotal] = useState(0);
  const [claimTotal, setClaimTotal] = useState(0);
  const [policyPage, setPolicyPage] = useState(1);
  const [claimPage, setClaimPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    insurerId: '',
    policyNumber: '',
    memberName: '',
    coverageType: 'individual',
    validFrom: '',
    validUntil: ''
  });
  const [document, setDocument] = useState(null);

  const loadProviders = useCallback(async () => {
    try {
      const res = await insuranceService.listProviders({ limit: 50 });
      setProviders(res?.data || []);
    } catch {
      setProviders([]);
    }
  }, []);

  const loadPolicies = useCallback(async () => {
    const res = await insuranceService.getMyPolicies({ page: policyPage, limit: PAGE_SIZE });
    setPolicies(res?.data || []);
    setPolicyTotal(res?.total || 0);
  }, [policyPage]);

  const loadClaims = useCallback(async () => {
    const res = await insuranceService.getMyClaims({ page: claimPage, limit: PAGE_SIZE });
    setClaims(res?.data || []);
    setClaimTotal(res?.total || 0);
  }, [claimPage]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadProviders(), loadPolicies(), loadClaims()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load insurance');
    } finally {
      setLoading(false);
    }
  }, [loadProviders, loadPolicies, loadClaims]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const providerOptions = [
    { value: '', label: 'Select insurance company' },
    ...providers.map((p) => ({
      value: p._id,
      label: p.displayName || p.organizationProfile?.organizationName || `${p.firstName} ${p.lastName}`
    }))
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.insurerId) {
      toast.error('Select an insurance company on Alive Health');
      return;
    }
    if (!form.policyNumber.trim()) {
      toast.error('Enter your policy number');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('insurerId', form.insurerId);
      fd.append('policyNumber', form.policyNumber.trim());
      fd.append('memberName', form.memberName.trim());
      fd.append('coverageType', form.coverageType);
      if (form.validFrom) fd.append('validFrom', form.validFrom);
      if (form.validUntil) fd.append('validUntil', form.validUntil);
      if (document) fd.append('document', document);

      await insuranceService.submitMyPolicy(fd);
      toast.success('Submitted for verification by your insurer');
      setDocument(null);
      setForm((prev) => ({ ...prev, policyNumber: '', memberName: '' }));
      setPolicyPage(1);
      await fetchUser();
      await loadPolicies();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit insurance');
    } finally {
      setSaving(false);
    }
  };

  const cancelPolicy = async (id) => {
    try {
      await insuranceService.cancelMyPolicy(id);
      toast.success('Insurance link removed');
      await fetchUser();
      await loadPolicies();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to remove policy');
    }
  };

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">My insurance</h1>
        <p className="mt-1 text-sm text-ink-500">
          Link a partner on Alive Health, enter your policy number, and optionally upload your card.
          After they verify you, consults and pharmacy orders can split the bill (you pay co-pay;
          insurer covers the rest).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6"
      >
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-brand-600" />
          <h2 className="text-sm font-bold text-ink-900">Add or update coverage</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Insurance company"
            value={form.insurerId}
            onChange={(value) => setForm((p) => ({ ...p, insurerId: value }))}
            options={providerOptions}
          />
          <TextInput
            label="Policy / membership number"
            name="policyNumber"
            value={form.policyNumber}
            onChange={(e) => setForm((p) => ({ ...p, policyNumber: e.target.value }))}
            placeholder="e.g. UAP-2024-8891"
            required
          />
          <TextInput
            label="Name on card"
            name="memberName"
            value={form.memberName}
            onChange={(e) => setForm((p) => ({ ...p, memberName: e.target.value }))}
            placeholder="As printed on your card"
          />
          <Dropdown
            label="Coverage type"
            value={form.coverageType}
            onChange={(value) => setForm((p) => ({ ...p, coverageType: value }))}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'family', label: 'Family' },
              { value: 'corporate', label: 'Corporate' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <TextInput
            label="Valid from"
            type="date"
            name="validFrom"
            value={form.validFrom}
            onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
          />
          <TextInput
            label="Valid until"
            type="date"
            name="validUntil"
            value={form.validUntil}
            onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <label className="auth-label">Policy card / document (PDF, JPG, PNG)</label>
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600 hover:border-brand-300 hover:bg-brand-50/40">
              <FileUp size={18} className="text-brand-600" />
              <span className="min-w-0 truncate">
                {document ? document.name : 'Upload card or membership letter (optional but recommended)'}
              </span>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => setDocument(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !providers.length}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit for verification'}
        </button>
        {!providers.length && !loading ? (
          <p className="mt-2 text-xs text-amber-700">
            No approved insurance partners on the platform yet. Ask admin to approve an insurer, or
            register one.
          </p>
        ) : null}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink-900">Linked policies</h2>
        {loading ? (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-8 text-center text-sm text-ink-500">
            Loading…
          </div>
        ) : policies.length ? (
          <>
            {policies.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink-900">
                      {item.insurer?.displayName || 'Insurance partner'}
                    </p>
                    <p className="mt-1 font-mono text-sm text-ink-600">{item.policyNumber}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {item.plan?.name
                        ? `${item.plan.name} · consult ${item.plan.consultCoveragePercent}%`
                        : 'Awaiting plan assignment'}
                    </p>
                    {item.documentUrl ? (
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-brand-600"
                      >
                        View uploaded document →
                      </a>
                    ) : null}
                    {item.rejectionReason ? (
                      <p className="mt-2 text-xs text-rose-600">{item.rejectionReason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        statusStyles[item.status] || statusStyles.pending
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelPolicy(item._id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <ListPagination
              page={policyPage}
              limit={PAGE_SIZE}
              total={policyTotal}
              onPageChange={setPolicyPage}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center text-sm text-ink-500">
            No insurance linked yet. Choose a partner above to get started.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink-900">My claims</h2>
        {claims.length ? (
          <>
            {claims.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink-900">{item.claimNumber}</p>
                    <p className="mt-1 text-sm text-ink-600">
                      {String(item.type || '').replace(/_/g, ' ')} · Bill {money(item.amountClaimed)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      You paid {money(item.patientShare)} · Insurer {money(item.insurerShare)}
                      {item.status === 'approved' || item.status === 'paid'
                        ? ` · Approved ${money(item.approvedAmount)}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                      statusStyles[item.status] || statusStyles.pending
                    }`}
                  >
                    {String(item.status || '').replace(/_/g, ' ')}
                  </span>
                </div>
              </article>
            ))}
            <ListPagination
              page={claimPage}
              limit={PAGE_SIZE}
              total={claimTotal}
              onPageChange={setClaimPage}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-8 text-center text-sm text-ink-500">
            Claims will appear here when you pay a visit or pharmacy order with insurance.
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientInsurance;
