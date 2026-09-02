import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/page-header';

const teamMembers = [
  { name: 'Walter White', role: 'Chief Executive Officer', image: '/images/testimonials-office-boy.jpg' },
  { name: 'Sarah Johnson', role: 'Product Manager', image: '/images/testimonials-office-girl2.jpg' },
  { name: 'William Anderson', role: 'CTO', image: '/images/testimonials-office-boy2.jpg' },
  { name: 'Amanda Jepson', role: 'Accountant', image: '/images/testimonials-office-lady.jpg' }
];

const skills = [
  { label: 'HTML', value: 100 },
  { label: 'CSS', value: 90 },
  { label: 'JavaScript', value: 75 },
  { label: 'PHP', value: 80 },
  { label: 'WordPress/CMS', value: 90 },
  { label: 'Photoshop', value: 55 }
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

const About = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '#team') {
      const target = document.getElementById('team');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [hash]);

  return (
    <>
      <PageHeader title="About" />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-4xl font-semibold text-slate-900">Reliable Office Systems & Business Support</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              We provide enterprise-grade office systems, consultancy, and managed services to help your organization operate securely and efficiently.
            </p>
          </div>
          <div className="space-y-5 text-slate-600">
            <p>
              Our team delivers tailored IT solutions, process optimization, and ongoing support to ensure your operations run smoothly and your teams stay productive.
            </p>
            <p>
              We focus on secure deployments, clear SLAs, and measurable outcomes so you can scale with confidence.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
                <span>Enterprise-grade security and compliance support.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
                <span>Dedicated account management and priority support.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">✓</span>
                <span>Custom integrations and process automation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="team" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 uppercase">OUR TEAM</h2>
            <div className="mx-auto mt-3 h-1 w-24 rounded bg-[#22C55E]" />
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">Our multidisciplinary team includes experienced engineers, project managers, and support specialists who deliver tailored solutions and ongoing operational support.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="overflow-hidden rounded-3xl bg-white shadow-xl">
                <img src={member.image} alt={member.name} className="h-72 w-full object-cover" />
                <div className="p-6 text-center">
                  <h4 className="text-lg font-semibold text-slate-900">{member.name}</h4>
                  <p className="mt-2 text-sm text-slate-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 uppercase">OUR SKILLS</h2>
          <div className="mx-auto mt-3 h-1 w-24 rounded bg-[#22C55E]" />
          <p className="mx-auto mt-4 max-w-3xl text-slate-600">We combine technical expertise with practical experience to deliver reliable, secure, and efficient systems for office operations. Our skills ensure fast deployments, compliant processes, and measurable operational improvements.</p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {/** Left column */}
          <div className="space-y-6">
            {skills.slice(0, 3).map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{skill.label}</span>
                  <span className="text-sm text-slate-700">{skill.value}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${skill.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/** Right column */}
          <div className="space-y-6">
            {skills.slice(3).map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{skill.label}</span>
                  <span className="text-sm text-slate-700">{skill.value}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${skill.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-slate-700 font-semibold">Clients</h3>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {clients.map((logo, index) => (
              <div key={index} className="flex items-center justify-center p-4">
                <img src={logo} alt={`client-${index}`} className="max-h-12 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
