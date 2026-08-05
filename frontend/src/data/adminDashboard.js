export const adminNav = {
  management: [
    { to: '/admin/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/admin/organizations', label: 'Approvals', icon: 'ShieldCheck' },
    { to: '/admin/clinics', label: 'Clinics', icon: 'Building2' },
    { to: '/admin/patients', label: 'Patients', icon: 'Users' }
  ],
  configurations: [
    { to: '/admin/settings', label: 'Settings', icon: 'Settings' },
    { to: '/admin/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};

export const verificationStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export const organizationTypeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'clinic', label: 'Clinics' },
  { value: 'lab', label: 'Labs' },
  { value: 'insurance', label: 'Insurance' }
];

export const adminPatientStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];
