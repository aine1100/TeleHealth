import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../auth/FormFields';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { pharmacyService } from '../../services/pharmacyService';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    open,
    closeCart,
    pharmacy,
    items,
    itemCount,
    total: itemsTotal,
    changeQty,
    removeItem,
    clearCart
  } = useCart();

  const [step, setStep] = useState('cart');
  const [saving, setSaving] = useState(false);
  const profile = pharmacy?.pharmacyProfile || {};
  const offersDelivery = profile.offersDelivery !== false;
  const offersPickup = profile.offersPickup !== false;
  const [method, setMethod] = useState(offersPickup ? 'pickup' : 'delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [payMethod, setPayMethod] = useState('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  const deliveryFee =
    method === 'delivery' ? Math.max(0, Number(profile.deliveryFee) || 0) : 0;
  const grandTotal = itemsTotal + deliveryFee;

  useEffect(() => {
    if (!open) {
      setStep('cart');
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (step === 'checkout') setStep('cart');
      else closeCart();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeCart, step]);

  useEffect(() => {
    if (!items.length) setStep('cart');
  }, [items.length]);

  useEffect(() => {
    if (step !== 'checkout') return;
    setMethod(offersPickup ? 'pickup' : 'delivery');
    setDeliveryAddress(user?.address || '');
    setDeliveryNotes('');
    setPayMethod('mtn_momo');
    setPhoneNumber(user?.phone || '');
  }, [step, offersPickup, user?.address, user?.phone]);

  const itemSummary = useMemo(
    () => items.map((item) => `${item.name} ×${item.quantity}`).join(', '),
    [items]
  );

  const onPay = async (e) => {
    e.preventDefault();
    if (!items.length || !pharmacy?._id) {
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
        items: items.map((item) => ({
          catalogMedicine: item._id,
          quantity: item.quantity
        }))
      });

      const orderId = created?.data?._id;
      if (!orderId) throw new Error('Order created but missing id');

      await pharmacyService.payOrder(orderId, {
        method: payMethod,
        phoneNumber: phoneNumber.trim()
      });

      toast.success('Paid — order sent to the pharmacy');
      clearCart();
      setStep('cart');
      closeCart();
      navigate('/patient/orders');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to complete checkout');
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[115] transition ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={step === 'checkout' ? 'Checkout' : 'Shopping cart'}
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {step === 'checkout' ? (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <ArrowLeft size={13} />
                Back to cart
              </button>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Your cart
              </p>
            )}
            <h2 className="mt-0.5 text-lg font-bold text-ink-900">
              {step === 'checkout'
                ? 'Checkout & pay'
                : itemCount
                  ? `${itemCount} item${itemCount === 1 ? '' : 's'}`
                  : 'Empty cart'}
            </h2>
            {pharmacy ? (
              <p className="mt-0.5 truncate text-sm text-ink-500">{pharmacy.displayName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'cart' ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {items.length ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item._id}
                      className="rounded-2xl border border-ink-100 bg-ink-50/40 px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            UGX {Number(item.price || 0).toLocaleString()} each
                            {item.requiresPrescription ? ' · Rx may be required' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item._id)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-rose-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white p-1">
                          <button
                            type="button"
                            onClick={() => changeQty(item._id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-ink-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(item._id, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-ink-900">
                          UGX{' '}
                          {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <ShoppingBag size={22} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-ink-900">Your cart is empty</p>
                  <p className="mt-1 max-w-xs text-sm text-ink-500">
                    Browse a pharmacy catalog and add medicines to build your order.
                  </p>
                  <Link
                    to="/patient/pharmacies"
                    onClick={closeCart}
                    className="mt-5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Find a pharmacy
                  </Link>
                </div>
              )}
            </div>

            {items.length ? (
              <div className="border-t border-ink-100 px-4 py-4 sm:px-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-ink-500">Subtotal</span>
                  <span className="font-bold text-ink-900">UGX {itemsTotal.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Checkout & pay
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50"
                >
                  Clear cart
                </button>
                <Link
                  to="/patient/orders"
                  onClick={closeCart}
                  className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View pharmacy orders →
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <form onSubmit={onPay} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Order</p>
                <p className="mt-1 text-sm font-medium text-ink-800">{itemSummary}</p>
                <p className="mt-1 text-sm font-bold text-ink-900">
                  Items: UGX {itemsTotal.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Collection method
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
                  {profile.address || pharmacy?.address || 'Collect at the pharmacy'}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Pay now
                </p>
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
                        name="drawerPayMethod"
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
                  <span>UGX {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-ink-100 px-4 py-4 sm:px-5">
              <button
                type="submit"
                disabled={saving || !items.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <CreditCard size={15} />
                {saving ? 'Processing…' : `Pay UGX ${grandTotal.toLocaleString()} & order`}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>,
    document.body
  );
};

export default CartDrawer;
