import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
  panelClassName = ''
}) => {
  return (
    <div className="min-h-screen bg-white lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <div className="scrollbar-hide flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:min-h-0 lg:overflow-y-auto lg:px-16 xl:px-24">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
            <Shield className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink-900">
            Alive Health UG
          </span>
        </Link>

        <div className={`mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 ${panelClassName}`}>
          <div className="animate-fade-up">
            <h1 className="text-[2rem] font-bold tracking-tight text-ink-900 sm:text-[2.15rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-[15px] leading-6 text-ink-500">{subtitle}</p>
            ) : null}
          </div>

          <div className="animate-fade-up-delay mt-8">{children}</div>

          {footer ? (
            <div className="animate-fade-up-delay mt-8 text-center text-sm text-ink-500">
              {footer}
            </div>
          ) : null}
        </div>
      </div>

      <aside className="relative hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-hidden">
        <img
          src="/warm.jpg"
          alt="Blue bougainvillea under a bright sky"
          className="absolute inset-0 h-full w-full object-cover animate-soft-zoom"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-slate-950/20" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <p className="max-w-md text-2xl font-semibold leading-snug text-white">
            Your health, your choice, your terms.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">
            Care that connects patients, doctors, clinics, and partners across Uganda.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default AuthLayout;
