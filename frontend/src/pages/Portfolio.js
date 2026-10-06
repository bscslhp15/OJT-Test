import { useState } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/page-header';

const projects = [
  {
    title: 'Miel & Co.',
    category: 'Product',
    discipline: 'Packaging concept',
    image: '/images/gallery-image-1.png',
    alt: 'Tea packaging and a cup arranged as a product still life',
    year: '2026',
    tone: 'bg-[#F4EEE5]'
  },
  {
    title: 'Quiet Forms',
    category: 'Still life',
    discipline: 'Art direction',
    image: '/images/gallery-image-2.png',
    alt: 'Sculptural green plant in a pale ceramic pot',
    year: '2026',
    tone: 'bg-[#EAF3F0]'
  },
  {
    title: 'Everyday Objects',
    category: 'Product',
    discipline: 'Furniture study',
    image: '/images/gallery-image-3.png',
    alt: 'Minimal white wooden stool against a blue backdrop',
    year: '2025',
    tone: 'bg-[#E8F1F5]'
  },
  {
    title: 'Light / Line',
    category: 'Product',
    discipline: 'Industrial design',
    image: '/images/gallery-image-4.png',
    alt: 'Adjustable wooden desk lamp with a dark metal shade',
    year: '2025',
    tone: 'bg-[#F1EFEC]'
  },
  {
    title: 'Daybreak',
    category: 'Product',
    discipline: 'Eyewear campaign',
    image: '/images/gallery-image-5.png',
    alt: 'Black sunglasses photographed on a white surface',
    year: '2025',
    tone: 'bg-[#F0EFED]'
  },
  {
    title: 'Focus / 50',
    category: 'Still life',
    discipline: 'Photography',
    image: '/images/gallery-image-6.png',
    alt: 'Camera lens in a softly lit studio',
    year: '2024',
    tone: 'bg-[#E9F0EF]'
  },
  {
    title: 'Golden Hour',
    category: 'Still life',
    discipline: 'Editorial image',
    image: '/images/gallery-image-7.png',
    alt: 'Faceted glass filled with golden tea beside wheat',
    year: '2024',
    tone: 'bg-[#F5F0E6]'
  },
  {
    title: 'On Time',
    category: 'Product',
    discipline: 'Campaign image',
    image: '/images/gallery-image-8.png',
    alt: 'Classic wristwatch arranged on a pale surface',
    year: '2024',
    tone: 'bg-[#F2EFEB]'
  }
];

const filters = ['All work', 'Product', 'Still life'];

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState('All work');
  const visibleProjects = activeFilter === 'All work'
    ? projects
    : projects.filter((project) => project.category === activeFilter);

  return (
    <>
      <PageHeader title="Portfolio" subtitle="Selected concepts in product, imagery, and form." />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">TestSite / Selected concepts</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Objects with a point of view.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A collection of visual studies exploring useful forms, careful materials, and considered imagery.</p>
          </div>
          <span className="text-sm text-slate-500">{visibleProjects.length} projects</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter portfolio projects">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className={`h-9 rounded-xl border px-4 text-sm transition-colors ${activeFilter === filter ? 'border-[#22C55E] bg-[#22C55E] font-medium text-[#102718]' : 'border-slate-300 bg-white text-slate-600 hover:border-[#22C55E] hover:text-[#176B34]'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <section aria-label="Portfolio projects" className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <article key={project.title} className="group min-w-0">
              <div className={`relative overflow-hidden rounded-lg ${project.tone}`}>
                <img
                  src={project.image}
                  alt={project.alt}
                  loading={index > 2 ? 'lazy' : 'eager'}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">{project.category}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900">{project.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{project.discipline} <span aria-hidden="true">·</span> {project.year}</p>
                </div>
                <ArrowUpRightIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-700" aria-hidden="true" />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Have a project in mind?</h2>
            <p className="mt-1 text-sm text-slate-600">Let’s talk about what you’re building.</p>
          </div>
          <a href="/contact" className="inline-flex h-10 w-fit items-center rounded-xl bg-[#22C55E] px-4 text-sm font-semibold text-[#102718] transition-colors hover:bg-emerald-500">Get in touch</a>
        </section>
      </main>
    </>
  );
};

export default Portfolio;