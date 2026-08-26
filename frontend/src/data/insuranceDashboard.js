export const insuranceNav = {
  management: [
    { to: '/insurance/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/insurance/members', label: 'Members', icon: 'Users' },
    { to: '/insurance/claims', label: 'Claims', icon: 'FileCheck' },
    { to: '/insurance/plans', label: 'Benefit plans', icon: 'BadgePercent' }
  ],
  configurations: [
    { to: '/insurance/profile', label: 'Company profile', icon: 'Building2' },
    { to: '/insurance/settings', label: 'Settings', icon: 'Settings' },
    { to: '/insurance/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};

export const policyStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' }
];

export const claimStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' }
];

export const claimTypeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'other', label: 'Other' }
];
