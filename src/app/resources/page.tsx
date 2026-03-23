import type { Metadata } from 'next'
import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Technical resources, catalogs, installation guides, and specification tools from GIO Tile.',
}

const resources = [
  {
    title: 'Product Catalogs',
    description: 'Download our latest product catalog featuring all current collections.',
    href: '/collections',
    cta: 'Browse Collections',
  },
  {
    title: 'Technical Specifications',
    description:
      'Access spec sheets, testing data, and technical documentation for any collection.',
    href: '/collections',
    cta: 'View Specs',
  },
  {
    title: 'Sample Requests',
    description:
      'Order physical samples of any tile in our catalog for your next project.',
    href: '/samples',
    cta: 'Request Samples',
  },
  {
    title: 'Blog & Insights',
    description:
      'Design inspiration, installation tips, trend reports, and industry insights.',
    href: '/blog',
    cta: 'Read the Blog',
  },
]

export default function ResourcesPage() {
  return (
    <article>
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">Resources</h1>
          <p className="text-subtitle mt-4 max-w-2xl">
            Tools and documentation to support your next project.
          </p>
        </div>
      </section>

      <section className="pb-section">
        <div className="container-gio">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <Link
                  href={item.href}
                  className="group block bg-gio-grey p-8 lg:p-10 transition-colors duration-300 hover:bg-gio-black"
                >
                  <h2 className="text-title text-gio-black group-hover:text-white transition-colors duration-300 mb-3">
                    {item.title}
                  </h2>
                  <p className="text-caption text-gio-black/50 group-hover:text-white/50 transition-colors duration-300 mb-6">
                    {item.description}
                  </p>
                  <span className="text-small tracking-[0.1em] uppercase text-gio-red group-hover:text-gio-red transition-colors duration-300">
                    {item.cta}
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </article>
  )
}
