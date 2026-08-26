import PageHeader from '../components/PageHeader';

const testimonials = [
  {
    name: 'Saul Goodman',
    role: 'CEO & Founder',
    image: '/images/office-man-profile.jpg',
    quote: 'Their platform centralized our documents, enforced version control, and cut retrieval time across teams.'
  },
  {
    name: 'Sara Willsson',
    role: 'Designer',
    image: '/images/office-woman-profile-2.jpeg',
    quote: 'Collaboration and asset management are now seamless — our team meets deadlines with greater consistency.'
  },
  {
    name: 'Jena Karlis',
    role: 'Store Owner',
    image: '/images/office-woman-profile.jpg',
    quote: 'Order processing and customer tracking have become much easier; the system is reliable and support is excellent.'
  },
  {
    name: 'Matt Brandon',
    role: 'Freelancer',
    image: '/images/office-man-profile-2.jpg',
    quote: 'The workflow tools streamlined my billing and task management — simple to set up and consistently dependable.'
  },
  {
    name: 'John Larson',
    role: 'Entrepreneur',
    image: '/images/office-man-profile-3.jpeg',
    quote: 'Integrations automated routine tasks and connected our apps, saving hours every week.'
  },
  {
    name: 'Emily Harison',
    role: 'Store Owner',
    image: '/images/office-woman-profile-3.jpg',
    quote: 'Since adopting the platform our order accuracy has improved and fulfillment times are faster.'
  }
];

const Testimonials = () => {
  return (
    <>
      <PageHeader title="Testimonials" subtitle="What our users and readers are saying." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-3xl bg-white p-8 shadow-xl">
              <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </div>
              <p className="mt-6 text-slate-600">“{item.quote}”</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Testimonials;
