import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/auth-context';

const PageHeader = ({ title, breadcrumbs }) => {
  const { user } = useContext(AuthContext);
  const isUnconfirmed = Boolean(user && !user.confirmed);
  const defaultBreadcrumbs = title === 'Home'
    ? [{ label: 'Home' }]
    : [{ label: 'Home', to: '/' }, { label: title }];
  const crumbItems = breadcrumbs ?? defaultBreadcrumbs;

  return (
    <>
      <section style={{ backgroundColor: '#22C55E' }} className="relative z-10 text-white">
        <div className="mx-auto max-w-7xl px-2 py-3 min-[360px]:px-4 min-[360px]:py-4 sm:px-6 lg:px-8 md:py-5">
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 text-left">
              <h1 className="break-words text-lg font-semibold min-[360px]:text-xl sm:text-2xl">{title}</h1>
            </div>

            <div className="min-w-0 text-left md:text-right">
              <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-100/90 max-[159px]:hidden min-[360px]:text-sm">
                {crumbItems.map((crumb, index) => (
                  <span key={crumb.label} className="inline-flex min-w-0 flex-wrap items-center gap-2">
                    {crumb.to ? (
                      <Link to={crumb.to} className="break-words [overflow-wrap:anywhere] hover:text-white">{crumb.label}</Link>
                    ) : (
                      <span className="break-words font-semibold text-white [overflow-wrap:anywhere]">{crumb.label}</span>
                    )}
                    {index < crumbItems.length - 1 && <span className="text-emerald-100/70">/</span>}
                  </span>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>
      {isUnconfirmed && (
        <Link to={`/confirm?email=${encodeURIComponent(user.email || '')}`} className="block border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 hover:bg-amber-100">
          Your account is not confirmed. Please check your email to confirm your account. <span className="font-semibold text-amber-700 underline">Confirm now</span>
        </Link>
      )}
    </>
  );
};

export default PageHeader;
