# Alive Health UG — Project Guide

This document is the working blueprint for the Alive Health UG telehealth platform. It combines the product vision, the current implementation state, the technical architecture, and the delivery roadmap.

## 1. Product Vision

Alive Health UG is a B2B SaaS telehealth ecosystem for Uganda. It connects:

- Patients
- Doctors
- Clinics and hospitals
- Pharmacies
- Laboratories
- Insurance providers
- Administrators

The platform should support online consultations, appointment booking, digital payments, reminders, medical history, AI screening, referrals, and multi-language access.

## 2. Core Portals

The platform is organized around these portals:

- Patient portal
- Doctor portal
- Clinic / hospital portal
- Pharmacy portal
- Laboratory portal
- Insurance portal
- Admin portal


## 3. MVP Scope

The first release should focus on the following capabilities:

1. Authentication and user roles
2. Patient onboarding and doctor discovery
3. Appointment booking and scheduling
4. Waiting room and video consultation flow
5. Mobile Money payment flow
6. Medicine reminders
7. Basic medical record and notification handling

## 4. Current Implementation Status

The repository already includes an initial foundation for the platform.

### Implemented areas

- Backend authentication with JWT-based login and registration
- Appointment booking and appointment status updates
- Medicine reminder support
- Notification module scaffolding
- Socket.IO setup for waiting room and video-call events
- Basic frontend structure for patient-facing pages

### Key backend files

- [backend/server.js](../backend/server.js)
- [backend/routes/auth.js](../backend/routes/auth.js)
- [backend/routes/appointments.js](../backend/routes/appointments.js)
- [backend/models/User.js](../backend/models/User.js)
- [backend/models/Appointment.js](../backend/models/Appointment.js)
- [backend/models/MedicineReminder.js](../backend/models/MedicineReminder.js)
- [backend/models/Notification.js](../backend/models/Notification.js)

### Still to build

- Full role-based dashboards
- Pharmacy, lab, insurance, and admin workflows
- Real payment gateway integration
- Video consultation UI and media handling
- Advanced AI screening flow
- Multi-language translation system
- Full medical records and prescription lifecycle

## 5. Functional Modules

### Patient portal

Required features:

- Registration and login
- Doctor search and profile view
- Appointment booking
- Waiting room experience
- Consultation history
- AI symptom and vital screening
- Medicine reminders
- Insurance wallet and claims view
- Mobile Money payment flow

### Doctor portal

Required features:

- Profile and availability management
- Appointment handling
- Consultation notes
- Prescription creation
- Referrals to specialists, labs, or hospitals

### Clinic / hospital portal

Required features:

- Doctor management
- Appointment oversight
- Patient records and analytics
- Organization-level reporting

### Pharmacy portal

Required features:

- Prescription intake
- Inventory management
- Delivery status tracking

### Laboratory portal

Required features:

- Test ordering
- Results upload
- Report sharing

### Insurance portal

Required features:

- Claims review
- Provider dashboard
- Payment tracking

### Admin portal

Required features:

- User verification and suspension
- Organization management
- Subscription and billing management
- Analytics and reporting

## 6. Architecture

### Frontend

- React
- React Router
- Tailwind CSS
- Socket.IO client
- Axios

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Socket.IO for real-time features
- REST API structure

### Data layer

Core entities include:

- Users
- Patients
- Doctors
- Clinics
- Appointments
- MedicalRecords
- Prescriptions
- Medicines
- MedicineReminders
- LabTests
- LabResults
- InsurancePolicies
- Claims
- Payments
- Subscriptions
- Notifications
- Messages
- Reviews

## 7. API Map

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Appointments

- POST /api/appointments
- GET /api/appointments/my-appointments
- PATCH /api/appointments/:id/status
- POST /api/appointments/:id/join-waiting

### Planned modules

- /api/payments
- /api/medicines
- /api/notifications
- /api/doctors
- /api/labs
- /api/insurance
- /api/admin

## 8. Delivery Roadmap

### Phase 1 — Foundation

- Authentication
- Patient portal basics
- Doctor portal basics
- Appointment booking
- Payments
- Video consultation foundation

### Phase 2 — Ecosystem

- Pharmacy integration
- Laboratory integration
- Insurance workflows
- Medical records

### Phase 3 — Intelligence

- AI screening
- Analytics
- Reminders and predictive care

### Phase 4 — Enterprise

- White-label clinic support
- Multi-location hospital support
- Advanced reporting and enterprise administration

## 9. Development Guidelines

- Keep the backend modular and role-aware.
- Keep patient and doctor flows simple before adding enterprise complexity.
- Prefer reusable components and shared API services in the frontend.
- Use MongoDB schemas that can scale to multi-tenant healthcare workflows.
- Treat security and privacy as core requirements.

## 10. Recommended Next Steps

1. Define the full role-based permission model.
2. Finish the core appointment and consultation flow.
3. Add payment integration and notification templates.
4. Expand the doctor and admin dashboards.
5. Add the pharmacy, lab, and insurance modules.

This guide should be updated as the product evolves. It is intended to remain the project reference for both product and engineering work.
