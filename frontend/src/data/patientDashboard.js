export const patientNav = {
  management: [
    { to: '/patient/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/patient/doctors', label: 'Find a doctor', icon: 'Stethoscope' },
    { to: '/patient/appointments', label: 'Appointments', icon: 'CalendarDays' },
    { to: '/patient/medicines', label: 'Medicine reminders', icon: 'Pill' },
    { to: '/patient/ai-screening', label: 'AI screening', icon: 'Sparkles' }
  ],
  configurations: [
    { to: '/patient/profile', label: 'Profile', icon: 'UserRound' },
    { to: '/patient/settings', label: 'Settings', icon: 'Settings' },
    { to: '/patient/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};
