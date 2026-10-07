import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1E1E1E' }} className="mt-auto w-full flex-shrink-0 text-slate-300">
      <div className="mx-auto max-w-7xl px-2 py-8 min-[360px]:px-4 min-[360px]:py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 min-[500px]:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-white [overflow-wrap:anywhere] max-[159px]:text-sm">Company</h3>
            <p className="mt-4 break-words text-sm leading-6 text-slate-400 [overflow-wrap:anywhere]">A108 Adam Street<br />New York, NY 535022<br />United States</p>
            <p className="mt-4 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">Phone: +1 5589 55488 55<br />Email: info@example.com</p>
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-white [overflow-wrap:anywhere] max-[159px]:text-sm">Useful Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><Link to="/" className="min-w-0 break-words [overflow-wrap:anywhere]">Home</Link></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><Link to="/about" className="min-w-0 break-words [overflow-wrap:anywhere]">About us</Link></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><Link to="/services" className="min-w-0 break-words [overflow-wrap:anywhere]">Services</Link></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><Link to="/pricing" className="min-w-0 break-words [overflow-wrap:anywhere]">Terms of service</Link></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><Link to="/contact" className="min-w-0 break-words [overflow-wrap:anywhere]">Privacy policy</Link></li>
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-white [overflow-wrap:anywhere] max-[159px]:text-sm">Our Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Web Design</span></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Web Development</span></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Product Management</span></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Marketing</span></li>
              <li className="flex min-w-0 items-start gap-2"><span className="shrink-0 text-[#22C55E]">&gt;</span><span className="min-w-0 break-words [overflow-wrap:anywhere]">Graphic Design</span></li>
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-white [overflow-wrap:anywhere] max-[159px]:text-sm">Join Our Newsletter</h3>
            <p className="mt-4 text-sm text-slate-400">Subscribe to our newsletter for the latest updates, news, and helpful insights.</p>
            <div className="mt-4 flex flex-col gap-2 lg:flex-row">
              <input type="email" placeholder="Your email" className="w-full min-w-0 flex-1 rounded-md border border-white bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-[#22C55E]" />
              <button className="w-full min-w-0 shrink-0 break-words rounded-md bg-[#22C55E] px-4 py-2 text-sm text-white hover:bg-emerald-600 max-[159px]:px-2 lg:w-auto">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-t border-black bg-[#111111]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <div>© Copyright TestSite. All Rights Reserved</div>
          <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
            <a href="#" aria-label="Twitter" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-twitter" /></a>
            <a href="#" aria-label="Facebook" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-facebook-f" /></a>
            <a href="#" aria-label="Instagram" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-instagram" /></a>
            <a href="#" aria-label="LinkedIn" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-linkedin-in" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
