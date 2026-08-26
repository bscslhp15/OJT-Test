import PageHeader from '../components/PageHeader';

const teamMembers = [
  { name: 'Walter White', role: 'Chief Executive Officer', image: '/images/testimonials-office-boy.jpg' },
  { name: 'Sarah Johnson', role: 'Product Manager', image: '/images/testimonials-office-girl2.jpg' },
  { name: 'William Anderson', role: 'CTO', image: '/images/testimonials-office-boy2.jpg' },
  { name: 'Amanda Jepson', role: 'Accountant', image: '/images/testimonials-office-lady.jpg' }
];

const Team = () => {
  return (
    <>
      <PageHeader title="Team" />

      <section className="bg-slate-50 py-20">
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
    </>
  );
};

export default Team;
