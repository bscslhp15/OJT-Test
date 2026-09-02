import PageHeader from '../components/page-header';
import { useState, useEffect } from 'react';

const ContactHero = () => {
  const [src, setSrc] = useState('/images/alaminos-location.png');

  useEffect(() => {
    // Check if the file exists by attempting to load it via Image
    const img = new Image();
    img.onload = () => setSrc('/images/alaminos-location.png');
    img.onerror = () => setSrc('/images/location.jpg');
    img.src = '/images/alaminos-location.png';
  }, []);

  return (
    <img src={src} alt="Office location" className="block h-[360px] w-full max-w-none object-cover object-center md:h-[420px] lg:h-[520px]" />
  );
};

const Contact = () => {
  return (
    <>
      <PageHeader title="Contact" />

      <section className="w-full overflow-hidden px-0 py-8">
        <div className="w-full overflow-hidden">
          <ContactHero />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-[#22C55E]">
                  <i className="fa-solid fa-location-dot text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Location</h3>
                  <p className="mt-2 text-slate-600">106 Olongapo - Bugallon Rd, Alaminos City, Pangasinan</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-[#22C55E]">
                  <i className="fa-solid fa-envelope text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Email</h3>
                  <p className="mt-2 text-slate-600">info@example.com</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-[#22C55E]">
                  <i className="fa-solid fa-phone text-xl" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Call</h3>
                  <p className="mt-2 text-slate-600">+1 5589 55488 51</p>
                  <p className="text-slate-600">+1 5589 22475 14</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-xl">
            <form className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Your Name</label>
                  <input type="text" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Your Email</label>
                  <input type="email" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Subject</label>
                <input type="text" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Message</label>
                <textarea rows="6" className="mt-3 w-full rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-900 outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10"></textarea>
              </div>
              <button type="submit" className="w-full rounded-3xl bg-[#22C55E] px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
