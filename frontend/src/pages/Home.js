import { Link } from 'react-router-dom';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';

const features = [
  { title: 'Strategic Planning', body: 'We help you develop comprehensive business strategies that drive growth and increase profitability for your organization.', icon: 'fa-solid fa-lightbulb', color: 'text-blue-600' },
  { title: 'Project Management', body: 'Expert project coordination and management to ensure timely delivery, quality results, and optimal resource allocation.', icon: 'fa-solid fa-tasks', color: 'text-emerald-600' },
  { title: 'Team Development', body: 'Comprehensive training and development programs to enhance employee skills and boost productivity across your organization.', icon: 'fa-solid fa-users', color: 'text-purple-600' },
  { title: 'Risk Management', body: 'Proactive identification and mitigation of business risks to protect your assets and ensure sustainable growth.', icon: 'fa-solid fa-shield-halved', color: 'text-amber-500' },
  { title: 'Process Optimization', body: 'Streamline your business processes to reduce costs, improve efficiency, and enhance overall operational performance.', icon: 'fa-solid fa-cogs', color: 'text-teal-600' },
  { title: 'Consultation Services', body: 'Expert business consultation to guide your company through challenges and unlock new opportunities for expansion.', icon: 'fa-solid fa-comments', color: 'text-rose-500' }
];

const gallery = [
  { src: '/images/gallery%20-%20Copy-cropped%20(1).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped%20(2).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped%20(3).png', category: 'app' },
  { src: '/images/gallery%20-%20Copy-cropped%20(4).png', category: 'app' },
  { src: '/images/gallery%20-%20Copy-cropped%20(5).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped%20(6).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped%20(7).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped%20(8).png', category: 'web' },
  { src: '/images/gallery%20-%20Copy-cropped.png', category: 'card' }
];

const clients = [
  '/images/grabyo.jpg',
  '/images/life-roups.png',
  '/images/lily.png',
  '/images/myob.png',
  '/images/oldendroff.jpg',
  '/images/trustly.png',
  '/images/belimo.png',
  '/images/citrus.jpg'
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'App', 'Card', 'Web'];
  const tabRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = tabs.indexOf(activeTab);
    const node = tabRefs.current[idx];
    if (node) {
      setIndicator({ left: node.offsetLeft, width: node.offsetWidth });
    } else if (tabRefs.current[0]) {
      setIndicator({ left: tabRefs.current[0].offsetLeft, width: tabRefs.current[0].offsetWidth });
    }

    const handleResize = () => {
      const n = tabRefs.current[tabs.indexOf(activeTab)];
      if (n) setIndicator({ left: n.offsetLeft, width: n.offsetWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleTabMouseEnter = (idx) => {
    const node = tabRefs.current[idx];
    if (node) setIndicator({ left: node.offsetLeft, width: node.offsetWidth });
  };

  const resetIndicator = () => {
    const idx = tabs.indexOf(activeTab);
    const node = tabRefs.current[idx];
    if (node) setIndicator({ left: node.offsetLeft, width: node.offsetWidth });
  };
  const blobPaths = [
    "M14.1,-19.6C19.8,-13.2,24.2,-6.6,25.6,1.2C27,9,25.3,18,19.9,23.9C14.5,29.8,5.4,32.5,-2.6,33.7C-10.6,34.9,-18.3,34.6,-25.3,30.8C-32.3,27.1,-38.6,19.8,-40.6,11C-42.6,2.1,-40.3,-7.8,-35.1,-15.9C-29.9,-24,-21.8,-30.2,-12.6,-33.2C-3.4,-36.1,6.9,-35.1,14.1,-19.6Z",
    "M22.6,-24.7C29.1,-18.7,31.9,-9.3,32.1,0.7C32.3,10.7,29.9,21.4,23.6,27.1C17.2,32.8,7,33.5,-3.3,36.3C-13.6,39.1,-27.2,44,-33.1,39.3C-39,34.7,-37.1,20.6,-36.8,8.3C-36.5,-3.9,-37.8,-14.1,-33.1,-20.8C-28.4,-27.5,-17.8,-30.7,-7.9,-30.8C2,-30.9,4.1,-26.7,22.6,-24.7Z",
    "M18.5,-25.6C27.4,-19.6,36.1,-13.7,38.5,-5.6C40.8,2.4,36.8,12.8,30.6,21.1C24.3,29.4,15.8,35.6,6.8,36.9C-2.3,38.2,-11.5,34.6,-19.1,29.3C-26.8,24.1,-32.8,17.1,-36.9,8.6C-41,0.2,-43.1,-9.8,-38.6,-17.9C-34.2,-26,-23.1,-32.1,-12.8,-34.1C-2.6,-36.1,6.8,-34,18.5,-25.6Z",
    "M11.6,-18.3C18.6,-14,29.6,-10.6,31.5,-4.5C33.4,1.6,26.1,9.8,19.7,15.4C13.3,21.1,6.7,24.1,-1.3,26.4C-9.4,28.8,-18.8,30.4,-24.8,26.7C-30.8,23.1,-33.5,14.1,-33.2,5.5C-33,-3.1,-29.7,-11.1,-23.9,-16.6C-18.2,-22.1,-9.1,-25.3,0.6,-26C10.3,-26.6,20.6,-24.7,11.6,-18.3Z"
  ];

  const blobSelection = useMemo(() => {
    return features.map(() => blobPaths[Math.floor(Math.random() * blobPaths.length)]);
  }, []);

  return (
    <>
      {/* Hero section with large image */}
      <section className="relative">
        <div className="h-[720px] bg-cover bg-center" style={{ backgroundImage: 'url(/images/meeting-office.jpg)' }}>
          <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 mx-auto max-w-7xl px-4 h-full flex items-center justify-center sm:px-6 lg:px-8">
              <div className="w-full max-w-5xl transform translate-y-28">
                <div className="w-full border-t-4 border-[#22C55E] bg-black/30 rounded-md p-8 shadow-lg transform transition-transform duration-300 hover:scale-105 cursor-pointer">
                  <div className="max-w-[85%]">
                    <h2 className="text-2xl font-semibold text-white">Professional Business Solutions</h2>
                    <p className="mt-6 text-sm text-slate-200">Empower your organization with our comprehensive suite of business services designed to enhance productivity, streamline operations, and achieve sustainable growth. We partner with leading companies to deliver innovative solutions that transform challenges into opportunities.</p>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Link to="/blog" className="inline-block rounded-md border-2 border-[#22C55E] px-4 py-2 text-sm font-medium text-white bg-transparent hover:bg-[#22C55E]/90">Read More</Link>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Intro text with features summary (two-column) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-3xl font-bold text-slate-900">Why Choose Our Services?</h3>
            <p className="mt-4 text-slate-600">We deliver proven business solutions with a track record of success across multiple industries and market segments.</p>
          </div>
          <div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-[#22C55E] mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-slate-700">Experienced professionals with deep industry expertise and proven track records.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-[#22C55E] mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-slate-700">Customized solutions tailored to your specific business needs and organizational goals.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-[#22C55E] mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-slate-700">Dedicated support and continuous partnership throughout your business journey.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features 3x2 grid */}
      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-3xl bg-white p-10 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mx-auto relative h-20 w-20">
                  <svg viewBox="0 0 100 100" className="h-full w-full block" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d={blobSelection[i]} transform="translate(50 50) scale(1.12)" fill="#EFF6FF"/>
                  </svg>
                  <i className={`${f.icon} ${f.color} text-2xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`} aria-hidden="true"></i>
                </div>
                <h4 className="mt-6 text-xl font-semibold text-slate-900">{f.title}</h4>
                <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-6 text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery masonry-like grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <div className="relative flex gap-3 justify-center mb-6">
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
              <div
                className="bg-[#22C55E] h-1 rounded-full transition-all duration-200"
                style={{ position: 'absolute', left: `${indicator.left}px`, width: `${indicator.width}px` }}
              />
            </div>
            {tabs.map((tab, idx) => (
              <button
                key={tab}
                ref={(el) => (tabRefs.current[idx] = el)}
                onClick={() => setActiveTab(tab)}
                onMouseEnter={() => handleTabMouseEnter(idx)}
                onMouseLeave={resetIndicator}
                className={`px-4 py-2 rounded-full text-sm font-medium transition transform ${activeTab === tab ? 'bg-white border border-slate-200 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/60'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="columns-1 sm:columns-2 md:columns-3 gap-4">
            {gallery
              .filter((g) => activeTab === 'All' || g.category.toLowerCase() === activeTab.toLowerCase())
              .map((g, i) => (
                <div key={i} className="break-inside-avoid mb-4 rounded-2xl bg-white p-2 shadow-sm">
                  <img src={g.src} alt={`gallery-${i}`} className="w-full h-auto rounded-md block" />
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Clients logos */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-slate-700 font-semibold">Clients</h3>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {clients.map((c, i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <img src={c} alt={`client-${i}`} className="max-h-12 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
