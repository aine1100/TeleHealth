import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User2, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold">Your account details</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-3xl bg-blue-50 p-4 text-blue-700">
                    <User2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.18em]">Email</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{user.email}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.18em]">Phone</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{user.phone}</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.18em]">Location</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{user.city || 'No city provided'}, {user.district || 'No district provided'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-slate-50 p-10 text-center text-slate-600">Sign in to view profile details.</div>
            )}
          </div>

          <aside className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Security</p>
            <div className="mt-4 flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              <p className="text-sm text-slate-700">Your account is secure. Keep your password strong and update your contact details regularly.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Profile;
