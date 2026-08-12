import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Store, Truck, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../auth/FormFields';
import { pharmacyService } from '../../services/pharmacyService';
import { useAuth } from '../../context/AuthContext';

const SendPrescriptionModal = ({
  open,
  onClose,
  pharmacy,
  careRecords = [],
  appointmentId: initialAppointmentId = '',
  patientId,
  items: initialItems,
  onSent
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId);
  const profile = pharmacy?.pharmacyProfile || {};
  const offersDelivery = profile.offersDelivery !== false;
  const offersPickup = profile.offersPickup !== false;
  const [method, setMethod] = useState(offersPickup ? 'pickup' : 'delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setMethod(offersPickup ? 'pickup' : 'delivery');
    setDeliveryAddress(user?.address || '');
    setDeliveryNotes('');
    const fallbackId =
      initialAppointmentId ||
      (careRecords.length === 1 ? careRecords[0]._id : '');
    setAppointmentId(fallbackId);
  }, [open, offersPickup, user?.address, initialAppointmentId, careRecords]);

  if (!open || !pharmacy) return null;

  const pharmacyName =
    pharmacy.displayName ||
    profile.pharmacyName ||
    [pharmacy.firstName, pharmacy.lastName].filter(Boolean).join(' ');

  const selectedCare = careRecords.find((item) => item._id === appointmentId);
  const items =
    initialItems?.length
      ? initialItems
      : selectedCare?.prescription || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (careRecords.length && !appointmentId) {
      toast.error('Select a prescription to send');
      return;
    }
    if (method === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Enter a delivery address');
      return;
    }
    setSaving(true);
    try {
      await pharmacyService.createOrder({
        pharmacyId: pharmacy._id,
        appointmentId: appointmentId || undefined,
        patientId: patientId || selectedCare?.patient?._id || selectedCare?.patient || undefined,
        fulfillmentMethod: method,
        deliveryAddress: method === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        items: items.length ? items : undefined
      });
      toast.success('Prescription order created — pay to send it to the pharmacy');
      onSent?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send prescription');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-950/55" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Send prescription</p>
            <h2 className="text-base font-bold text-ink-900">{pharmacyName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          {careRecords.length ? (
            <div>
              <label className="auth-label">Prescription</label>
              <select
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="auth-input mt-1"
                required
              >
                <option value="">Select a visit prescription…</option>
                {careRecords.map((record) => (
                  <option key={record._id} value={record._id}>
                    {(record.scheduledDate
                      ? new Date(record.scheduledDate).toLocaleDateString()
                      : 'Visit')}{' '}
                    · {record.prescription?.length || 0} medicine(s)
                    {record.diagnosis ? ` · ${record.diagnosis}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              No prescriptions available yet. After a doctor issues one, you can send it here.
            </p>
          )}

          {items.length ? (
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Medicines</p>
              <ul className="mt-1 space-y-1 text-sm text-ink-700">
                {items.map((item, index) => (
                  <li key={`${item.medicineName}-${index}`}>
                    <span className="font-medium">{item.medicineName}</span>
                    {item.dosage ? ` · ${item.dosage}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : careRecords.length && appointmentId ? (
            <p className="text-sm text-ink-600">No medicines on this prescription.</p>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-800">How should medicines be collected?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {offersPickup ? (
                <button
                  type="button"
                  onClick={() => setMethod('pickup')}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    method === 'pickup'
                      ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <Store size={16} className="text-brand-600" />
                  <p className="mt-1 text-sm font-semibold text-ink-900">Onsite pickup</p>
                  <p className="text-xs text-ink-500">Collect at the pharmacy</p>
                </button>
              ) : null}
              {offersDelivery ? (
                <button
                  type="button"
                  onClick={() => setMethod('delivery')}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    method === 'delivery'
                      ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <Truck size={16} className="text-brand-600" />
                  <p className="mt-1 text-sm font-semibold text-ink-900">Home delivery</p>
                  <p className="text-xs text-ink-500">
                    {profile.deliveryFee != null
                      ? `From UGX ${Number(profile.deliveryFee).toLocaleString()}`
                      : 'Delivered to your address'}
                  </p>
                </button>
              ) : null}
            </div>
          </div>

          {method === 'delivery' ? (
            <>
              <TextInput
                label="Delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street, area, city"
                required
              />
              <TextTextarea
                label="Delivery notes (optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={2}
                placeholder="Gate code, landmark, preferred time…"
              />
            </>
          ) : (
            <p className="inline-flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-brand-500" />
              {profile.address || pharmacy.address || 'Pharmacy address on file'}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-ink-100 px-4 py-3">
          <button
            type="submit"
            disabled={saving || !careRecords.length}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Sending…' : 'Send to pharmacy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default SendPrescriptionModal;
