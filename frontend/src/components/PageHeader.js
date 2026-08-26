import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const PageHeader = ({ title, breadcrumbs }) => {
  const { user } = useContext(AuthContext);
  const isUnconfirmed = Boolean(user && !user.confirmed);
  const defaultBreadcrumbs = title === 'Home'
    ? [{ label: 'Home' }]
    : [{ label: 'Home', to: '/' }, { label: title }];
  const crumbItems = breadcrumbs ?? defaultBreadcrumbs;

  return (
    <>
      <section style={{ backgroundColor: '#22C55E' }} className="text-white md:h-20 fixed top-20 left-0 right-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between h-full py-4 md:py-0">
            <div className="text-left">
              <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
            </div>

            <div className="text-left md:text-right">
              <nav className="inline-flex items-center gap-2 text-sm text-emerald-100/90">
                {crumbItems.map((crumb, index) => (
                  <span key={crumb.label} className="inline-flex items-center gap-2">
                    {crumb.to ? (
                      <Link to={crumb.to} className="hover:text-white">{crumb.label}</Link>
                    ) : (
                      <span className="font-semibold text-white">{crumb.label}</span>
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
        <Link to={`/confirm?email=${encodeURIComponent(user.email || '')}`} className="fixed left-0 right-0 top-40 z-10 block border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 hover:bg-amber-100">
          Your account is not confirmed. Please check your email to confirm your account. <span className="font-semibold text-amber-700 underline">Confirm now</span>
        </Link>
      )}
      <div className={isUnconfirmed ? 'h-32' : 'h-20'} />
    </>
  );
};

export default PageHeader;
