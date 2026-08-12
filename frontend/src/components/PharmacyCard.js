import React from 'react';
import { Clock, MapPin, Phone, Store, Truck } from 'lucide-react';

const pharmacyDisplayName = (pharmacy) =>
  pharmacy?.displayName ||
  pharmacy?.pharmacyProfile?.pharmacyName ||
  [pharmacy?.firstName, pharmacy?.lastName].filter(Boolean).join(' ') ||
  'Pharmacy';

const PharmacyCard = ({
  pharmacy,
  onAction,
  actionLabel = 'View details',
  onSecondaryAction,
  secondaryLabel
}) => {
  const profile = pharmacy?.pharmacyProfile || {};
  const name = pharmacyDisplayName(pharmacy);
  const location = profile.city || pharmacy?.city || 'Uganda';
  const address = profile.address || pharmacy?.address || location;
  const phone = profile.phone || pharmacy?.phone;
  const medicineCount = pharmacy?.medicineCount || 0;
  const hours =
    profile.openingHours?.start && profile.openingHours?.end
      ? `${profile.openingHours.start} – ${profile.openingHours.end}`
      : 'Hours on request';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PH';
  const deliveryFee =
    profile.offersDelivery !== false && profile.deliveryFee != null
      ? Number(profile.deliveryFee)
      : null;

  return (
    <article className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex shrink-0 justify-center lg:justify-start">
          {pharmacy?.avatar ? (
            <img src={pharmacy.avatar} alt={name} className="h-28 w-28 rounded-xl object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-600">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-brand-600">{name}</h3>
              <p className="mt-1 text-sm text-ink-500">
                {profile.description
                  ? profile.description.slice(0, 120) + (profile.description.length > 120 ? '…' : '')
                  : 'Community pharmacy on Alive Health'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Store size={15} className="text-brand-500" />
                  <span className="font-semibold text-ink-800">
                    {medicineCount} medicine{medicineCount === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-brand-500" />
                  {hours}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-brand-500" />
                  {address}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.offersPickup !== false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                    <Store size={11} /> Pickup
                  </span>
                ) : null}
                {profile.offersDelivery !== false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    <Truck size={11} /> Delivery
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm font-medium text-ink-700">
                {deliveryFee != null ? (
                  <>
                    <span className="font-bold text-ink-900">UGX {deliveryFee.toLocaleString()}</span>
                    <span className="text-ink-500"> Delivery fee</span>
                  </>
                ) : profile.offersPickup !== false ? (
                  'Pickup available'
                ) : (
                  'Fulfilment details on request'
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {location}
              </span>

              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-brand-600"
                >
                  <Phone size={15} className="text-brand-500" />
                  {phone}
                </a>
              ) : null}

              {onAction ? (
                <button
                  type="button"
                  onClick={() => onAction(pharmacy)}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600"
                >
                  {actionLabel}
                </button>
              ) : null}
              {onSecondaryAction && secondaryLabel ? (
                <button
                  type="button"
                  onClick={() => onSecondaryAction(pharmacy)}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                >
                  {secondaryLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PharmacyCard;
