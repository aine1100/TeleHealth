export const pharmacyNav = {
  management: [
    { to: '/pharmacy/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/pharmacy/inventory', label: 'Inventory', icon: 'Package' },
    { to: '/pharmacy/orders', label: 'Orders', icon: 'ClipboardList' }
  ],
  configurations: [
    { to: '/pharmacy/profile', label: 'Pharmacy profile', icon: 'Store' },
    { to: '/pharmacy/settings', label: 'Settings', icon: 'Settings' },
    { to: '/pharmacy/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};

export const medicineFormOptions = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream' },
  { value: 'drops', label: 'Drops' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'other', label: 'Other' }
];

export const inventoryStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'low', label: 'Low stock' },
  { value: 'inactive', label: 'Inactive' }
];

export const orderStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready for pickup' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' }
];
