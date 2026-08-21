import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, MapPin, Minus, Plus, Smartphone, Store, Truck, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../auth/FormFields';
import { pharmacyService } from '../../services/pharmacyService';
import { useAuth } from '../../context/AuthContext';

const CatalogOrderModal = ({ open, onClose, pharmacy, cartItems = [], onChangeQty, onSent }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const profile = pharmacy?.pharmacyProfile || {};
  const offersDelivery = profile.offersDelivery !== false;
  const offersPickup = profile.offersPickup !== false;
  const [method, setMethod] = useState(offersPickup ? 'pickup' : 'delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [payMethod, setPayMethod] = useState('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  useEffect(() => {
    if (!open) return;
    setMethod(offersPickup ? 'pickup' : 'delivery');
    setDeliveryAddress(user?.address || '');
    setDeliveryNotes('');
    setPayMethod('mtn_momo');
    setPhoneNumber(user?.phone || '');
  }, [open, offersPickup, user?.address, user?.phone]);

  const itemsTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cartItems]
  );
  const deliveryFee =
    method === 'delivery' ? Math.max(0, Number(profile.deliveryFee) || 0) : 0;
  const total = itemsTotal + deliveryFee;

  if (!open || !pharmacy) return null;

  const pharmacyName =
    pharmacy.displayName ||
    profile.pharmacyName ||
    [pharmacy.firstName, pharmacy.lastName].filter(Boolean).join(' ');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!cartItems.length) {
      toast.error('Add at least one medicine');
      return;
    }
    if (method === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Enter a delivery address');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('Enter a mobile money number to pay');
      return;
    }

    setSaving(true);
    try {
      const created = await pharmacyService.createOrder({
        pharmacyId: pharmacy._id,
        orderType: 'catalog',
        fulfillmentMethod: method,
        deliveryAddress: method === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        items: cartItems.map((item) => ({
          catalogMedicine: item._id,
          quantity: item.quantity
        }))
      });

      const orderId = created?.data?._id;
      if (!orderId) {
        throw new Error('Order created but missing id');
      }

      await pharmacyService.payOrder(orderId, {
        method: payMethod,
        phoneNumber: phoneNumber.trim()
      });

      toast.success('Paid — order sent to the pharmacy');
      onSent?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to complete checkout');
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              Cart · Checkout · Pay
            </p>
            <h2 className="text-base font-bold text-ink-900">{pharmacyName}</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Review items, choose pickup or delivery, then pay to send the order.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">1. Your cart</p>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                    <p className="text-xs text-ink-500">
                      UGX {Number(item.price || 0).toLocaleString()} each
                      {item.requiresPrescription ? ' · Rx may be required' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeQty?.(item._id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-ink-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQty?.(item._id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              2. Collection method
            </p>
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
                  <p className="mt-1 text-sm font-semibold text-ink-900">Pickup</p>
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
                  <p className="mt-1 text-sm font-semibold text-ink-900">Delivery</p>
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
              />
            </>
          ) : (
            <p className="inline-flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-brand-500" />
              {profile.address || pharmacy.address || 'Collect at the pharmacy'}
            </p>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">3. Pay now</p>
            <div className="space-y-2">
              {[
                { value: 'mtn_momo', label: 'MTN MoMo' },
                { value: 'airtel_money', label: 'Airtel Money' }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-700"
                >
                  <input
                    type="radio"
                    name="checkoutPayMethod"
                    checked={payMethod === option.value}
                    onChange={() => setPayMethod(option.value)}
                    className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Smartphone size={15} className="text-brand-500" />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <TextInput
                label="Mobile money number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+256700000000"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Items</span>
              <span>UGX {itemsTotal.toLocaleString()}</span>
            </div>
            {method === 'delivery' ? (
              <div className="mt-1 flex justify-between text-ink-600">
                <span>Delivery</span>
                <span>UGX {deliveryFee.toLocaleString()}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 font-bold text-ink-900">
              <span>Total due</span>
              <span>UGX {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-ink-100 px-4 py-3">
          <button
            type="submit"
            disabled={saving || !cartItems.length}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <CreditCard size={15} />
            {saving ? 'Processing…' : `Pay UGX ${total.toLocaleString()} & order`}
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

export default CatalogOrderModal;
