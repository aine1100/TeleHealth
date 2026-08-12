import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import { pharmacyService } from '../../services/pharmacyService';
import { useAuth } from '../../context/AuthContext';

const PharmacyProfile = () => {
  const { user, fetchUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pharmacyName: '',
    licenseNumber: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    description: '',
    start: '08:00',
    end: '20:00',
    offersDelivery: true,
    offersPickup: true,
    deliveryFee: 5000,
    deliveryRadiusKm: 15,
    isOpen: true
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pharmacyService.getMyProfile();
        const profile = res?.data?.pharmacyProfile || user?.pharmacyProfile || {};
        setForm({
          pharmacyName: profile.pharmacyName || '',
          licenseNumber: profile.licenseNumber || '',
          phone: profile.phone || res?.data?.phone || user?.phone || '',
          address: profile.address || res?.data?.address || '',
          city: profile.city || res?.data?.city || '',
          district: profile.district || res?.data?.district || '',
          description: profile.description || '',
          start: profile.openingHours?.start || '08:00',
          end: profile.openingHours?.end || '20:00',
          offersDelivery: profile.offersDelivery !== false,
          offersPickup: profile.offersPickup !== false,
          deliveryFee: profile.deliveryFee ?? 5000,
          deliveryRadiusKm: profile.deliveryRadiusKm ?? 15,
          isOpen: profile.isOpen !== false
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load profile');
      }
    };
    load();
  }, [user]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pharmacyService.updateMyProfile({
        pharmacyName: form.pharmacyName,
        licenseNumber: form.licenseNumber,
        phone: form.phone,
        address: form.address,
        city: form.city,
        district: form.district,
        description: form.description,
        openingHours: { start: form.start, end: form.end },
        offersDelivery: form.offersDelivery,
        offersPickup: form.offersPickup,
        deliveryFee: Number(form.deliveryFee) || 0,
        deliveryRadiusKm: Number(form.deliveryRadiusKm) || 0,
        isOpen: form.isOpen
      });
      if (fetchUser) await fetchUser();
      toast.success('Pharmacy profile saved');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="text-2xl font-bold text-ink-900">Pharmacy profile</h1>
      <p className="mt-1 text-sm text-ink-600">Shown to patients and doctors when they choose a pharmacy.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Pharmacy name" name="pharmacyName" value={form.pharmacyName} onChange={onChange} required />
          <TextInput label="License number" name="licenseNumber" value={form.licenseNumber} onChange={onChange} />
          <TextInput label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <TextInput label="City" name="city" value={form.city} onChange={onChange} />
          <TextInput label="District" name="district" value={form.district} onChange={onChange} />
          <TextInput label="Delivery fee (UGX)" name="deliveryFee" type="number" value={form.deliveryFee} onChange={onChange} />
          <TextInput
            label="Delivery radius (km)"
            name="deliveryRadiusKm"
            type="number"
            value={form.deliveryRadiusKm}
            onChange={onChange}
          />
          <TextInput label="Opens" name="start" type="time" value={form.start} onChange={onChange} />
          <TextInput label="Closes" name="end" type="time" value={form.end} onChange={onChange} />
          <div className="sm:col-span-2">
            <TextInput label="Address" name="address" value={form.address} onChange={onChange} />
          </div>
          <div className="sm:col-span-2">
            <TextTextarea label="Description" name="description" value={form.description} onChange={onChange} rows={3} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="offersPickup" checked={form.offersPickup} onChange={onChange} className="rounded border-ink-300 text-brand-500" />
            Offer onsite pickup
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="offersDelivery" checked={form.offersDelivery} onChange={onChange} className="rounded border-ink-300 text-brand-500" />
            Offer home delivery
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="isOpen" checked={form.isOpen} onChange={onChange} className="rounded border-ink-300 text-brand-500" />
            Currently accepting orders
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

export default PharmacyProfile;
