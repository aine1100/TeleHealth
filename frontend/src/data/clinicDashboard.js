export const clinicNav = {
  management: [
    { to: '/clinic/home', label: 'Overview', icon: 'LayoutDashboard' },
    { to: '/clinic/doctors', label: 'Doctors', icon: 'Stethoscope', badge: 5 },
    { to: '/clinic/appointments', label: 'Appointments', icon: 'CalendarDays', badge: 12 },
    { to: '/clinic/patients', label: 'Patients', icon: 'Users', badge: 6 },
    { to: '/clinic/insights', label: 'Insights', icon: 'LineChart' }
  ],
  configurations: [
    { to: '/clinic/profile', label: 'Facility profile', icon: 'Building2' },
    { to: '/clinic/settings', label: 'Settings', icon: 'Settings' },
    { to: '/clinic/support', label: 'Support', icon: 'LifeBuoy' }
  ]
};

export const overviewStats = [
  {
    id: 'appointments',
    title: 'Appointments today',
    value: '48',
    change: '+12.4%',
    positive: true,
    detail: 'Completed: 31',
    detailSecondary: 'Waiting: 9',
    icon: 'CalendarCheck',
    tone: 'blue'
  },
  {
    id: 'doctors',
    title: 'Active doctors',
    value: '18',
    change: '+4.1%',
    positive: true,
    detail: 'On duty: 12',
    detailSecondary: 'Invited: 3',
    icon: 'Stethoscope',
    tone: 'orange'
  },
  {
    id: 'consults',
    title: 'Consultations done',
    value: '126',
    change: '+18.2%',
    positive: true,
    detail: 'Video: 74',
    detailSecondary: 'In person: 52',
    icon: 'Video',
    tone: 'rose'
  }
];

export const engagementData = [
  { label: 'Jan', value: 42, capacity: 80 },
  { label: 'Feb', value: 55, capacity: 80 },
  { label: 'Mar', value: 48, capacity: 80 },
  { label: 'Apr', value: 67, capacity: 80 },
  { label: 'May', value: 61, capacity: 80 },
  { label: 'Jun', value: 74, capacity: 80 },
  { label: 'Jul', value: 69, capacity: 80 },
  { label: 'Aug', value: 78, capacity: 80 },
  { label: 'Sep', value: 72, capacity: 80 },
  { label: 'Oct', value: 81, capacity: 80 },
  { label: 'Nov', value: 76, capacity: 80 },
  { label: 'Dec', value: 88, capacity: 80 }
];

export const productivityBars = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 51 },
  { label: 'Thu', value: 73 },
  { label: 'Fri', value: 66 },
  { label: 'Sat', value: 39 },
  { label: 'Sun', value: 28 }
];

export const consultDistribution = [
  { name: 'Video', value: 46, color: '#0f172a' },
  { name: 'In person', value: 40, color: '#0b74ff' },
  { name: 'Chat', value: 14, color: '#cbd5e1' }
];

export const recentAppointments = [
  { id: '#AH-23154', name: 'Amina N.', type: 'Video consult', meta: '12 mins ago', size: 'Dr. Okello' },
  { id: '#AH-23148', name: 'Brian K.', type: 'In person', meta: '28 mins ago', size: 'Dr. Namuli' },
  { id: '#AH-23141', name: 'Sarah M.', type: 'Follow-up', meta: '1 hr ago', size: 'Dr. Kato' },
  { id: '#AH-23136', name: 'James O.', type: 'Video consult', meta: '2 hrs ago', size: 'Dr. Achieng' }
];

export const recentInvites = [
  { email: 'dr.amina@alive.ug', status: 'Pending', sent: 'Today' },
  { email: 'dr.peter@alive.ug', status: 'Accepted', sent: 'Yesterday' },
  { email: 'dr.grace@alive.ug', status: 'Pending', sent: '2 days ago' }
];

export const timeRanges = ['Custom', 'Today', '7d', '30d', '1M', '6M', '1Y'];

export const specialtyOptions = [
  { value: 'General Practice', label: 'General Practice' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Obstetrics & Gynaecology', label: 'Obstetrics & Gynaecology' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Other', label: 'Other' }
];

export const doctorStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending invites' },
  { value: 'inactive', label: 'Inactive' }
];

export const patientStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'new', label: 'New' },
  { value: 'inactive', label: 'Inactive' }
];

export const clinicDoctors = [
  {
    id: 'd1',
    firstName: 'Amina',
    lastName: 'Okello',
    email: 'amina.okello@alive.ug',
    phone: '+256700111222',
    specialty: 'General Practice',
    licenseNumber: 'UMD-20481',
    experience: 8,
    bio: 'Family physician focused on preventive care and chronic disease management.',
    consultationFee: 35000,
    consultationTypes: ['video', 'chat', 'in_person'],
    availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    availableHours: { start: '09:00', end: '17:00' },
    status: 'active',
    consultations: 126,
    rating: 4.8,
    reviewCount: 42,
    joined: '12 Jan 2026'
  },
  {
    id: 'd2',
    firstName: 'Peter',
    lastName: 'Namuli',
    email: 'peter.namuli@alive.ug',
    phone: '+256700333444',
    specialty: 'Pediatrics',
    licenseNumber: 'UMD-19822',
    experience: 11,
    bio: 'Pediatrician with a focus on newborn care and childhood immunizations.',
    consultationFee: 40000,
    consultationTypes: ['video', 'in_person'],
    availableDays: ['mon', 'wed', 'fri', 'sat'],
    availableHours: { start: '08:00', end: '16:00' },
    status: 'active',
    consultations: 98,
    rating: 4.6,
    reviewCount: 31,
    joined: '3 Feb 2026'
  },
  {
    id: 'd3',
    firstName: 'Grace',
    lastName: 'Kato',
    email: 'grace.kato@alive.ug',
    phone: '+256700555666',
    specialty: 'Cardiology',
    licenseNumber: 'UMD-17654',
    experience: 14,
    bio: 'Cardiologist supporting hypertension, heart failure, and ECG review.',
    consultationFee: 60000,
    consultationTypes: ['video', 'in_person'],
    availableDays: ['tue', 'thu', 'fri'],
    availableHours: { start: '10:00', end: '18:00' },
    status: 'active',
    consultations: 74,
    rating: 4.9,
    reviewCount: 27,
    joined: '18 Feb 2026'
  },
  {
    id: 'd4',
    firstName: 'Daniel',
    lastName: 'Achieng',
    email: 'daniel.achieng@alive.ug',
    phone: '+256700777888',
    specialty: 'Dermatology',
    licenseNumber: '',
    experience: null,
    bio: '',
    consultationFee: 45000,
    consultationTypes: ['video', 'chat'],
    availableDays: [],
    availableHours: { start: '09:00', end: '17:00' },
    status: 'pending',
    consultations: 0,
    rating: null,
    reviewCount: 0,
    joined: 'Invited 2 days ago'
  },
  {
    id: 'd5',
    firstName: 'Sarah',
    lastName: 'Mukasa',
    email: 'sarah.mukasa@alive.ug',
    phone: '+256700999000',
    specialty: 'Obstetrics & Gynaecology',
    licenseNumber: 'UMD-21109',
    experience: 9,
    bio: 'OB/GYN supporting antenatal care and women’s health consults.',
    consultationFee: 50000,
    consultationTypes: ['video', 'in_person'],
    availableDays: ['mon', 'tue', 'thu'],
    availableHours: { start: '09:00', end: '15:00' },
    status: 'inactive',
    consultations: 41,
    rating: 4.4,
    reviewCount: 18,
    joined: '8 Dec 2025'
  }
];

export const clinicPatients = [
  {
    id: 'p1',
    firstName: 'Brian',
    lastName: 'Kizito',
    email: 'brian.kizito@mail.com',
    phone: '+256701111222',
    gender: 'male',
    age: 34,
    bloodType: 'O+',
    allergies: ['Penicillin'],
    conditions: ['Hypertension'],
    lastVisit: '1 Aug 2026',
    doctor: 'Dr. Okello',
    doctorId: 'd1',
    status: 'active',
    visits: 6,
    address: 'Ntinda, Kampala',
    emergencyContact: { name: 'Joan Kizito', phone: '+256701000111', relationship: 'Spouse' }
  },
  {
    id: 'p2',
    firstName: 'Amina',
    lastName: 'Nabirye',
    email: 'amina.nabirye@mail.com',
    phone: '+256701333444',
    gender: 'female',
    age: 28,
    bloodType: 'A+',
    allergies: [],
    conditions: ['Asthma'],
    lastVisit: '31 Jul 2026',
    doctor: 'Dr. Namuli',
    doctorId: 'd2',
    status: 'active',
    visits: 3,
    address: 'Najjera, Wakiso',
    emergencyContact: { name: 'Hassan Nabirye', phone: '+256701222333', relationship: 'Brother' }
  },
  {
    id: 'p3',
    firstName: 'James',
    lastName: 'Ocen',
    email: 'james.ocen@mail.com',
    phone: '+256701555666',
    gender: 'male',
    age: 45,
    bloodType: 'B+',
    allergies: ['Sulfa'],
    conditions: ['Diabetes'],
    lastVisit: '28 Jul 2026',
    doctor: 'Dr. Kato',
    doctorId: 'd3',
    status: 'active',
    visits: 11,
    address: 'Kololo, Kampala',
    emergencyContact: { name: 'Mary Ocen', phone: '+256701444555', relationship: 'Wife' }
  },
  {
    id: 'p4',
    firstName: 'Faith',
    lastName: 'Akello',
    email: 'faith.akello@mail.com',
    phone: '+256701777888',
    gender: 'female',
    age: 19,
    bloodType: 'O-',
    allergies: [],
    conditions: [],
    lastVisit: '20 Jul 2026',
    doctor: 'Dr. Okello',
    doctorId: 'd1',
    status: 'new',
    visits: 1,
    address: 'Entebbe Road',
    emergencyContact: { name: 'Grace Akello', phone: '+256701666777', relationship: 'Mother' }
  },
  {
    id: 'p5',
    firstName: 'Moses',
    lastName: 'Tumusiime',
    email: 'moses.t@mail.com',
    phone: '+256701999000',
    gender: 'male',
    age: 52,
    bloodType: 'AB+',
    allergies: ['Latex'],
    conditions: ['Arthritis'],
    lastVisit: '12 Jul 2026',
    doctor: 'Dr. Achieng',
    doctorId: 'd4',
    status: 'inactive',
    visits: 8,
    address: 'Mbarara',
    emergencyContact: { name: 'Paul Tumusiime', phone: '+256701888999', relationship: 'Son' }
  },
  {
    id: 'p6',
    firstName: 'Ruth',
    lastName: 'Nalwanga',
    email: 'ruth.n@mail.com',
    phone: '+256702111222',
    gender: 'female',
    age: 37,
    bloodType: 'A-',
    allergies: [],
    conditions: ['Migraine'],
    lastVisit: '2 Aug 2026',
    doctor: 'Dr. Namuli',
    doctorId: 'd2',
    status: 'active',
    visits: 4,
    address: 'Makindye, Kampala',
    emergencyContact: { name: 'Isaac Nalwanga', phone: '+256702000111', relationship: 'Husband' }
  }
];

