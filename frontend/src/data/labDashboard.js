export const labNav = {
  management: [
    { to: '/lab/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/lab/orders', label: 'Orders', icon: 'FlaskConical' }
  ],
  configurations: [
    { to: '/lab/profile', label: 'Lab profile', icon: 'Building2' },
    { to: '/lab/settings', label: 'Settings', icon: 'Settings' },
    { to: '/lab/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};

export const labOrderStatusOptions = [
  { value: 'all', label: 'All my statuses' },
  { value: 'pool', label: 'Unassigned pool' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'sample_collected', label: 'Sample collected' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];
