import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1E1E1E' }} className="mt-auto w-full text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 min-[500px]:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <h3 className="text-white text-lg font-semibold">Company</h3>
            <p className="mt-4 text-sm leading-6 text-slate-400">A108 Adam Street<br />New York, NY 535022<br />United States</p>
            <p className="mt-4 text-sm text-slate-500">Phone: +1 5589 55488 55<br />Email: info@example.com</p>
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-lg font-semibold">Useful Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span><Link to="/">Home</Link></li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span><Link to="/about">About us</Link></li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span><Link to="/services">Services</Link></li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span><Link to="/pricing">Terms of service</Link></li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span><Link to="/contact">Privacy policy</Link></li>
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-lg font-semibold">Our Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span>Web Design</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span>Web Development</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span>Product Management</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span>Marketing</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">&gt;</span>Graphic Design</li>
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-lg font-semibold">Join Our Newsletter</h3>
            <p className="mt-4 text-sm text-slate-400">Subscribe to our newsletter for the latest updates, news, and helpful insights.</p>
            <div className="mt-4 flex flex-col gap-2 lg:flex-row">
              <input type="email" placeholder="Your email" className="w-full min-w-0 rounded-md border border-white bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-[#22C55E]" />
              <button className="shrink-0 rounded-md bg-[#22C55E] px-4 py-2 text-sm text-white hover:bg-emerald-600">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-t border-black bg-[#111111]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <div>© Copyright TestSite. All Rights Reserved</div>
          <div className="flex items-center gap-2">
            <a href="#" aria-label="Twitter" className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-twitter" /></a>
            <a href="#" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-facebook-f" /></a>
            <a href="#" aria-label="Skype" className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-skype" /></a>
            <a href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-instagram" /></a>
            <a href="#" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-[#22C55E] hover:text-white"><i className="fab fa-linkedin-in" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
