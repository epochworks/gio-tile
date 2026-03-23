import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/sanity'
import PortableTextRenderer from '@/components/PortableTextRenderer'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Company',
  description:
    'About GIO Architectural Tile & Stone — tile collections curated expressly for commercial specifications.',
}

export default async function CompanyPage() {
  const page = await getPageBySlug('about')

  return (
    <article>
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">
            {page?.title || 'About GIO'}
          </h1>
        </div>
      </section>

      <section className="pb-section">
        <div className="container-gio">
          <div className="max-w-3xl">
            <ScrollReveal>
              {page?.body ? (
                <PortableTextRenderer value={page.body} />
              ) : (
                <p className="text-body-lg">
                  GIO Architectural Tile &amp; Stone curates premium tile
                  collections expressly for commercial specifications.
                </p>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
    </article>
  )
}
