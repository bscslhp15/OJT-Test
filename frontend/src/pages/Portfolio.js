import { useState } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/page-header';

const projects = [
  {
    title: 'Alexis: Brand marketing designer portfolio',
    category: 'Personal',
    discipline: 'Brand strategy & visual identity',
    image: '/images/portfolio-office-woman-profile-2.jpeg',
    alt: 'Creative professional portrait in a modern office',
    year: '2026'
  },
  {
    title: 'Alice: Architect portfolio',
    category: 'Personal',
    discipline: 'Architecture & interiors',
    image: '/images/portfolio-office-woman-profile.jpg',
    alt: 'Architect working at a desk in a bright studio',
    year: '2026'
  },
  {
    title: 'Alice: UX designer portfolio',
    category: 'Personal',
    discipline: 'Digital product design',
    image: '/images/portfolio-office-man-profile.jpg',
    alt: 'Designer reviewing work on a tablet in an office',
    year: '2026'
  },
  {
    title: 'Alicia: UGC creator portfolio',
    category: 'Personal',
    discipline: 'Content & creative direction',
    image: '/images/portfolio-office-woman-profile-3.jpg',
    alt: 'Content creator portrait in a workspace',
    year: '2026'
  },
  {
    title: 'Amber: Video editor portfolio',
    category: 'Personal',
    discipline: 'Video & motion design',
    image: '/images/portfolio-office-man-profile-2.jpg',
    alt: 'Video editor working with a laptop in a studio',
    year: '2025'
  },
  {
    title: 'Antonio: Creative portfolio',
    category: 'Personal',
    discipline: 'Art direction & campaigns',
    image: '/images/portfolio-office-man-profile-3.jpeg',
    alt: 'Creative professional portrait in a modern office',
    year: '2025'
  },
  {
    title: 'The Studio: Creative team portfolio',
    category: 'Studio',
    discipline: 'People & collaboration',
    image: '/images/testimonials-office-boy.jpg',
    alt: 'Creative professional working at a desk',
    year: '2025'
  },
  {
    title: 'Northstar: Digital studio portfolio',
    category: 'Studio',
    discipline: 'Digital design & development',
    image: '/images/testimonials-office-boy2.jpg',
    alt: 'Team member planning a project in a bright office',
    year: '2025'
  },
  {
    title: 'Common Ground: Agency portfolio',
    category: 'Studio',
    discipline: 'Research & experience design',
    image: '/images/testimonials-office-girl2.jpg',
    alt: 'Creative team collaborating in a studio',
    year: '2025'
  },
  {
    title: 'Maya: Creative strategist portfolio',
    category: 'Personal',
    discipline: 'Creative strategy & storytelling',
    image: '/images/testimonials-office-lady.jpg',
    alt: 'Creative professional portrait',
    year: '2025'
  },
  {
    title: 'The Daily Edit: Editorial portfolio',
    category: 'Editorial',
    discipline: 'Stories & ideas',
    image: '/images/blog-1.jpg',
    alt: 'Editorial image for a creative work journal',
    year: '2026'
  },
  {
    title: 'Work Journal: Creative studio portfolio',
    category: 'Editorial',
    discipline: 'People & process',
    image: '/images/blog-2.jpg',
    alt: 'Editorial image of a team sharing ideas',
    year: '2026'
  },
  {
    title: 'Better Together: Design portfolio',
    category: 'Editorial',
    discipline: 'Collaboration & culture',
    image: '/images/blog-3.jpg',
    alt: 'Editorial image of a team working together',
    year: '2026'
  },
  {
    title: 'Ideas in Motion: Creative portfolio',
    category: 'Editorial',
    discipline: 'Ideas & inspiration',
    image: '/images/blog-4.jpg',
    alt: 'Editorial image of designers collaborating',
    year: '2026'
  }
];

const filters = ['All work', 'Personal', 'Studio', 'Editorial'];

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState('All work');
  const visibleProjects = activeFilter === 'All work'
    ? projects
    : projects.filter((project) => project.category === activeFilter);

  return (
    <>
      <PageHeader title="Portfolio" subtitle="Selected portfolio concepts for creatives and studios." />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 max-[239px]:pb-12 max-[239px]:pt-6">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">TestSite / Portfolio gallery</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 max-[639px]:text-2xl max-[239px]:text-xl">Creative portfolios, made personal.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Explore personal, studio, and editorial portfolio concepts.</p>
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

        <section aria-label="Portfolio projects" className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 md:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <article key={project.title} className="group min-w-0">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={project.image}
                  alt={project.alt}
                  loading={index > 2 ? 'lazy' : 'eager'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">{project.category}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere]">{project.title}</h3>
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