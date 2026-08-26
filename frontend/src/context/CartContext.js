import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext(null);
const STORAGE_KEY = 'alive_health_patient_cart_v1';

const slimPharmacy = (pharmacyInfo) => ({
  _id: pharmacyInfo._id,
  displayName:
    pharmacyInfo.displayName ||
    pharmacyInfo.pharmacyProfile?.pharmacyName ||
    [pharmacyInfo.firstName, pharmacyInfo.lastName].filter(Boolean).join(' ') ||
    'Pharmacy',
  pharmacyProfile: pharmacyInfo.pharmacyProfile || {},
  address: pharmacyInfo.address,
  firstName: pharmacyInfo.firstName,
  lastName: pharmacyInfo.lastName
});

const readStoredCart = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { pharmacy: null, items: [] };
    const parsed = JSON.parse(raw);
    return {
      pharmacy: parsed?.pharmacy || null,
      items: Array.isArray(parsed?.items) ? parsed.items : []
    };
  } catch {
    return { pharmacy: null, items: [] };
  }
};

export const CartProvider = ({ children }) => {
  const stored = readStoredCart();
  const [pharmacy, setPharmacy] = useState(stored.pharmacy);
  const [items, setItems] = useState(stored.items);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ pharmacy, items }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [pharmacy, items]);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const toggleCart = useCallback(() => setOpen((prev) => !prev), []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPharmacy(null);
  }, []);

  const addItem = useCallback((medicine, pharmacyInfo) => {
    if (!medicine?._id || !pharmacyInfo?._id) return;

    if (!(Number(medicine.stockQuantity) > 0)) {
      toast.error('This medicine is out of stock');
      return;
    }

    setPharmacy((prevPharmacy) => {
      const switching =
        prevPharmacy && String(prevPharmacy._id) !== String(pharmacyInfo._id);

      setItems((prevItems) => {
        const base = switching ? [] : prevItems;
        if (switching) {
          toast('Cart cleared for the new pharmacy', { icon: '🛒' });
        }

        const existing = base.find((item) => item._id === medicine._id);
        if (existing) {
          const nextQty = existing.quantity + 1;
          if (nextQty > Number(medicine.stockQuantity)) {
            toast.error('Not enough stock');
            return base;
          }
          toast.success(`${medicine.name} quantity updated`);
          return base.map((item) =>
            item._id === medicine._id ? { ...item, quantity: nextQty } : item
          );
        }

        toast.success(`${medicine.name} added to cart`);
        return [
          ...base,
          {
            _id: medicine._id,
            name: medicine.name,
            price: medicine.price,
            requiresPrescription: medicine.requiresPrescription,
            stockQuantity: medicine.stockQuantity,
            quantity: 1
          }
        ];
      });

      return slimPharmacy(pharmacyInfo);
    });

    setOpen(true);
  }, []);

  const changeQty = useCallback((id, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((item) => item._id !== id);
      return prev.map((item) => {
        if (item._id !== id) return item;
        const max = Number(item.stockQuantity) || quantity;
        return { ...item, quantity: Math.min(quantity, max) };
      });
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((item) => item._id !== id);
      if (!next.length) setPharmacy(null);
      return next;
    });
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      pharmacy,
      items,
      open,
      itemCount,
      total,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      changeQty,
      removeItem,
      clearCart,
      setOpen
    }),
    [
      pharmacy,
      items,
      open,
      itemCount,
      total,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      changeQty,
      removeItem,
      clearCart
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
};

/** Safe outside CartProvider (e.g. doctor pharmacy browse). */
export const useCartOptional = () => useContext(CartContext);

export default CartContext;
