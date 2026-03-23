import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/sanity'
import PortableTextRenderer from '@/components/PortableTextRenderer'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'GIO Architectural Tile & Stone privacy policy.',
}

export default async function PrivacyPage() {
  const page = await getPageBySlug('privacy-policy')

  return (
    <article>
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">
            {page?.title || 'Privacy Policy'}
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
                <p className="text-body-lg">Privacy policy content coming soon.</p>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
    </article>
  )
}
