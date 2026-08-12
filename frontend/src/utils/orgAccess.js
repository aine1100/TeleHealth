export const ORG_ROLES = ['clinic_admin', 'lab_tech', 'insurance', 'pharmacist'];

export const isOrganizationRole = (role) => ORG_ROLES.includes(role);

export const getVerificationStatus = (user) =>
  user?.organizationProfile?.verificationStatus || 'pending';

export const isOrganizationApproved = (user) =>
  !isOrganizationRole(user?.role) || getVerificationStatus(user) === 'approved';

export const roleHome = (role) => {
  switch (role) {
    case 'doctor':
      return '/doctor/home';
    case 'clinic_admin':
      return '/clinic/home';
    case 'pharmacist':
      return '/pharmacy/home';
    case 'lab_tech':
      return '/lab/home';
    case 'insurance':
      return '/insurance/home';
    case 'admin':
      return '/admin/home';
    default:
      return '/patient/home';
  }
};

/** Path after login or refresh — pending orgs never enter role dashboards. */
export const resolveHomePath = (user) => {
  if (!user) return '/login';
  if (isOrganizationRole(user.role) && !isOrganizationApproved(user)) {
    return '/pending-approval';
  }
  return roleHome(user.role);
};

export const orgTypeLabel = (typeOrRole) => {
  if (typeOrRole === 'clinic' || typeOrRole === 'clinic_admin') return 'Clinic / Hospital';
  if (typeOrRole === 'lab' || typeOrRole === 'lab_tech') return 'Laboratory';
  if (typeOrRole === 'insurance') return 'Insurance';
  if (typeOrRole === 'pharmacy' || typeOrRole === 'pharmacist') return 'Pharmacy';
  return 'Organization';
};
