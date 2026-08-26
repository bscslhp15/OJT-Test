import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';

const serviceCards = [
  { title: 'Document Management', description: 'Centralized document storage, versioning, and secure access controls.', icon: 'fa-solid fa-folder-open', color: 'text-blue-600' },
  { title: 'Workflow Automation', description: 'Automate repetitive tasks and approvals to speed up your business processes.', icon: 'fa-solid fa-cogs', color: 'text-emerald-600' },
  { title: 'IT Support & Monitoring', description: '24/7 system monitoring, helpdesk support, and proactive maintenance.', icon: 'fa-solid fa-headset', color: 'text-purple-600' },
  { title: 'Accounting & Payroll', description: 'Accurate payroll processing, invoicing, and financial reporting.', icon: 'fa-solid fa-calculator', color: 'text-amber-500' },
  { title: 'Data Security', description: 'Security assessments, encryption, and compliance for sensitive data.', icon: 'fa-solid fa-shield-halved', color: 'text-teal-600' },
  { title: 'Custom Integrations', description: 'Integrate with your existing tools and build custom connectors via APIs.', icon: 'fa-solid fa-plug', color: 'text-rose-500' }
];

const featureItems = [
  { title: 'Secure cloud storage & backups', icon: 'fa-solid fa-database', color: 'text-blue-500' },
  { title: 'Automated approval workflows', icon: 'fa-solid fa-check-double', color: 'text-rose-500' },
  { title: 'Role-based access controls', icon: 'fa-solid fa-user-shield', color: 'text-amber-500' },
  { title: 'Real-time system monitoring', icon: 'fa-solid fa-bell', color: 'text-teal-600' },
  { title: 'Custom API integrations', icon: 'fa-solid fa-plug', color: 'text-emerald-600' },
  { title: 'Automated payroll & billing', icon: 'fa-solid fa-receipt', color: 'text-purple-600' },
  { title: 'Document versioning & audit logs', icon: 'fa-solid fa-file-invoice', color: 'text-sky-500' },
  { title: 'User training & onboarding', icon: 'fa-solid fa-chalkboard-teacher', color: 'text-violet-600' },
  { title: 'Mobile access & responsive apps', icon: 'fa-solid fa-mobile-screen-button', color: 'text-pink-500' },
  { title: 'Data analytics & reporting', icon: 'fa-solid fa-chart-line', color: 'text-orange-500' },
  { title: 'Single sign-on (SSO)', icon: 'fa-solid fa-right-to-bracket', color: 'text-indigo-600' },
  { title: 'Backup & disaster recovery', icon: 'fa-solid fa-cloud-arrow-up', color: 'text-green-600' }
];

const Services = () => {
  const blobPaths = [
    "M14.1,-19.6C19.8,-13.2,24.2,-6.6,25.6,1.2C27,9,25.3,18,19.9,23.9C14.5,29.8,5.4,32.5,-2.6,33.7C-10.6,34.9,-18.3,34.6,-25.3,30.8C-32.3,27.1,-38.6,19.8,-40.6,11C-42.6,2.1,-40.3,-7.8,-35.1,-15.9C-29.9,-24,-21.8,-30.2,-12.6,-33.2C-3.4,-36.1,6.9,-35.1,14.1,-19.6Z",
    "M22.6,-24.7C29.1,-18.7,31.9,-9.3,32.1,0.7C32.3,10.7,29.9,21.4,23.6,27.1C17.2,32.8,7,33.5,-3.3,36.3C-13.6,39.1,-27.2,44,-33.1,39.3C-39,34.7,-37.1,20.6,-36.8,8.3C-36.5,-3.9,-37.8,-14.1,-33.1,-20.8C-28.4,-27.5,-17.8,-30.7,-7.9,-30.8C2,-30.9,4.1,-26.7,22.6,-24.7Z",
    "M18.5,-25.6C27.4,-19.6,36.1,-13.7,38.5,-5.6C40.8,2.4,36.8,12.8,30.6,21.1C24.3,29.4,15.8,35.6,6.8,36.9C-2.3,38.2,-11.5,34.6,-19.1,29.3C-26.8,24.1,-32.8,17.1,-36.9,8.6C-41,0.2,-43.1,-9.8,-38.6,-17.9C-34.2,-26,-23.1,-32.1,-12.8,-34.1C-2.6,-36.1,6.8,-34,18.5,-25.6Z",
    "M11.6,-18.3C18.6,-14,29.6,-10.6,31.5,-4.5C33.4,1.6,26.1,9.8,19.7,15.4C13.3,21.1,6.7,24.1,-1.3,26.4C-9.4,28.8,-18.8,30.4,-24.8,26.7C-30.8,23.1,-33.5,14.1,-33.2,5.5C-33,-3.1,-29.7,-11.1,-23.9,-16.6C-18.2,-22.1,-9.1,-25.3,0.6,-26C10.3,-26.6,20.6,-24.7,11.6,-18.3Z"
  ];

  const blobSelection = useMemo(() => {
    return serviceCards.map((_, i) => blobPaths[i % blobPaths.length]);
  }, []);

  return (
    <>
      <PageHeader title="Services" subtitle="Solutions to streamline office operations and IT systems." />

      <section className="py-16">
        <div className="w-full bg-slate-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {serviceCards.map((item, i) => (
                <div key={item.title} className="rounded-3xl bg-white p-10 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto relative h-20 w-20">
                <svg viewBox="0 0 100 100" className="h-full w-full block" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d={blobSelection[i]} transform="translate(50 50) scale(1.12)" fill="#EFF6FF" />
                </svg>
                <i className={`${item.icon} ${item.color} text-2xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`} aria-hidden="true"></i>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-6 text-slate-500">{item.description}</p>
            </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 uppercase">FEATURES</h2>
            <div className="mx-auto mt-3 h-1 w-24 rounded bg-[#22C55E]" />
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">Our platform and services provide the core tools and support your teams need to operate securely and efficiently.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((f, idx) => (
              <div key={f.title} className="rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-50">
                    <i className={`${f.icon} ${f.color} text-lg`} aria-hidden="true"></i>
                  </div>
                  <div className="text-sm font-medium text-slate-900">{f.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
