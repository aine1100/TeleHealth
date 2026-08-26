import React, { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import { insuranceService } from '../../services/insuranceService';

const emptyPlan = {
  name: '',
  description: '',
  consultCoveragePercent: 80,
  pharmacyCoveragePercent: 70,
  labCoveragePercent: 70,
  consultCopayFixed: 5000,
  pharmacyCopayFixed: 3000,
  labCopayFixed: 0,
  annualLimit: 5000000,
  perVisitLimit: 500000,
  isDefault: false
};

const InsurancePlans = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await insuranceService.listPlans();
      setPlans(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const startEdit = (plan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      consultCoveragePercent: plan.consultCoveragePercent ?? 80,
      pharmacyCoveragePercent: plan.pharmacyCoveragePercent ?? 70,
      labCoveragePercent: plan.labCoveragePercent ?? 70,
      consultCopayFixed: plan.consultCopayFixed ?? 0,
      pharmacyCopayFixed: plan.pharmacyCopayFixed ?? 0,
      labCopayFixed: plan.labCopayFixed ?? 0,
      annualLimit: plan.annualLimit ?? 0,
      perVisitLimit: plan.perVisitLimit ?? 0,
      isDefault: Boolean(plan.isDefault)
    });
    setOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        consultCoveragePercent: Number(form.consultCoveragePercent),
        pharmacyCoveragePercent: Number(form.pharmacyCoveragePercent),
        labCoveragePercent: Number(form.labCoveragePercent),
        consultCopayFixed: Number(form.consultCopayFixed),
        pharmacyCopayFixed: Number(form.pharmacyCopayFixed),
        labCopayFixed: Number(form.labCopayFixed),
        annualLimit: Number(form.annualLimit),
        perVisitLimit: Number(form.perVisitLimit)
      };
      if (editingId) {
        await insuranceService.updatePlan(editingId, payload);
        toast.success('Plan updated');
      } else {
        await insuranceService.createPlan(payload);
        toast.success('Plan created');
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyPlan);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Benefit plans</h1>
          <p className="mt-1 text-sm text-ink-500">
            Set coverage % and patient co-pay amounts for consults, pharmacy, and labs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyPlan);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          New plan
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-brand-600">{editingId ? 'Edit plan' : 'New plan'}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextInput label="Plan name" name="name" value={form.name} onChange={onChange} required />
            <label className="flex items-end gap-2 pb-2 text-sm text-ink-700">
              <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={onChange} />
              Default plan for new members
            </label>
            <div className="sm:col-span-2">
              <TextTextarea label="Description" name="description" value={form.description} onChange={onChange} rows={2} />
            </div>
            <TextInput
              label="Consult cover %"
              type="number"
              name="consultCoveragePercent"
              value={form.consultCoveragePercent}
              onChange={onChange}
            />
            <TextInput
              label="Consult co-pay (UGX)"
              type="number"
              name="consultCopayFixed"
              value={form.consultCopayFixed}
              onChange={onChange}
            />
            <TextInput
              label="Pharmacy cover %"
              type="number"
              name="pharmacyCoveragePercent"
              value={form.pharmacyCoveragePercent}
              onChange={onChange}
            />
            <TextInput
              label="Pharmacy co-pay (UGX)"
              type="number"
              name="pharmacyCopayFixed"
              value={form.pharmacyCopayFixed}
              onChange={onChange}
            />
            <TextInput
              label="Lab cover %"
              type="number"
              name="labCoveragePercent"
              value={form.labCoveragePercent}
              onChange={onChange}
            />
            <TextInput
              label="Lab co-pay (UGX)"
              type="number"
              name="labCopayFixed"
              value={form.labCopayFixed}
              onChange={onChange}
            />
            <TextInput
              label="Annual limit (UGX)"
              type="number"
              name="annualLimit"
              value={form.annualLimit}
              onChange={onChange}
            />
            <TextInput
              label="Per-visit limit (UGX)"
              type="number"
              name="perVisitLimit"
              value={form.perVisitLimit}
              onChange={onChange}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save plan'}
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500">
            Loading plans…
          </div>
        ) : plans.length ? (
          plans.map((plan) => (
            <article key={plan._id} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink-900">{plan.name}</h3>
                    {plan.isDefault ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{plan.description || 'No description'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-600">
                    <span className="rounded-full bg-ink-50 px-2.5 py-1">
                      Consult {plan.consultCoveragePercent}% · co-pay UGX{' '}
                      {Number(plan.consultCopayFixed || 0).toLocaleString()}
                    </span>
                    <span className="rounded-full bg-ink-50 px-2.5 py-1">
                      Pharmacy {plan.pharmacyCoveragePercent}% · co-pay UGX{' '}
                      {Number(plan.pharmacyCopayFixed || 0).toLocaleString()}
                    </span>
                    <span className="rounded-full bg-ink-50 px-2.5 py-1">
                      Cap {Number(plan.annualLimit || 0).toLocaleString()}/yr
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(plan)}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                >
                  Edit
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500">
            No plans yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default InsurancePlans;
