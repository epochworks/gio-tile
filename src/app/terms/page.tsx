import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/sanity'
import PortableTextRenderer from '@/components/PortableTextRenderer'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'GIO Architectural Tile & Stone terms of use.',
}

export default async function TermsPage() {
  const page = await getPageBySlug('terms-of-use')

  return (
    <article>
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">
            {page?.title || 'Terms of Use'}
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
                <p className="text-body-lg">Terms of use content coming soon.</p>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
    </article>
  )
}
